const { PrismaClient } = require('@prisma/client');
const { nanoid } = require('nanoid');
const prisma = new PrismaClient();

const INVITE_TTL_MS = 14 * 24 * 60 * 60 * 1000;

const requireMembership = async (workspaceId, userId) => {
  const membership = await prisma.workspaceMember.findFirst({
    where: { workspaceId, userId },
  });

  if (!membership) {
    const error = new Error('Workspace access denied');
    error.status = 403;
    throw error;
  }

  return membership;
};

const requireAdmin = async (workspaceId, userId) => {
  const membership = await requireMembership(workspaceId, userId);
  if (!['owner', 'admin'].includes(membership.role)) {
    const error = new Error('Insufficient permissions');
    error.status = 403;
    throw error;
  }
  return membership;
};

const ensureOwnerRemaining = async (workspaceId, targetMemberId) => {
  const target = await prisma.workspaceMember.findUnique({
    where: { id: targetMemberId },
  });

  if (!target || target.workspaceId !== workspaceId) {
    const error = new Error('Member not found');
    error.status = 404;
    throw error;
  }

  if (target.role !== 'owner') {
    return target;
  }

  const ownerCount = await prisma.workspaceMember.count({
    where: { workspaceId, role: 'owner' },
  });

  if (ownerCount <= 1) {
    const error = new Error('At least one owner is required');
    error.status = 400;
    throw error;
  }

  return target;
};

exports.getAll = async (req, res, next) => {
  try {
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: req.userId },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            createdAt: true,
            updatedAt: true,
            _count: { select: { members: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const workspaces = memberships.map((membership) => ({
      id: membership.workspace.id,
      name: membership.workspace.name,
      createdAt: membership.workspace.createdAt,
      updatedAt: membership.workspace.updatedAt,
      role: membership.role,
      memberCount: membership.workspace._count.members,
    }));

    res.json({ workspaces });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    if (!name) {
      return res.status(400).json({ error: 'Workspace name is required' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name,
          createdById: req.userId,
        },
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: req.userId,
          role: 'owner',
        },
      });

      const user = await tx.user.findUnique({
        where: { id: req.userId },
        select: { defaultWorkspaceId: true },
      });

      if (!user?.defaultWorkspaceId) {
        await tx.user.update({
          where: { id: req.userId },
          data: { defaultWorkspaceId: workspace.id },
        });
      }

      await tx.auditLog.create({
        data: {
          workspaceId: workspace.id,
          actorId: req.userId,
          action: 'workspace.created',
          entityType: 'workspace',
          entityId: workspace.id,
          metadata: JSON.stringify({ name: workspace.name }),
        },
      });

      return workspace;
    });

    res.status(201).json({
      workspace: {
        id: result.id,
        name: result.name,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
        role: 'owner',
        memberCount: 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getMembers = async (req, res, next) => {
  try {
    const { id: workspaceId } = req.params;
    await requireMembership(workspaceId, req.userId);

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({
      members: members.map((member) => ({
        id: member.id,
        role: member.role,
        createdAt: member.createdAt,
        user: member.user,
      })),
    });
  } catch (error) {
    next(error);
  }
};

exports.addMember = async (req, res, next) => {
  try {
    const { id: workspaceId } = req.params;
    await requireAdmin(workspaceId, req.userId);

    const email = String(req.body.email || '').trim().toLowerCase();
    const role = String(req.body.role || 'member').toLowerCase();

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!['owner', 'admin', 'member'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const targetUser = await prisma.user.findUnique({ where: { email } });

    if (targetUser) {
      const existing = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: { workspaceId, userId: targetUser.id },
        },
      });

      if (existing) {
        return res.status(400).json({ error: 'That user is already in this workspace' });
      }

      const member = await prisma.workspaceMember.create({
        data: {
          workspaceId,
          userId: targetUser.id,
          role,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      });

      await prisma.workspaceInvite.deleteMany({
        where: { workspaceId, email },
      });

      await prisma.auditLog.create({
        data: {
          workspaceId,
          actorId: req.userId,
          action: 'workspace.member_added',
          entityType: 'user',
          entityId: targetUser.id,
          metadata: JSON.stringify({ role }),
        },
      });

      return res.status(201).json({
        member: {
          id: member.id,
          role: member.role,
          createdAt: member.createdAt,
          user: member.user,
        },
      });
    }

    const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

    const invite = await prisma.workspaceInvite.upsert({
      where: {
        workspaceId_email: { workspaceId, email },
      },
      create: {
        workspaceId,
        email,
        role,
        invitedById: req.userId,
        token: nanoid(32),
        expiresAt,
      },
      update: {
        role,
        invitedById: req.userId,
        token: nanoid(32),
        expiresAt,
      },
    });

    await prisma.auditLog.create({
      data: {
        workspaceId,
        actorId: req.userId,
        action: 'workspace.invite_sent',
        entityType: 'workspace_invite',
        entityId: invite.id,
        metadata: JSON.stringify({ email, role }),
      },
    });

    return res.status(201).json({
      invitation: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        expiresAt: invite.expiresAt,
        createdAt: invite.createdAt,
      },
      message:
        'Invitation saved. They will join automatically when they register or log in with this email.',
    });
  } catch (error) {
    next(error);
  }
};

exports.getWorkspaceInvites = async (req, res, next) => {
  try {
    const { id: workspaceId } = req.params;
    await requireAdmin(workspaceId, req.userId);

    const invites = await prisma.workspaceInvite.findMany({
      where: {
        workspaceId,
        expiresAt: { gt: new Date() },
      },
      include: {
        invitedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      invitations: invites.map((inv) => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        expiresAt: inv.expiresAt,
        createdAt: inv.createdAt,
        invitedBy: inv.invitedBy,
      })),
    });
  } catch (error) {
    next(error);
  }
};

exports.revokeWorkspaceInvite = async (req, res, next) => {
  try {
    const { id: workspaceId, inviteId } = req.params;
    await requireAdmin(workspaceId, req.userId);

    const inv = await prisma.workspaceInvite.findFirst({
      where: { id: inviteId, workspaceId },
    });

    if (!inv) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    await prisma.workspaceInvite.delete({ where: { id: inviteId } });

    await prisma.auditLog.create({
      data: {
        workspaceId,
        actorId: req.userId,
        action: 'workspace.invite_revoked',
        entityType: 'workspace_invite',
        entityId: inviteId,
        metadata: JSON.stringify({ email: inv.email }),
      },
    });

    res.json({ message: 'Invitation revoked' });
  } catch (error) {
    next(error);
  }
};

exports.getMyPendingInvitations = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { email: true },
    });

    if (!user?.email) {
      return res.json({ invitations: [] });
    }

    const emailNorm = user.email.trim().toLowerCase();

    const invites = await prisma.workspaceInvite.findMany({
      where: {
        email: emailNorm,
        expiresAt: { gt: new Date() },
      },
      include: {
        workspace: { select: { id: true, name: true } },
        invitedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      invitations: invites.map((i) => ({
        id: i.id,
        token: i.token,
        role: i.role,
        expiresAt: i.expiresAt,
        createdAt: i.createdAt,
        workspace: i.workspace,
        invitedBy: i.invitedBy,
      })),
    });
  } catch (error) {
    next(error);
  }
};

exports.acceptInvitationByToken = async (req, res, next) => {
  try {
    const { token } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { email: true },
    });

    const invite = await prisma.workspaceInvite.findUnique({
      where: { token },
      include: {
        workspace: { select: { id: true, name: true } },
      },
    });

    if (!invite || invite.expiresAt <= new Date()) {
      return res.status(404).json({ error: 'Invitation not found or expired' });
    }

    if (user.email.trim().toLowerCase() !== invite.email.toLowerCase()) {
      return res.status(403).json({
        error: 'This invitation was sent to a different email address than your account.',
      });
    }

    await prisma.$transaction(async (tx) => {
      const existing = await tx.workspaceMember.findUnique({
        where: {
          workspaceId_userId: { workspaceId: invite.workspaceId, userId: req.userId },
        },
      });

      await tx.workspaceInvite.delete({ where: { id: invite.id } });

      if (!existing) {
        await tx.workspaceMember.create({
          data: {
            workspaceId: invite.workspaceId,
            userId: req.userId,
            role: invite.role,
          },
        });

        await tx.auditLog.create({
          data: {
            workspaceId: invite.workspaceId,
            actorId: req.userId,
            action: 'workspace.invite_accepted',
            entityType: 'user',
            entityId: req.userId,
            metadata: JSON.stringify({ role: invite.role }),
          },
        });
      }
    });

    res.json({
      message: 'Joined workspace',
      workspaceId: invite.workspaceId,
      workspaceName: invite.workspace.name,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateMemberRole = async (req, res, next) => {
  try {
    const { id: workspaceId, memberId } = req.params;
    await requireAdmin(workspaceId, req.userId);

    const role = String(req.body.role || '').toLowerCase();
    if (!['owner', 'admin', 'member'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    await ensureOwnerRemaining(workspaceId, memberId);

    const member = await prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        workspaceId,
        actorId: req.userId,
        action: 'workspace.member_role_updated',
        entityType: 'user',
        entityId: member.userId,
        metadata: JSON.stringify({ role }),
      },
    });

    res.json({
      member: {
        id: member.id,
        role: member.role,
        createdAt: member.createdAt,
        user: member.user,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.removeMember = async (req, res, next) => {
  try {
    const { id: workspaceId, memberId } = req.params;
    await requireAdmin(workspaceId, req.userId);

    const target = await ensureOwnerRemaining(workspaceId, memberId);

    await prisma.workspaceMember.delete({ where: { id: memberId } });

    await prisma.auditLog.create({
      data: {
        workspaceId,
        actorId: req.userId,
        action: 'workspace.member_removed',
        entityType: 'user',
        entityId: target.userId,
      },
    });

    res.json({ message: 'Member removed' });
  } catch (error) {
    next(error);
  }
};

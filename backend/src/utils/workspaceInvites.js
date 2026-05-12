/**
 * Claim pending workspace invitations for this email (used after login / register / Google).
 */
async function acceptPendingInvitesForUser(prisma, userId, email) {
  const normalized = String(email || '')
    .trim()
    .toLowerCase();
  if (!normalized) return { acceptedCount: 0 };

  const invites = await prisma.workspaceInvite.findMany({
    where: {
      email: normalized,
      expiresAt: { gt: new Date() },
    },
  });

  let acceptedCount = 0;
  for (const inv of invites) {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.workspaceMember.findUnique({
        where: {
          workspaceId_userId: { workspaceId: inv.workspaceId, userId },
        },
      });

      await tx.workspaceInvite.delete({ where: { id: inv.id } });

      if (existing) {
        return;
      }

      await tx.workspaceMember.create({
        data: {
          workspaceId: inv.workspaceId,
          userId,
          role: inv.role,
        },
      });

      await tx.auditLog.create({
        data: {
          workspaceId: inv.workspaceId,
          actorId: userId,
          action: 'workspace.invite_accepted',
          entityType: 'user',
          entityId: userId,
          metadata: JSON.stringify({ email: normalized, role: inv.role }),
        },
      });

      acceptedCount += 1;
    });
  }

  return { acceptedCount };
}

module.exports = { acceptPendingInvitesForUser };

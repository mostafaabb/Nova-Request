const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getWorkspaceIdFromHeader = (req) => {
  const headerValue = req.headers['x-workspace-id'];
  if (!headerValue) return null;
  if (Array.isArray(headerValue)) return headerValue[0];
  return headerValue;
};

const resolveWorkspaceForUser = async (userId, preferredWorkspaceId) => {
  if (preferredWorkspaceId) {
    const membership = await prisma.workspaceMember.findFirst({
      where: { workspaceId: preferredWorkspaceId, userId },
      select: { workspaceId: true, role: true },
    });

    if (!membership) {
      const error = new Error('Workspace access denied');
      error.status = 403;
      throw error;
    }

    return membership;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { defaultWorkspaceId: true },
  });

  if (!user?.defaultWorkspaceId) {
    const error = new Error('Default workspace not found');
    error.status = 400;
    throw error;
  }

  const membership = await prisma.workspaceMember.findFirst({
    where: { workspaceId: user.defaultWorkspaceId, userId },
    select: { workspaceId: true, role: true },
  });

  if (!membership) {
    const error = new Error('Workspace access denied');
    error.status = 403;
    throw error;
  }

  return membership;
};

exports.requireWorkspace = async (req, res, next) => {
  try {
    const preferredWorkspaceId = getWorkspaceIdFromHeader(req);
    const membership = await resolveWorkspaceForUser(req.userId, preferredWorkspaceId);
    req.workspaceId = membership.workspaceId;
    req.workspaceRole = membership.role;
    next();
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    next(error);
  }
};

exports.optionalWorkspace = async (req, res, next) => {
  try {
    if (!req.userId) return next();
    const preferredWorkspaceId = getWorkspaceIdFromHeader(req);
    const membership = await resolveWorkspaceForUser(req.userId, preferredWorkspaceId);
    req.workspaceId = membership.workspaceId;
    req.workspaceRole = membership.role;
    next();
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    next(error);
  }
};

exports.requireWorkspaceAdmin = (req, res, next) => {
  if (req.workspaceRole === 'owner' || req.workspaceRole === 'admin') {
    return next();
  }
  return res.status(403).json({ error: 'Insufficient permissions' });
};

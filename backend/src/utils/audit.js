const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const logAudit = async ({ workspaceId, actorId, action, entityType, entityId, metadata }) => {
  if (!workspaceId) {
    throw new Error('Workspace ID is required for audit logging');
  }

  return prisma.auditLog.create({
    data: {
      workspaceId,
      actorId: actorId || null,
      action,
      entityType: entityType || null,
      entityId: entityId || null,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
};

module.exports = { logAudit };

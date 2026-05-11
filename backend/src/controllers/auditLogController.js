const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const safeParse = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

exports.getWorkspaceLogs = async (req, res, next) => {
  try {
    const { id: workspaceId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const membership = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: req.userId },
    });

    if (!membership) {
      return res.status(403).json({ error: 'Workspace access denied' });
    }

    const logs = await prisma.auditLog.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
      include: {
        actor: { select: { id: true, name: true, email: true } },
      },
    });

    res.json({
      logs: logs.map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        metadata: safeParse(log.metadata),
        createdAt: log.createdAt,
        actor: log.actor,
      })),
    });
  } catch (error) {
    next(error);
  }
};

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { parseJsonFields } = require('../utils/prisma-helpers');

exports.getAll = async (req, res, next) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const history = await prisma.requestHistory.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
      include: {
        endpoint: {
          select: { name: true }
        }
      }
    });

    const total = await prisma.requestHistory.count({
      where: { userId: req.userId }
    });

    res.json({ history: parseJsonFields(history), total });
  } catch (error) {
    next(error);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const { id } = req.params;

    const history = await prisma.requestHistory.findFirst({
      where: { id, userId: req.userId },
      include: {
        endpoint: {
          select: { name: true, collectionId: true }
        }
      }
    });

    if (!history) {
      return res.status(404).json({ error: 'History entry not found' });
    }

    res.json({ history: parseJsonFields(history) });
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.requestHistory.findFirst({
      where: { id, userId: req.userId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'History entry not found' });
    }

    await prisma.requestHistory.delete({ where: { id } });

    res.json({ message: 'History entry deleted' });
  } catch (error) {
    next(error);
  }
};

exports.clearAll = async (req, res, next) => {
  try {
    await prisma.requestHistory.deleteMany({
      where: { userId: req.userId }
    });

    res.json({ message: 'History cleared' });
  } catch (error) {
    next(error);
  }
};
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { parseJsonFields } = require('../utils/prisma-helpers');

exports.getSharedCollection = async (req, res, next) => {
  try {
    const { shareId } = req.params;

    const collection = await prisma.collection.findFirst({
      where: {
        shareId,
        isPublic: true
      },
      include: {
        endpoints: {
          orderBy: { order: 'asc' }
        },
        user: {
          select: { name: true }
        }
      }
    });

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found or not shared' });
    }

    res.json({
      collection: {
        id: collection.id,
        name: collection.name,
        description: collection.description,
        author: collection.user.name,
        endpoints: parseJsonFields(collection.endpoints),
        createdAt: collection.createdAt,
        updatedAt: collection.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};
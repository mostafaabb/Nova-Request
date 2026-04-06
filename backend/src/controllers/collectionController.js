const { PrismaClient } = require('@prisma/client');
const { nanoid } = require('nanoid');
const prisma = new PrismaClient();

exports.getAll = async (req, res, next) => {
  try {
    const collections = await prisma.collection.findMany({
      where: { userId: req.userId },
      include: {
        _count: {
          select: { endpoints: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({ collections });
  } catch (error) {
    next(error);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const { id } = req.params;

    const collection = await prisma.collection.findFirst({
      where: {
        id,
        userId: req.userId
      },
      include: {
        endpoints: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    res.json({ collection });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const collection = await prisma.collection.create({
      data: {
        name,
        description,
        userId: req.userId
      }
    });

    res.status(201).json({ collection });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Check ownership
    const existing = await prisma.collection.findFirst({
      where: { id, userId: req.userId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    const collection = await prisma.collection.update({
      where: { id },
      data: { name, description }
    });

    res.json({ collection });
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check ownership
    const existing = await prisma.collection.findFirst({
      where: { id, userId: req.userId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    await prisma.collection.delete({ where: { id } });

    res.json({ message: 'Collection deleted' });
  } catch (error) {
    next(error);
  }
};

exports.generateShareLink = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check ownership
    const existing = await prisma.collection.findFirst({
      where: { id, userId: req.userId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    // Generate unique share ID
    const shareId = nanoid(12);

    const collection = await prisma.collection.update({
      where: { id },
      data: {
        shareId,
        isPublic: true
      }
    });

    res.json({
      shareId: collection.shareId,
      shareUrl: `${process.env.FRONTEND_URL}/share/${collection.shareId}`
    });
  } catch (error) {
    next(error);
  }
};

exports.removeShareLink = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check ownership
    const existing = await prisma.collection.findFirst({
      where: { id, userId: req.userId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    await prisma.collection.update({
      where: { id },
      data: {
        shareId: null,
        isPublic: false
      }
    });

    res.json({ message: 'Share link removed' });
  } catch (error) {
    next(error);
  }
};

exports.exportCollection = async (req, res, next) => {
  try {
    const { id } = req.params;

    const collection = await prisma.collection.findFirst({
      where: { id, userId: req.userId },
      include: {
        endpoints: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    // Create export format
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      collection: {
        name: collection.name,
        description: collection.description,
        endpoints: collection.endpoints.map(ep => ({
          name: ep.name,
          description: ep.description,
          method: ep.method,
          url: ep.url,
          headers: ep.headers,
          queryParams: ep.queryParams,
          body: ep.body,
          bodyType: ep.bodyType,
          tags: ep.tags
        }))
      }
    };

    res.json(exportData);
  } catch (error) {
    next(error);
  }
};

exports.importCollection = async (req, res, next) => {
  try {
    const { collection: importData } = req.body;

    if (!importData || !importData.name) {
      return res.status(400).json({ error: 'Invalid import data' });
    }

    // Create collection
    const collection = await prisma.collection.create({
      data: {
        name: importData.name,
        description: importData.description || '',
        userId: req.userId,
        endpoints: {
          create: (importData.endpoints || []).map((ep, index) => ({
            name: ep.name || `Endpoint ${index + 1}`,
            description: ep.description,
            method: ep.method || 'GET',
            url: ep.url || '',
            headers: ep.headers || [],
            queryParams: ep.queryParams || [],
            body: ep.body,
            bodyType: ep.bodyType || 'json',
            tags: ep.tags || [],
            order: index
          }))
        }
      },
      include: {
        endpoints: true
      }
    });

    res.status(201).json({ collection });
  } catch (error) {
    next(error);
  }
};
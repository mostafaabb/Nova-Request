const { PrismaClient } = require('@prisma/client');
const { nanoid } = require('nanoid');
const { logAudit } = require('../utils/audit');
const { parseJsonFields } = require('../utils/prisma-helpers');
const prisma = new PrismaClient();

exports.getAll = async (req, res, next) => {
  try {
    const collections = await prisma.collection.findMany({
      where: {
        OR: [
          { workspaceId: req.workspaceId },
          { workspaceId: null, userId: req.userId }
        ]
      },
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
        OR: [
          { workspaceId: req.workspaceId },
          { workspaceId: null, userId: req.userId }
        ]
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

    res.json({
      collection: {
        ...collection,
        endpoints: collection.endpoints.map((ep) => parseJsonFields(ep)),
      },
    });
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
        userId: req.userId,
        workspaceId: req.workspaceId
      }
    });

    await logAudit({
      workspaceId: req.workspaceId,
      actorId: req.userId,
      action: 'collection.created',
      entityType: 'collection',
      entityId: collection.id,
      metadata: { name: collection.name }
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
      where: {
        id,
        OR: [
          { workspaceId: req.workspaceId },
          { workspaceId: null, userId: req.userId }
        ]
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    const collection = await prisma.collection.update({
      where: { id },
      data: { name, description }
    });

    await logAudit({
      workspaceId: existing.workspaceId || req.workspaceId,
      actorId: req.userId,
      action: 'collection.updated',
      entityType: 'collection',
      entityId: collection.id,
      metadata: { name: collection.name }
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
      where: {
        id,
        OR: [
          { workspaceId: req.workspaceId },
          { workspaceId: null, userId: req.userId }
        ]
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    await prisma.collection.delete({ where: { id } });

    await logAudit({
      workspaceId: existing.workspaceId || req.workspaceId,
      actorId: req.userId,
      action: 'collection.deleted',
      entityType: 'collection',
      entityId: id,
      metadata: { name: existing.name }
    });

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
      where: {
        id,
        OR: [
          { workspaceId: req.workspaceId },
          { workspaceId: null, userId: req.userId }
        ]
      }
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

    await logAudit({
      workspaceId: existing.workspaceId || req.workspaceId,
      actorId: req.userId,
      action: 'collection.shared',
      entityType: 'collection',
      entityId: collection.id,
      metadata: { shareId: collection.shareId }
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
      where: {
        id,
        OR: [
          { workspaceId: req.workspaceId },
          { workspaceId: null, userId: req.userId }
        ]
      }
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

    await logAudit({
      workspaceId: existing.workspaceId || req.workspaceId,
      actorId: req.userId,
      action: 'collection.unshared',
      entityType: 'collection',
      entityId: existing.id
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
      where: {
        id,
        OR: [
          { workspaceId: req.workspaceId },
          { workspaceId: null, userId: req.userId }
        ]
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

    // Create export format
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      collection: {
        name: collection.name,
        description: collection.description,
        endpoints: collection.endpoints.map((ep) => {
          const p = parseJsonFields(ep);
          return {
            name: ep.name,
            description: ep.description,
            method: ep.method,
            url: ep.url,
            headers: p.headers,
            queryParams: p.queryParams,
            body: ep.body,
            bodyType: ep.bodyType,
            tags: p.tags,
            auth: p.auth ?? null,
            formFields: p.formFields ?? null,
            preRequestScript: ep.preRequestScript,
            postRequestScript: ep.postRequestScript,
            tests: p.tests ?? null,
          };
        })
      }
    };

    await logAudit({
      workspaceId: collection.workspaceId || req.workspaceId,
      actorId: req.userId,
      action: 'collection.exported',
      entityType: 'collection',
      entityId: collection.id,
      metadata: { name: collection.name }
    });

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
        workspaceId: req.workspaceId,
        endpoints: {
          create: (importData.endpoints || []).map((ep, index) => ({
            name: ep.name || `Endpoint ${index + 1}`,
            description: ep.description,
            method: ep.method || 'GET',
            url: ep.url || '',
            headers:
              typeof ep.headers === 'string'
                ? ep.headers
                : JSON.stringify(ep.headers || []),
            queryParams:
              typeof ep.queryParams === 'string'
                ? ep.queryParams
                : JSON.stringify(ep.queryParams || []),
            body: ep.body,
            bodyType: ep.bodyType || 'json',
            auth: ep.auth ?? null,
            formFields: ep.formFields ?? null,
            preRequestScript: ep.preRequestScript ?? null,
            postRequestScript: ep.postRequestScript ?? null,
            tests: Array.isArray(ep.tests)
              ? JSON.stringify(ep.tests)
              : ep.tests || null,
            tags:
              typeof ep.tags === 'string'
                ? ep.tags
                : JSON.stringify(ep.tags || []),
            order: index
          }))
        }
      },
      include: {
        endpoints: true
      }
    });

    await logAudit({
      workspaceId: req.workspaceId,
      actorId: req.userId,
      action: 'collection.imported',
      entityType: 'collection',
      entityId: collection.id,
      metadata: { name: collection.name, endpoints: collection.endpoints.length }
    });

    res.status(201).json({ collection });
  } catch (error) {
    next(error);
  }
};

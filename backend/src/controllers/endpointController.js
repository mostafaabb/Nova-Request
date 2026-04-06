const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { parseJsonFields } = require('../utils/prisma-helpers');

exports.getAll = async (req, res, next) => {
  try {
    const { collectionId } = req.params;

    // Check collection ownership
    const collection = await prisma.collection.findFirst({
      where: { id: collectionId, userId: req.userId }
    });

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    const endpoints = await prisma.endpoint.findMany({
      where: { collectionId },
      orderBy: { order: 'asc' }
    });

    res.json({ endpoints: parseJsonFields(endpoints) });
  } catch (error) {
    next(error);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const { id } = req.params;

    const endpoint = await prisma.endpoint.findUnique({
      where: { id },
      include: {
        collection: {
          select: { userId: true }
        }
      }
    });

    if (!endpoint || endpoint.collection.userId !== req.userId) {
      return res.status(404).json({ error: 'Endpoint not found' });
    }

    res.json({ endpoint: parseJsonFields(endpoint) });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { collectionId } = req.params;
    const { name, description, method, url, headers, queryParams, body, bodyType, tags } = req.body;

    // Check collection ownership
    const collection = await prisma.collection.findFirst({
      where: { id: collectionId, userId: req.userId }
    });

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    // Get max order
    const maxOrder = await prisma.endpoint.aggregate({
      where: { collectionId },
      _max: { order: true }
    });

    const endpoint = await prisma.endpoint.create({
      data: {
        collectionId,
        name,
        description,
        method: method || 'GET',
        url,
        headers: JSON.stringify(headers || []),
        queryParams: JSON.stringify(queryParams || []),
        body,
        bodyType: bodyType || 'json',
        tags: JSON.stringify(tags || []),
        order: (maxOrder._max.order || 0) + 1
      }
    });

    res.status(201).json({ endpoint: parseJsonFields(endpoint) });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, method, url, headers, queryParams, body, bodyType, tags, order } = req.body;

    // Check ownership
    const existing = await prisma.endpoint.findUnique({
      where: { id },
      include: {
        collection: { select: { userId: true } }
      }
    });

    if (!existing || existing.collection.userId !== req.userId) {
      return res.status(404).json({ error: 'Endpoint not found' });
    }

    const endpoint = await prisma.endpoint.update({
      where: { id },
      data: {
        name,
        description,
        method,
        url,
        headers: JSON.stringify(headers),
        queryParams: JSON.stringify(queryParams),
        body,
        bodyType,
        tags: JSON.stringify(tags),
        order
      }
    });

    res.json({ endpoint: parseJsonFields(endpoint) });
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check ownership
    const existing = await prisma.endpoint.findUnique({
      where: { id },
      include: {
        collection: { select: { userId: true } }
      }
    });

    if (!existing || existing.collection.userId !== req.userId) {
      return res.status(404).json({ error: 'Endpoint not found' });
    }

    await prisma.endpoint.delete({ where: { id } });

    res.json({ message: 'Endpoint deleted' });
  } catch (error) {
    next(error);
  }
};

exports.duplicate = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get original endpoint
    const original = await prisma.endpoint.findUnique({
      where: { id },
      include: {
        collection: { select: { userId: true } }
      }
    });

    if (!original || original.collection.userId !== req.userId) {
      return res.status(404).json({ error: 'Endpoint not found' });
    }

    // Get max order
    const maxOrder = await prisma.endpoint.aggregate({
      where: { collectionId: original.collectionId },
      _max: { order: true }
    });

    // Create duplicate
    const duplicate = await prisma.endpoint.create({
      data: {
        collectionId: original.collectionId,
        name: `${original.name} (copy)`,
        description: original.description,
        method: original.method,
        url: original.url,
        headers: original.headers,
        queryParams: original.queryParams,
        body: original.body,
        bodyType: original.bodyType,
        tags: original.tags,
        order: (maxOrder._max.order || 0) + 1
      }
    });

    res.status(201).json({ endpoint: parseJsonFields(duplicate) });
  } catch (error) {
    next(error);
  }
};
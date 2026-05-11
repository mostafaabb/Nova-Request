const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAll = async (req, res, next) => {
  try {
    const { id: workspaceId } = req.params;

    const environments = await prisma.environment.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'asc' },
    });

    res.json({
      environments: environments.map((env) => ({
        ...env,
        variables: JSON.parse(env.variables || '{}'),
      })),
    });
  } catch (error) {
    next(error);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const { id: workspaceId, envId } = req.params;

    const environment = await prisma.environment.findFirst({
      where: { id: envId, workspaceId },
    });

    if (!environment) {
      return res.status(404).json({ error: 'Environment not found' });
    }

    res.json({
      environment: {
        ...environment,
        variables: JSON.parse(environment.variables || '{}'),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { id: workspaceId } = req.params;
    const { name, variables } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Environment name is required' });
    }

    const environment = await prisma.environment.create({
      data: {
        workspaceId,
        name: name.trim(),
        variables: JSON.stringify(variables || {}),
      },
    });

    res.status(201).json({
      environment: {
        ...environment,
        variables: JSON.parse(environment.variables || '{}'),
      },
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Environment name already exists' });
    }
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id: workspaceId, envId } = req.params;
    const { name, variables } = req.body;

    const environment = await prisma.environment.update({
      where: { id: envId },
      data: {
        ...(name && { name: name.trim() }),
        ...(variables && { variables: JSON.stringify(variables) }),
      },
    });

    res.json({
      environment: {
        ...environment,
        variables: JSON.parse(environment.variables || '{}'),
      },
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Environment name already exists' });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Environment not found' });
    }
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const { id: workspaceId, envId } = req.params;

    await prisma.environment.delete({
      where: { id: envId },
    });

    res.json({ message: 'Environment deleted' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Environment not found' });
    }
    next(error);
  }
};

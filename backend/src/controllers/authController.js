const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const googleClient = process.env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  : null;

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

const ensureDefaultWorkspace = async (userId, userName) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { defaultWorkspaceId: true, name: true }
  });

  if (user?.defaultWorkspaceId) {
    return user.defaultWorkspaceId;
  }

  const workspaceName = `${userName || user?.name || 'My'} Workspace`;

  const workspace = await prisma.$transaction(async (tx) => {
    const created = await tx.workspace.create({
      data: {
        name: workspaceName,
        createdById: userId
      }
    });

    await tx.workspaceMember.create({
      data: {
        workspaceId: created.id,
        userId,
        role: 'owner'
      }
    });

    await tx.user.update({
      where: { id: userId },
      data: { defaultWorkspaceId: created.id }
    });

    await tx.auditLog.create({
      data: {
        workspaceId: created.id,
        actorId: userId,
        action: 'workspace.created',
        entityType: 'workspace',
        entityId: created.id,
        metadata: JSON.stringify({ name: created.name })
      }
    });

    return created;
  });

  return workspace.id;
};

exports.register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user and default workspace
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true
        }
      });

      const workspace = await tx.workspace.create({
        data: {
          name: `${newUser.name}'s Workspace`,
          createdById: newUser.id
        }
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: newUser.id,
          role: 'owner'
        }
      });

      await tx.user.update({
        where: { id: newUser.id },
        data: { defaultWorkspaceId: workspace.id }
      });

      await tx.auditLog.create({
        data: {
          workspaceId: workspace.id,
          actorId: newUser.id,
          action: 'workspace.created',
          entityType: 'workspace',
          entityId: workspace.id,
          metadata: JSON.stringify({ name: workspace.name })
        }
      });

      return { user: newUser, workspaceId: workspace.id };
    });

    // Generate token
    const token = generateToken(result.user.id);

    res.status(201).json({
      message: 'User registered successfully',
      user: { ...result.user, defaultWorkspaceId: result.workspaceId },
      token
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.password) {
      return res.status(401).json({
        error: 'This account uses Google sign-in. Use Continue with Google instead.'
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user.id);

    const defaultWorkspaceId = await ensureDefaultWorkspace(user.id, user.name);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        defaultWorkspaceId
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

exports.googleAuth = async (req, res, next) => {
  try {
    if (!googleClient || !process.env.GOOGLE_CLIENT_ID) {
      return res.status(503).json({ error: 'Google sign-in is not configured on this server' });
    }

    const { credential } = req.body;

    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID
      });
    } catch {
      return res.status(401).json({ error: 'Invalid or expired Google sign-in' });
    }

    const payload = ticket.getPayload();
    if (!payload?.email) {
      return res.status(401).json({ error: 'Google did not return an email address' });
    }

    if (payload.email_verified === false) {
      return res.status(401).json({ error: 'Verify your email with Google before continuing' });
    }

    const googleId = payload.sub;
    const email = payload.email.trim().toLowerCase();
    const name =
      (payload.name && payload.name.trim()) ||
      email.split('@')[0];

    let user = await prisma.user.findUnique({
      where: { googleId }
    });

    if (!user) {
      const byEmail = await prisma.user.findUnique({
        where: { email }
      });

      if (byEmail) {
        if (byEmail.googleId && byEmail.googleId !== googleId) {
          return res.status(409).json({ error: 'This email is already linked to another sign-in method' });
        }
        user = await prisma.user.update({
          where: { id: byEmail.id },
          data: { googleId },
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
            defaultWorkspaceId: true
          }
        });
      }
    }

    if (!user) {
      const result = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email,
            name,
            googleId,
            password: null
          },
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true
          }
        });

        const workspace = await tx.workspace.create({
          data: {
            name: `${newUser.name}'s Workspace`,
            createdById: newUser.id
          }
        });

        await tx.workspaceMember.create({
          data: {
            workspaceId: workspace.id,
            userId: newUser.id,
            role: 'owner'
          }
        });

        await tx.user.update({
          where: { id: newUser.id },
          data: { defaultWorkspaceId: workspace.id }
        });

        await tx.auditLog.create({
          data: {
            workspaceId: workspace.id,
            actorId: newUser.id,
            action: 'workspace.created',
            entityType: 'workspace',
            entityId: workspace.id,
            metadata: JSON.stringify({ name: workspace.name })
          }
        });

        return { user: newUser, workspaceId: workspace.id };
      });

      user = { ...result.user, defaultWorkspaceId: result.workspaceId };
    }

    const token = generateToken(user.id);
    const defaultWorkspaceId =
      user.defaultWorkspaceId || (await ensureDefaultWorkspace(user.id, user.name));

    res.json({
      message: 'Signed in with Google',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        defaultWorkspaceId
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

exports.me = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        defaultWorkspaceId: true,
        createdAt: true,
        _count: {
          select: {
            collections: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const defaultWorkspaceId = user.defaultWorkspaceId || await ensureDefaultWorkspace(user.id, user.name);

    res.json({ user: { ...user, defaultWorkspaceId } });
  } catch (error) {
    next(error);
  }
};

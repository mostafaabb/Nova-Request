/**
 * Live API Tester - Complete Project Generator
 * 
 * Run this script to generate the entire project:
 *   node generate-project.js
 * 
 * This will create:
 * - /backend - Express.js API with Prisma
 * - /frontend - Next.js application
 */

const fs = require('fs');
const path = require('path');

const BASE_DIR = __dirname;

// ============================================
// FILE CONTENTS - BACKEND
// ============================================

const files = {
  // Backend package.json
  'backend/package.json': `{
  "name": "live-api-tester-backend",
  "version": "1.0.0",
  "description": "Backend API for Live API Tester",
  "main": "src/index.js",
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "test": "jest"
  },
  "dependencies": {
    "@prisma/client": "^5.10.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.18.3",
    "express-validator": "^7.0.1",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "morgan": "^1.10.0",
    "nanoid": "^3.3.7",
    "axios": "^1.6.7"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "nodemon": "^3.1.0",
    "prisma": "^5.10.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}`,

  // Backend .env.example
  'backend/.env.example': `# Database
DATABASE_URL="postgresql://user:password@localhost:5432/api_tester?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=5000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL="http://localhost:3000"`,

  // Backend .gitignore
  'backend/.gitignore': `node_modules/
.env
dist/
coverage/
*.log
.DS_Store`,

  // Prisma Schema
  'backend/prisma/schema.prisma': `// Prisma Schema for Live API Tester

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String         @id @default(uuid())
  email        String         @unique
  password     String
  name         String
  createdAt    DateTime       @default(now()) @map("created_at")
  updatedAt    DateTime       @updatedAt @map("updated_at")
  
  collections  Collection[]
  history      RequestHistory[]

  @@map("users")
}

model Collection {
  id          String     @id @default(uuid())
  userId      String     @map("user_id")
  name        String
  description String?
  shareId     String?    @unique @map("share_id")
  isPublic    Boolean    @default(false) @map("is_public")
  createdAt   DateTime   @default(now()) @map("created_at")
  updatedAt   DateTime   @updatedAt @map("updated_at")
  
  user        User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  endpoints   Endpoint[]

  @@index([userId])
  @@index([shareId])
  @@map("collections")
}

model Endpoint {
  id           String     @id @default(uuid())
  collectionId String     @map("collection_id")
  name         String
  description  String?
  method       String     @default("GET")
  url          String
  headers      Json?      @default("[]")
  queryParams  Json?      @default("[]") @map("query_params")
  body         String?
  bodyType     String     @default("json") @map("body_type")
  tags         String[]   @default([])
  order        Int        @default(0)
  createdAt    DateTime   @default(now()) @map("created_at")
  updatedAt    DateTime   @updatedAt @map("updated_at")
  
  collection   Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  history      RequestHistory[]

  @@index([collectionId])
  @@map("endpoints")
}

model RequestHistory {
  id              String   @id @default(uuid())
  userId          String   @map("user_id")
  endpointId      String?  @map("endpoint_id")
  method          String
  url             String
  headers         Json?
  body            String?
  responseStatus  Int?     @map("response_status")
  responseBody    String?  @map("response_body")
  responseHeaders Json?    @map("response_headers")
  responseTime    Int?     @map("response_time")
  createdAt       DateTime @default(now()) @map("created_at")
  
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  endpoint        Endpoint? @relation(fields: [endpointId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([createdAt])
  @@map("request_history")
}`,

  // Backend index.js (entry point)
  'backend/src/index.js': `require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/auth');
const collectionRoutes = require('./routes/collections');
const endpointRoutes = require('./routes/endpoints');
const proxyRoutes = require('./routes/proxy');
const historyRoutes = require('./routes/history');
const shareRoutes = require('./routes/share');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/endpoints', endpointRoutes);
app.use('/api/proxy', proxyRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/share', shareRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(\`🚀 Server running on http://localhost:\${PORT}\`);
});

module.exports = app;`,

  // Auth Controller
  'backend/src/controllers/authController.js': `const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
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

    // Create user
    const user = await prisma.user.create({
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

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      message: 'User registered successfully',
      user,
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

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user.id);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
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

    res.json({ user });
  } catch (error) {
    next(error);
  }
};`,

  // Collection Controller
  'backend/src/controllers/collectionController.js': `const { PrismaClient } = require('@prisma/client');
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
      shareUrl: \`\${process.env.FRONTEND_URL}/share/\${collection.shareId}\`
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
            name: ep.name || \`Endpoint \${index + 1}\`,
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
};`,

  // Endpoint Controller
  'backend/src/controllers/endpointController.js': `const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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

    res.json({ endpoints });
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

    res.json({ endpoint });
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
        headers: headers || [],
        queryParams: queryParams || [],
        body,
        bodyType: bodyType || 'json',
        tags: tags || [],
        order: (maxOrder._max.order || 0) + 1
      }
    });

    res.status(201).json({ endpoint });
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
        headers,
        queryParams,
        body,
        bodyType,
        tags,
        order
      }
    });

    res.json({ endpoint });
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
        name: \`\${original.name} (copy)\`,
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

    res.status(201).json({ endpoint: duplicate });
  } catch (error) {
    next(error);
  }
};`,

  // Proxy Controller
  'backend/src/controllers/proxyController.js': `const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.executeRequest = async (req, res, next) => {
  try {
    const { method, url, headers, body, timeout = 30000, saveToHistory = true, endpointId } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const startTime = Date.now();

    // Build request config
    const config = {
      method: method || 'GET',
      url,
      timeout,
      validateStatus: () => true, // Don't throw on any status
      headers: {}
    };

    // Add headers
    if (headers && Array.isArray(headers)) {
      headers.forEach(h => {
        if (h.key && h.enabled !== false) {
          config.headers[h.key] = h.value;
        }
      });
    }

    // Add body for non-GET requests
    if (body && method !== 'GET') {
      config.data = body;
      
      // Set Content-Type if not already set
      if (!config.headers['Content-Type'] && !config.headers['content-type']) {
        config.headers['Content-Type'] = 'application/json';
      }
    }

    // Execute request
    let response;
    try {
      response = await axios(config);
    } catch (axiosError) {
      // Handle network errors
      const responseTime = Date.now() - startTime;
      
      return res.json({
        success: false,
        error: {
          message: axiosError.message,
          code: axiosError.code
        },
        responseTime
      });
    }

    const responseTime = Date.now() - startTime;

    // Format response
    const result = {
      success: true,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      responseTime
    };

    // Save to history if user is logged in
    if (saveToHistory && req.userId) {
      try {
        await prisma.requestHistory.create({
          data: {
            userId: req.userId,
            endpointId: endpointId || null,
            method: config.method,
            url,
            headers: headers || [],
            body: typeof body === 'string' ? body : JSON.stringify(body),
            responseStatus: response.status,
            responseBody: typeof response.data === 'string' 
              ? response.data.substring(0, 50000) // Limit stored response
              : JSON.stringify(response.data).substring(0, 50000),
            responseHeaders: response.headers,
            responseTime
          }
        });
      } catch (historyError) {
        console.error('Failed to save history:', historyError);
      }
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};`,

  // History Controller
  'backend/src/controllers/historyController.js': `const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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

    res.json({ history, total });
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

    res.json({ history });
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
};`,

  // Share Controller
  'backend/src/controllers/shareController.js': `const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
        endpoints: collection.endpoints,
        createdAt: collection.createdAt,
        updatedAt: collection.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};`,

  // Auth Middleware
  'backend/src/middleware/auth.js': `const jwt = require('jsonwebtoken');

exports.authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = decoded.userId;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    next(error);
  }
};

// Optional auth - sets userId if token present, continues anyway
exports.optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.userId;
    }

    next();
  } catch (error) {
    // Ignore token errors for optional auth
    next();
  }
};`,

  // Error Handler Middleware
  'backend/src/middleware/errorHandler.js': `exports.errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(400).json({
      error: 'A record with this value already exists'
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'Record not found'
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: err.message
    });
  }

  // JWT errors handled in auth middleware

  // Default error
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
};`,

  // Validation Middleware
  'backend/src/middleware/validate.js': `const { validationResult } = require('express-validator');

exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  
  next();
};`,

  // Auth Routes
  'backend/src/routes/auth.js': `const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// Register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().isLength({ min: 2 }),
  validate
], authController.register);

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists(),
  validate
], authController.login);

// Get current user
router.get('/me', authenticate, authController.me);

module.exports = router;`,

  // Collection Routes
  'backend/src/routes/collections.js': `const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const collectionController = require('../controllers/collectionController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// All routes require authentication
router.use(authenticate);

// Get all collections
router.get('/', collectionController.getAll);

// Get one collection
router.get('/:id', collectionController.getOne);

// Create collection
router.post('/', [
  body('name').trim().isLength({ min: 1 }),
  validate
], collectionController.create);

// Update collection
router.put('/:id', [
  body('name').optional().trim().isLength({ min: 1 }),
  validate
], collectionController.update);

// Delete collection
router.delete('/:id', collectionController.delete);

// Generate share link
router.post('/:id/share', collectionController.generateShareLink);

// Remove share link
router.delete('/:id/share', collectionController.removeShareLink);

// Export collection
router.get('/:id/export', collectionController.exportCollection);

// Import collection
router.post('/import', collectionController.importCollection);

module.exports = router;`,

  // Endpoint Routes
  'backend/src/routes/endpoints.js': `const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const endpointController = require('../controllers/endpointController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// All routes require authentication
router.use(authenticate);

// Get all endpoints for a collection
router.get('/collection/:collectionId', endpointController.getAll);

// Get one endpoint
router.get('/:id', endpointController.getOne);

// Create endpoint
router.post('/collection/:collectionId', [
  body('name').trim().isLength({ min: 1 }),
  body('url').trim().isLength({ min: 1 }),
  validate
], endpointController.create);

// Update endpoint
router.put('/:id', endpointController.update);

// Delete endpoint
router.delete('/:id', endpointController.delete);

// Duplicate endpoint
router.post('/:id/duplicate', endpointController.duplicate);

module.exports = router;`,

  // Proxy Routes
  'backend/src/routes/proxy.js': `const express = require('express');
const router = express.Router();
const proxyController = require('../controllers/proxyController');
const { optionalAuth } = require('../middleware/auth');

// Optional auth - saves to history if logged in
router.post('/', optionalAuth, proxyController.executeRequest);

module.exports = router;`,

  // History Routes
  'backend/src/routes/history.js': `const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Get all history
router.get('/', historyController.getAll);

// Get one history entry
router.get('/:id', historyController.getOne);

// Delete one history entry
router.delete('/:id', historyController.delete);

// Clear all history
router.delete('/', historyController.clearAll);

module.exports = router;`,

  // Share Routes
  'backend/src/routes/share.js': `const express = require('express');
const router = express.Router();
const shareController = require('../controllers/shareController');

// Get shared collection (public)
router.get('/:shareId', shareController.getSharedCollection);

module.exports = router;`,

// ============================================
// FRONTEND FILES
// ============================================

  // Frontend package.json
  'frontend/package.json': `{
  "name": "live-api-tester-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "axios": "^1.6.7",
    "zustand": "^4.5.1",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.1",
    "lucide-react": "^0.344.0",
    "react-json-view-lite": "^1.2.1",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-toast": "^1.1.5",
    "react-hot-toast": "^2.4.1"
  },
  "devDependencies": {
    "@types/node": "^20.11.20",
    "@types/react": "^18.2.58",
    "@types/react-dom": "^18.2.19",
    "autoprefixer": "^10.4.17",
    "eslint": "^8.57.0",
    "eslint-config-next": "14.1.0",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.3.3"
  }
}`,

  // Frontend .env.example
  'frontend/.env.example': `NEXT_PUBLIC_API_URL=http://localhost:5000/api`,

  // Frontend .gitignore
  'frontend/.gitignore': `node_modules/
.next/
out/
.env
.env.local
*.log
.DS_Store`,

  // Next.js config
  'frontend/next.config.js': `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = nextConfig`,

  // TypeScript config
  'frontend/tsconfig.json': `{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}`,

  // Tailwind config
  'frontend/tailwind.config.ts': `import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
}
export default config`,

  // PostCSS config
  'frontend/postcss.config.js': `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,

  // Global CSS
  'frontend/src/app/globals.css': `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222 47% 11%;
    --muted: 210 40% 96%;
    --muted-foreground: 215 16% 47%;
    --border: 214 32% 91%;
    --input: 214 32% 91%;
    --ring: 222 47% 11%;
    --primary: 222 47% 11%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222 47% 11%;
    --accent: 210 40% 96%;
    --accent-foreground: 222 47% 11%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 210 40% 98%;
    --success: 142 76% 36%;
    --success-foreground: 210 40% 98%;
    --warning: 38 92% 50%;
    --warning-foreground: 222 47% 11%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222 47% 11%;
    --foreground: 210 40% 98%;
    --muted: 217 33% 17%;
    --muted-foreground: 215 20% 65%;
    --border: 217 33% 17%;
    --input: 217 33% 17%;
    --ring: 212 100% 48%;
    --primary: 212 100% 48%;
    --primary-foreground: 210 40% 98%;
    --secondary: 217 33% 17%;
    --secondary-foreground: 210 40% 98%;
    --accent: 217 33% 17%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 63% 31%;
    --destructive-foreground: 210 40% 98%;
    --success: 142 76% 36%;
    --success-foreground: 210 40% 98%;
    --warning: 38 92% 50%;
    --warning-foreground: 222 47% 11%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

/* JSON Viewer Styles */
.json-viewer {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  @apply bg-muted;
}

::-webkit-scrollbar-thumb {
  @apply bg-muted-foreground/30 rounded-full;
}

::-webkit-scrollbar-thumb:hover {
  @apply bg-muted-foreground/50;
}

/* Method colors */
.method-get { @apply text-green-500; }
.method-post { @apply text-blue-500; }
.method-put { @apply text-orange-500; }
.method-patch { @apply text-purple-500; }
.method-delete { @apply text-red-500; }

/* Status code colors */
.status-2xx { @apply text-green-500; }
.status-3xx { @apply text-blue-500; }
.status-4xx { @apply text-orange-500; }
.status-5xx { @apply text-red-500; }`,

  // Root layout
  'frontend/src/app/layout.tsx': `import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from '@/components/ThemeProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Live API Tester',
  description: 'A modern browser-based API testing tool',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          {children}
          <Toaster 
            position="bottom-right"
            toastOptions={{
              className: 'bg-background text-foreground border border-border',
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}`,

  // Home page (redirect to dashboard)
  'frontend/src/app/page.tsx': `import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/dashboard')
}`,

  // Types
  'frontend/src/types/index.ts': `export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  shareId?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  endpoints?: Endpoint[];
  _count?: {
    endpoints: number;
  };
}

export interface Endpoint {
  id: string;
  collectionId: string;
  name: string;
  description?: string;
  method: HttpMethod;
  url: string;
  headers: KeyValuePair[];
  queryParams: KeyValuePair[];
  body?: string;
  bodyType: BodyType;
  tags: string[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface KeyValuePair {
  key: string;
  value: string;
  enabled: boolean;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type BodyType = 'json' | 'form-data' | 'raw' | 'none';

export interface RequestHistory {
  id: string;
  method: string;
  url: string;
  headers?: KeyValuePair[];
  body?: string;
  responseStatus?: number;
  responseBody?: string;
  responseHeaders?: Record<string, string>;
  responseTime?: number;
  createdAt: string;
  endpoint?: {
    name: string;
  };
}

export interface ApiResponse {
  success: boolean;
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  data?: any;
  responseTime?: number;
  error?: {
    message: string;
    code?: string;
  };
}`,

  // API client
  'frontend/src/lib/api.ts': `import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = \`Bearer \${token}\`;
    }
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Redirect to login if not already there
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/auth/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authApi = {
  register: (data: { email: string; password: string; name: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// Collection APIs
export const collectionApi = {
  getAll: () => api.get('/collections'),
  getOne: (id: string) => api.get(\`/collections/\${id}\`),
  create: (data: { name: string; description?: string }) =>
    api.post('/collections', data),
  update: (id: string, data: { name?: string; description?: string }) =>
    api.put(\`/collections/\${id}\`, data),
  delete: (id: string) => api.delete(\`/collections/\${id}\`),
  generateShareLink: (id: string) => api.post(\`/collections/\${id}/share\`),
  removeShareLink: (id: string) => api.delete(\`/collections/\${id}/share\`),
  export: (id: string) => api.get(\`/collections/\${id}/export\`),
  import: (data: any) => api.post('/collections/import', data),
};

// Endpoint APIs
export const endpointApi = {
  getAll: (collectionId: string) =>
    api.get(\`/endpoints/collection/\${collectionId}\`),
  getOne: (id: string) => api.get(\`/endpoints/\${id}\`),
  create: (collectionId: string, data: any) =>
    api.post(\`/endpoints/collection/\${collectionId}\`, data),
  update: (id: string, data: any) => api.put(\`/endpoints/\${id}\`, data),
  delete: (id: string) => api.delete(\`/endpoints/\${id}\`),
  duplicate: (id: string) => api.post(\`/endpoints/\${id}/duplicate\`),
};

// Proxy API (for executing requests)
export const proxyApi = {
  execute: (data: {
    method: string;
    url: string;
    headers?: any[];
    body?: any;
    timeout?: number;
    endpointId?: string;
  }) => api.post('/proxy', data),
};

// History APIs
export const historyApi = {
  getAll: (params?: { limit?: number; offset?: number }) =>
    api.get('/history', { params }),
  getOne: (id: string) => api.get(\`/history/\${id}\`),
  delete: (id: string) => api.delete(\`/history/\${id}\`),
  clearAll: () => api.delete('/history'),
};

// Share API (public)
export const shareApi = {
  getCollection: (shareId: string) => api.get(\`/share/\${shareId}\`),
};

export default api;`,

  // Utils
  'frontend/src/lib/utils.ts': `import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatResponseTime(ms: number): string {
  if (ms < 1000) {
    return \`\${ms}ms\`;
  }
  return \`\${(ms / 1000).toFixed(2)}s\`;
}

export function getStatusColor(status: number): string {
  if (status >= 200 && status < 300) return 'status-2xx';
  if (status >= 300 && status < 400) return 'status-3xx';
  if (status >= 400 && status < 500) return 'status-4xx';
  return 'status-5xx';
}

export function getMethodColor(method: string): string {
  const colors: Record<string, string> = {
    GET: 'method-get',
    POST: 'method-post',
    PUT: 'method-put',
    PATCH: 'method-patch',
    DELETE: 'method-delete',
  };
  return colors[method.toUpperCase()] || '';
}

export function formatJson(data: any): string {
  try {
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

export function parseJson(str: string): any {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function downloadJson(data: any, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}`,

  // Auth Store
  'frontend/src/store/authStore.ts': `import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import { authApi } from '@/lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: true,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        const response = await authApi.login({ email, password });
        const { user, token } = response.data;
        
        localStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true });
      },

      register: async (email: string, password: string, name: string) => {
        const response = await authApi.register({ email, password, name });
        const { user, token } = response.data;
        
        localStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
      },

      checkAuth: async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            set({ isLoading: false, isAuthenticated: false });
            return;
          }

          const response = await authApi.me();
          set({ 
            user: response.data.user, 
            token, 
            isAuthenticated: true, 
            isLoading: false 
          });
        } catch {
          localStorage.removeItem('token');
          set({ 
            user: null, 
            token: null, 
            isAuthenticated: false, 
            isLoading: false 
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
);`,

  // Request Store
  'frontend/src/store/requestStore.ts': `import { create } from 'zustand';
import { HttpMethod, KeyValuePair, BodyType, ApiResponse } from '@/types';
import { proxyApi } from '@/lib/api';

interface RequestState {
  // Current request
  method: HttpMethod;
  url: string;
  headers: KeyValuePair[];
  queryParams: KeyValuePair[];
  body: string;
  bodyType: BodyType;
  
  // Response
  response: ApiResponse | null;
  isLoading: boolean;
  
  // Actions
  setMethod: (method: HttpMethod) => void;
  setUrl: (url: string) => void;
  setHeaders: (headers: KeyValuePair[]) => void;
  setQueryParams: (params: KeyValuePair[]) => void;
  setBody: (body: string) => void;
  setBodyType: (type: BodyType) => void;
  addHeader: () => void;
  removeHeader: (index: number) => void;
  updateHeader: (index: number, field: 'key' | 'value' | 'enabled', value: string | boolean) => void;
  addQueryParam: () => void;
  removeQueryParam: (index: number) => void;
  updateQueryParam: (index: number, field: 'key' | 'value' | 'enabled', value: string | boolean) => void;
  sendRequest: (endpointId?: string) => Promise<void>;
  clearResponse: () => void;
  loadEndpoint: (endpoint: any) => void;
  reset: () => void;
}

const initialState = {
  method: 'GET' as HttpMethod,
  url: '',
  headers: [{ key: '', value: '', enabled: true }],
  queryParams: [{ key: '', value: '', enabled: true }],
  body: '',
  bodyType: 'json' as BodyType,
  response: null,
  isLoading: false,
};

export const useRequestStore = create<RequestState>((set, get) => ({
  ...initialState,

  setMethod: (method) => set({ method }),
  setUrl: (url) => set({ url }),
  setHeaders: (headers) => set({ headers }),
  setQueryParams: (queryParams) => set({ queryParams }),
  setBody: (body) => set({ body }),
  setBodyType: (bodyType) => set({ bodyType }),

  addHeader: () => set((state) => ({
    headers: [...state.headers, { key: '', value: '', enabled: true }]
  })),

  removeHeader: (index) => set((state) => ({
    headers: state.headers.filter((_, i) => i !== index)
  })),

  updateHeader: (index, field, value) => set((state) => ({
    headers: state.headers.map((h, i) => 
      i === index ? { ...h, [field]: value } : h
    )
  })),

  addQueryParam: () => set((state) => ({
    queryParams: [...state.queryParams, { key: '', value: '', enabled: true }]
  })),

  removeQueryParam: (index) => set((state) => ({
    queryParams: state.queryParams.filter((_, i) => i !== index)
  })),

  updateQueryParam: (index, field, value) => set((state) => ({
    queryParams: state.queryParams.map((p, i) => 
      i === index ? { ...p, [field]: value } : p
    )
  })),

  sendRequest: async (endpointId) => {
    const state = get();
    set({ isLoading: true, response: null });

    try {
      // Build URL with query params
      let finalUrl = state.url;
      const enabledParams = state.queryParams.filter(p => p.enabled && p.key);
      if (enabledParams.length > 0) {
        const searchParams = new URLSearchParams();
        enabledParams.forEach(p => searchParams.append(p.key, p.value));
        finalUrl += (finalUrl.includes('?') ? '&' : '?') + searchParams.toString();
      }

      // Filter enabled headers
      const enabledHeaders = state.headers.filter(h => h.enabled && h.key);

      // Send via proxy
      const response = await proxyApi.execute({
        method: state.method,
        url: finalUrl,
        headers: enabledHeaders,
        body: state.method !== 'GET' ? state.body : undefined,
        endpointId,
      });

      set({ response: response.data, isLoading: false });
    } catch (error: any) {
      set({
        response: {
          success: false,
          error: {
            message: error.response?.data?.error || error.message || 'Request failed',
          },
        },
        isLoading: false,
      });
    }
  },

  clearResponse: () => set({ response: null }),

  loadEndpoint: (endpoint) => set({
    method: endpoint.method || 'GET',
    url: endpoint.url || '',
    headers: endpoint.headers?.length > 0 
      ? endpoint.headers 
      : [{ key: '', value: '', enabled: true }],
    queryParams: endpoint.queryParams?.length > 0 
      ? endpoint.queryParams 
      : [{ key: '', value: '', enabled: true }],
    body: endpoint.body || '',
    bodyType: endpoint.bodyType || 'json',
    response: null,
  }),

  reset: () => set(initialState),
}));`,

  // Collection Store
  'frontend/src/store/collectionStore.ts': `import { create } from 'zustand';
import { Collection, Endpoint } from '@/types';
import { collectionApi, endpointApi } from '@/lib/api';

interface CollectionState {
  collections: Collection[];
  currentCollection: Collection | null;
  currentEndpoint: Endpoint | null;
  isLoading: boolean;
  
  // Actions
  fetchCollections: () => Promise<void>;
  fetchCollection: (id: string) => Promise<void>;
  createCollection: (name: string, description?: string) => Promise<Collection>;
  updateCollection: (id: string, data: { name?: string; description?: string }) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  
  // Endpoints
  selectEndpoint: (endpoint: Endpoint | null) => void;
  createEndpoint: (collectionId: string, data: Partial<Endpoint>) => Promise<Endpoint>;
  updateEndpoint: (id: string, data: Partial<Endpoint>) => Promise<void>;
  deleteEndpoint: (id: string) => Promise<void>;
  duplicateEndpoint: (id: string) => Promise<Endpoint>;
  
  // Sharing
  generateShareLink: (id: string) => Promise<string>;
  removeShareLink: (id: string) => Promise<void>;
}

export const useCollectionStore = create<CollectionState>((set, get) => ({
  collections: [],
  currentCollection: null,
  currentEndpoint: null,
  isLoading: false,

  fetchCollections: async () => {
    set({ isLoading: true });
    try {
      const response = await collectionApi.getAll();
      set({ collections: response.data.collections, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchCollection: async (id) => {
    set({ isLoading: true });
    try {
      const response = await collectionApi.getOne(id);
      set({ currentCollection: response.data.collection, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createCollection: async (name, description) => {
    const response = await collectionApi.create({ name, description });
    const newCollection = response.data.collection;
    set((state) => ({
      collections: [newCollection, ...state.collections],
    }));
    return newCollection;
  },

  updateCollection: async (id, data) => {
    await collectionApi.update(id, data);
    set((state) => ({
      collections: state.collections.map((c) =>
        c.id === id ? { ...c, ...data } : c
      ),
      currentCollection:
        state.currentCollection?.id === id
          ? { ...state.currentCollection, ...data }
          : state.currentCollection,
    }));
  },

  deleteCollection: async (id) => {
    await collectionApi.delete(id);
    set((state) => ({
      collections: state.collections.filter((c) => c.id !== id),
      currentCollection:
        state.currentCollection?.id === id ? null : state.currentCollection,
    }));
  },

  selectEndpoint: (endpoint) => set({ currentEndpoint: endpoint }),

  createEndpoint: async (collectionId, data) => {
    const response = await endpointApi.create(collectionId, data);
    const newEndpoint = response.data.endpoint;
    
    set((state) => ({
      currentCollection: state.currentCollection
        ? {
            ...state.currentCollection,
            endpoints: [...(state.currentCollection.endpoints || []), newEndpoint],
          }
        : null,
    }));
    
    return newEndpoint;
  },

  updateEndpoint: async (id, data) => {
    await endpointApi.update(id, data);
    
    set((state) => ({
      currentCollection: state.currentCollection
        ? {
            ...state.currentCollection,
            endpoints: state.currentCollection.endpoints?.map((e) =>
              e.id === id ? { ...e, ...data } : e
            ),
          }
        : null,
      currentEndpoint:
        state.currentEndpoint?.id === id
          ? { ...state.currentEndpoint, ...data }
          : state.currentEndpoint,
    }));
  },

  deleteEndpoint: async (id) => {
    await endpointApi.delete(id);
    
    set((state) => ({
      currentCollection: state.currentCollection
        ? {
            ...state.currentCollection,
            endpoints: state.currentCollection.endpoints?.filter((e) => e.id !== id),
          }
        : null,
      currentEndpoint:
        state.currentEndpoint?.id === id ? null : state.currentEndpoint,
    }));
  },

  duplicateEndpoint: async (id) => {
    const response = await endpointApi.duplicate(id);
    const duplicate = response.data.endpoint;
    
    set((state) => ({
      currentCollection: state.currentCollection
        ? {
            ...state.currentCollection,
            endpoints: [...(state.currentCollection.endpoints || []), duplicate],
          }
        : null,
    }));
    
    return duplicate;
  },

  generateShareLink: async (id) => {
    const response = await collectionApi.generateShareLink(id);
    const { shareId, shareUrl } = response.data;
    
    set((state) => ({
      collections: state.collections.map((c) =>
        c.id === id ? { ...c, shareId, isPublic: true } : c
      ),
      currentCollection:
        state.currentCollection?.id === id
          ? { ...state.currentCollection, shareId, isPublic: true }
          : state.currentCollection,
    }));
    
    return shareUrl;
  },

  removeShareLink: async (id) => {
    await collectionApi.removeShareLink(id);
    
    set((state) => ({
      collections: state.collections.map((c) =>
        c.id === id ? { ...c, shareId: undefined, isPublic: false } : c
      ),
      currentCollection:
        state.currentCollection?.id === id
          ? { ...state.currentCollection, shareId: undefined, isPublic: false }
          : state.currentCollection,
    }));
  },
}));`,

  // Theme Provider
  'frontend/src/components/ThemeProvider.tsx': `'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null;
    if (stored) {
      setTheme(stored);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    
    const applyTheme = (t: Theme) => {
      if (t === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
        root.classList.toggle('dark', systemTheme === 'dark');
        setResolvedTheme(systemTheme);
      } else {
        root.classList.toggle('dark', t === 'dark');
        setResolvedTheme(t);
      }
    };

    applyTheme(theme);
    localStorage.setItem('theme', theme);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}`,

  // UI Button component
  'frontend/src/components/ui/Button.tsx': `import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'default' || variant === 'primary',
            'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
            'hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
            'bg-destructive text-destructive-foreground hover:bg-destructive/90': variant === 'destructive',
            'border border-input bg-background hover:bg-accent hover:text-accent-foreground': variant === 'outline',
          },
          {
            'h-8 px-3 text-sm': size === 'sm',
            'h-10 px-4 text-sm': size === 'md',
            'h-11 px-6 text-base': size === 'lg',
            'h-9 w-9': size === 'icon',
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';`,

  // UI Input component
  'frontend/src/components/ui/Input.tsx': `import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
          'ring-offset-background placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';`,

  // UI Select component
  'frontend/src/components/ui/Select.tsx': `import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            'flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pr-8 text-sm',
            'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      </div>
    );
  }
);

Select.displayName = 'Select';`,

  // UI Modal component
  'frontend/src/components/ui/Modal.tsx': `'use client';

import { Fragment } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal content */}
      <div 
        className={cn(
          'relative z-10 w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-lg',
          'animate-in fade-in-0 zoom-in-95',
          className
        )}
      >
        {/* Header */}
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{title}</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        {/* Content */}
        {children}
      </div>
    </div>
  );
}`,

  // UI Tabs component
  'frontend/src/components/ui/Tabs.tsx': `'use client';

import { createContext, useContext, useState } from 'react';
import { cn } from '@/lib/utils';

interface TabsContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

interface TabsProps {
  defaultValue: string;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ defaultValue, children, className }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div className={cn(
      'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
      className
    )}>
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function TabsTrigger({ value, children, className }: TabsTriggerProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within Tabs');
  
  const { activeTab, setActiveTab } = context;
  const isActive = activeTab === value;

  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isActive && 'bg-background text-foreground shadow-sm',
        className
      )}
      onClick={() => setActiveTab(value)}
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within Tabs');
  
  const { activeTab } = context;
  if (activeTab !== value) return null;

  return <div className={cn('mt-2', className)}>{children}</div>;
}`,

  // Continue in next message due to length...
};

// Create all files
function createFile(relativePath, content) {
  const fullPath = path.join(BASE_DIR, relativePath);
  const dir = path.dirname(fullPath);
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('✓ Created: ' + relativePath);
}

// Main execution
console.log('🚀 Generating Live API Tester Project...\n');

Object.entries(files).forEach(([filePath, content]) => {
  createFile(filePath, content);
});

console.log('\n✅ Generated ' + Object.keys(files).length + ' files!');
console.log('\n📁 Project structure created successfully!');
console.log('\nNext steps:');
console.log('1. cd backend && npm install');
console.log('2. Configure backend/.env');
console.log('3. npm run db:push');
console.log('4. npm run dev');
console.log('');
console.log('5. cd frontend && npm install');
console.log('6. Configure frontend/.env.local');
console.log('7. npm run dev');

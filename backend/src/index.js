require('dotenv').config();
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
const workspaceRoutes = require('./routes/workspaces');
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
app.use('/api/workspaces', workspaceRoutes);

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
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

module.exports = app;

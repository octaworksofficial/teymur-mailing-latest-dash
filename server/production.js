const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
require('dotenv').config();

// Timezone'u Türkiye olarak ayarla
process.env.TZ = 'Europe/Istanbul';

console.log('========================================');
console.log('🚀 Starting Teymur Mailing System...');
console.log('========================================');
console.log('📍 Environment:', process.env.NODE_ENV || 'development');
console.log('🌍 Working Directory:', process.cwd());
console.log('📂 __dirname:', __dirname);
console.log('🔑 DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('🔑 JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('🔑 CORS_ORIGIN:', process.env.CORS_ORIGIN || 'not set');

// Check if dist folder exists
const distPath = path.join(__dirname, '../dist');
console.log('📁 Checking dist path:', distPath);

if (!fs.existsSync(distPath)) {
  console.error('❌ ERROR: dist/ folder not found!');
  console.error('📁 Expected path:', distPath);
  console.error('💡 Run "npm run build" first');
  // List directory contents
  try {
    const parentDir = path.join(__dirname, '..');
    console.log('📂 Parent directory contents:', fs.readdirSync(parentDir));
  } catch (e) {
    console.error('Could not list parent dir:', e.message);
  }
  process.exit(1);
} else {
  console.log('✅ dist/ folder found:', distPath);
  try {
    console.log('📂 dist/ contents:', fs.readdirSync(distPath).slice(0, 10), '...');
  } catch (e) {}
}

// API Routes
console.log('📦 Loading API routes...');
let authRouter, contactsRouter, templatesRouter, campaignsRouter;
let dashboardRouter, logsRouter, companyInfoRouter, trackingRouter, uploadRouter;
let organizationsRouter, usersRouter, specialDaysRouter, adminStatsRouter, backupRouter;
let startEmailScheduler;

try {
  console.log('  - Loading auth router...');
  authRouter = require('./routes/auth');
  console.log('  ✅ auth router loaded');
  
  console.log('  - Loading contacts router...');
  contactsRouter = require('./routes/contacts');
  console.log('  ✅ contacts router loaded');
  
  console.log('  - Loading templates router...');
  templatesRouter = require('./routes/templates');
  console.log('  ✅ templates router loaded');
  
  console.log('  - Loading campaigns router...');
  campaignsRouter = require('./routes/campaigns');
  console.log('  ✅ campaigns router loaded');
  
  console.log('  - Loading dashboard router...');
  dashboardRouter = require('./routes/dashboard');
  console.log('  ✅ dashboard router loaded');
  
  console.log('  - Loading logs router...');
  logsRouter = require('./routes/logs');
  console.log('  ✅ logs router loaded');
  
  console.log('  - Loading companyInfo router...');
  companyInfoRouter = require('./routes/companyInfo');
  console.log('  ✅ companyInfo router loaded');
  
  console.log('  - Loading tracking router...');
  trackingRouter = require('./routes/tracking');
  console.log('  ✅ tracking router loaded');
  
  console.log('  - Loading upload router...');
  uploadRouter = require('./routes/upload');
  console.log('  ✅ upload router loaded');
  
  console.log('  - Loading organizations router...');
  organizationsRouter = require('./routes/organizations');
  console.log('  ✅ organizations router loaded');
  
  console.log('  - Loading users router...');
  usersRouter = require('./routes/users');
  console.log('  ✅ users router loaded');
  
  console.log('  - Loading specialDays router...');
  specialDaysRouter = require('./routes/specialDays');
  console.log('  ✅ specialDays router loaded');
  
  console.log('  - Loading adminStats router...');
  adminStatsRouter = require('./routes/adminStats');
  console.log('  ✅ adminStats router loaded');
  
  console.log('  - Loading backup router...');
  backupRouter = require('./routes/backup');
  console.log('  ✅ backup router loaded');
  
  console.log('  - Loading emailScheduler...');
  const scheduler = require('./services/emailScheduler');
  startEmailScheduler = scheduler.startEmailScheduler;
  console.log('  ✅ emailScheduler loaded');
  
  console.log('✅ All routes loaded successfully!');
} catch (error) {
  console.error('❌ FATAL: Failed to load routes!');
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 8080;

console.log('� Port:', PORT);

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,
}));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api', authRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/contacts', contactsRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/campaigns', campaignsRouter);
app.use('/api/logs', logsRouter);
app.use('/api/company-info', companyInfoRouter);
app.use('/api/tracking', trackingRouter);
app.use('/api/uploads', uploadRouter);
app.use('/api/organizations', organizationsRouter);
app.use('/api/users', usersRouter);
app.use('/api/special-days', specialDaysRouter);
app.use('/api/admin', adminStatsRouter);
app.use('/api/admin', backupRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Teymur Mailing System is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    message: 'API is working',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Static files (built frontend) - serve after API routes
app.use(express.static(path.join(__dirname, '../dist'), {
  maxAge: '1d',
  etag: false
}));

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: 'API endpoint not found',
      path: req.path
    });
  }
  
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('� SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Teymur Mailing System running on port ${PORT}`);
  console.log(`📱 Frontend: http://localhost:${PORT}`);
  console.log(`🔌 API: http://localhost:${PORT}/api`);
  console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
  console.log('✅ Server is ready to accept connections');
  
  // Start email scheduler in production (optional - won't block startup)
  if (process.env.NODE_ENV === 'production') {
    console.log('📧 Starting email scheduler...');
    try {
      startEmailScheduler();
      console.log('✅ Email scheduler started successfully');
    } catch (err) {
      console.error('⚠️  Email scheduler failed to start:', err.message);
      console.error('Server will continue running without scheduler');
    }
  }
});

// Handle server errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Trying alternative port...`);
    const alternativePort = PORT + 1;
    server.listen(alternativePort, '0.0.0.0', () => {
      console.log(`🚀 Server started on alternative port ${alternativePort}`);
    });
  } else {
    console.error('❌ Server error:', err);
    process.exit(1);
  }
});

module.exports = app;

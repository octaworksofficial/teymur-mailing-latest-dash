const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Timezone'u Türkiye olarak ayarla
process.env.TZ = 'Europe/Istanbul';

const authRouter = require('./routes/auth');
const contactsRouter = require('./routes/contacts');
const templatesRouter = require('./routes/templates');
const campaignsRouter = require('./routes/campaigns');
const dashboardRouter = require('./routes/dashboard');
const logsRouter = require('./routes/logs');
const companyInfoRouter = require('./routes/companyInfo');
const trackingRouter = require('./routes/tracking');
const uploadRouter = require('./routes/upload');
const organizationsRouter = require('./routes/organizations');
const usersRouter = require('./routes/users');
const specialDaysRouter = require('./routes/specialDays');
const adminStatsRouter = require('./routes/adminStats');
const backupRouter = require('./routes/backup');
const { startEmailScheduler } = require('./services/emailScheduler');

const app = express();
const PORT = process.env.PORT || 3001;

// Request logging middleware (body parser'dan önce)
app.use((req, res, next) => {
  if (req.url.includes('/restore') || req.url.includes('/backup')) {
    console.log(`📨 ${req.method} ${req.url} - Content-Length: ${req.headers['content-length'] || 'unknown'}`);
  }
  next();
});

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,
}));

// Body parser with error handling
app.use(bodyParser.json({ 
  limit: '100mb',
  verify: (req, res, buf) => {
    if (req.url.includes('/restore')) {
      console.log(`📦 Body size: ${buf.length} bytes (${(buf.length / 1024 / 1024).toFixed(2)} MB)`);
    }
  }
}));
app.use(bodyParser.urlencoded({ extended: true, limit: '100mb' }));

// Body parser error handler
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    console.error('❌ Body too large:', err.message);
    return res.status(413).json({ success: false, message: 'Dosya çok büyük' });
  }
  next(err);
});

// Routes
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
    message: 'Email Automation API is running',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint bulunamadı',
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Sunucu hatası',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend API sunucusu http://localhost:${PORT} adresinde çalışıyor`);
  console.log(`📊 Contacts API: http://localhost:${PORT}/api/contacts`);
  console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
  
  // Email Scheduler'ı başlat
  console.log('');
  startEmailScheduler();
});

module.exports = app;

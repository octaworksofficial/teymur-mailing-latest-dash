const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Timezone'u Türkiye olarak ayarla
process.env.TZ = 'Europe/Istanbul';

const contactsRouter = require('./routes/contacts');
const templatesRouter = require('./routes/templates');
const campaignsRouter = require('./routes/campaigns');
const dashboardRouter = require('./routes/dashboard');
const logsRouter = require('./routes/logs');
const companyInfoRouter = require('./routes/companyInfo');
const trackingRouter = require('./routes/tracking');
const { startEmailScheduler } = require('./services/emailScheduler');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/dashboard', dashboardRouter);
app.use('/api/contacts', contactsRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/campaigns', campaignsRouter);
app.use('/api/logs', logsRouter);
app.use('/api/company-info', companyInfoRouter);
app.use('/api/tracking', trackingRouter);

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

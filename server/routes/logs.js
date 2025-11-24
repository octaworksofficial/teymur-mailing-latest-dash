const express = require('express');
const router = express.Router();
const logStream = require('../services/logStream');
const { processScheduledEmails } = require('../services/emailScheduler');

// SSE endpoint - Real-time log streaming
router.get('/stream', (req, res) => {
  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Heartbeat - her 30 saniyede bir
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30000);

  // Client'ı ekle
  logStream.addClient(res);
  
  // Hoşgeldin mesajı
  logStream.system('🎯 Log viewer bağlandı - Real-time loglar yayınlanıyor', {
    connectedAt: new Date().toISOString(),
  });

  // Bağlantı kapandığında cleanup
  req.on('close', () => {
    clearInterval(heartbeat);
    logStream.removeClient(res);
  });
});

// Tüm logları al (history)
router.get('/history', (req, res) => {
  try {
    const logs = logStream.getAllLogs();
    res.json({
      success: true,
      data: logs,
      total: logs.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Loglar alınamadı',
      error: error.message,
    });
  }
});

// Logları temizle
router.post('/clear', (req, res) => {
  try {
    logStream.clearLogs();
    res.json({
      success: true,
      message: 'Loglar temizlendi',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Loglar temizlenemedi',
      error: error.message,
    });
  }
});

// Manuel test log gönder
router.post('/test', (req, res) => {
  const { type = 'info', message = 'Test mesajı' } = req.body;
  logStream.broadcast(type, message, { test: true });
  res.json({ success: true, message: 'Test log gönderildi' });
});

// Manuel scheduler trigger
router.post('/trigger-scheduler', async (req, res) => {
  try {
    logStream.system('🔘 Manuel scheduler tetiklendi', { 
      triggeredBy: 'user',
      triggeredAt: new Date().toISOString() 
    });
    
    // Scheduler'ı asenkron olarak çalıştır (response'u bekletmemek için)
    processScheduledEmails().catch(err => {
      console.error('Manuel scheduler hatası:', err);
    });
    
    res.json({ 
      success: true, 
      message: 'Scheduler manuel olarak tetiklendi - Logları izleyin' 
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Scheduler tetiklenemedi',
      error: error.message,
    });
  }
});

module.exports = router;

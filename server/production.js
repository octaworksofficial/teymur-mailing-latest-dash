const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 8080;
const API_PORT = process.env.API_PORT || 3001;

// Static files (built frontend)
app.use(express.static(path.join(__dirname, '../dist')));

// API proxy - /api/* isteklerini backend'e yönlendir
app.use('/api', createProxyMiddleware({
  target: `http://localhost:${API_PORT}`,
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api', // /api'yi koru
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Proxy] ${req.method} ${req.path} -> http://localhost:${API_PORT}${req.path}`);
  },
}));

// Tüm diğer istekleri frontend'e yönlendir (SPA için)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Production server running on http://localhost:${PORT}`);
  console.log(`📱 Frontend: http://localhost:${PORT}`);
  console.log(`🔌 API Proxy: http://localhost:${PORT}/api -> http://localhost:${API_PORT}/api`);
});

module.exports = app;

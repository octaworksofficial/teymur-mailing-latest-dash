const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

console.log('🚀 Starting production server...');
console.log('📁 Working directory:', process.cwd());
console.log('🔌 Port:', PORT);

// Check dist folder
const distPath = path.join(__dirname, '../dist');
console.log('📂 Checking dist path:', distPath);
console.log('📂 Dist exists:', fs.existsSync(distPath));

if (!fs.existsSync(distPath)) {
  console.error('❌ ERROR: dist/ folder not found!');
  console.error('Please run "npm run build" first');
  process.exit(1);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files
app.use(express.static(distPath));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 http://localhost:${PORT}`);
  console.log(`❤️  Health: http://localhost:${PORT}/health`);
});

const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Railway için gerekli
  },
});

// Test connection
pool.on('connect', (client) => {
  console.log('✅ PostgreSQL veritabanına bağlandı');
  
  // Timezone'u Türkiye olarak ayarla (Europe/Istanbul = UTC+3)
  client.query("SET timezone = 'Europe/Istanbul'").catch(err => {
    console.error('⚠️  Timezone ayarlanamadı:', err);
  });
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL bağlantı hatası:', err);
});

module.exports = pool;

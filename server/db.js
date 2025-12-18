const { Pool } = require('pg');
require('dotenv').config();

console.log('🔗 Database Configuration:');
console.log('DATABASE_URL available:', !!process.env.DATABASE_URL);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('Environment:', process.env.NODE_ENV);

// Railway ve local development için farklı konfigürasyon
const dbConfig = process.env.DATABASE_URL ? {
  // Railway production - DATABASE_URL kullan
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  max: 10,
  min: 2,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
  allowExitOnIdle: false,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
} : {
  // Local development - ayrı ayrı parametreler
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'teymur_mailing',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: 10,
  min: 2,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
};

console.log('🗄️ Using database config:', {
  ...dbConfig,
  password: dbConfig.password ? '***' : undefined,
  connectionString: dbConfig.connectionString ? '***' : undefined
});

// PostgreSQL connection pool
const pool = new Pool(dbConfig);

// Connection event handlers
pool.on('connect', (client) => {
  console.log('✅ PostgreSQL veritabanına bağlandı');
  
  // Timezone'u Türkiye olarak ayarla
  client.query("SET timezone = 'Europe/Istanbul'").catch(err => {
    console.error('⚠️  Timezone ayarlanamadı:', err.message);
  });
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL bağlantı hatası:', {
    message: err.message,
    code: err.code,
    detail: err.detail
  });
});

pool.on('acquire', () => {
  console.log('🔗 Database connection acquired from pool');
});

pool.on('release', () => {
  console.log('🔄 Database connection released back to pool');
});

// Test connection function
async function testConnection() {
  try {
    console.log('🧪 Testing database connection...');
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
    console.log('✅ Database connection successful!');
    console.log('⏰ Current time:', result.rows[0].current_time);
    console.log('🐘 PostgreSQL version:', result.rows[0].postgres_version.split(' ')[0]);
    client.release();
    return true;
  } catch (err) {
    console.error('❌ Database connection failed:', {
      message: err.message,
      code: err.code,
      detail: err.detail,
      hint: err.hint
    });
    return false;
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down database pool...');
  await pool.end();
  console.log('✅ Database pool closed');
});

process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down database pool...');
  await pool.end();
  console.log('✅ Database pool closed');
});

// Keep-alive ping - her 30 saniyede bir
setInterval(async () => {
  try {
    await pool.query('SELECT 1');
  } catch (err) {
    console.warn('Keep-alive ping failed:', err.message);
  }
}, 30000);

// Test connection on startup
testConnection();

module.exports = { pool, testConnection };

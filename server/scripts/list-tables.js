const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function listTables() {
  try {
    // Tüm tabloları listele
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📋 Mevcut Tablolar:');
    console.log('==================');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // campaign ile ilgili tabloları detaylı göster
    console.log('\n📊 Campaign tabloları detayları:');
    console.log('=================================');
    
    const campaignTables = tablesResult.rows.filter(row => 
      row.table_name.toLowerCase().includes('campaign')
    );
    
    for (const table of campaignTables) {
      console.log(`\n🔍 Tablo: ${table.table_name}`);
      
      const columnsResult = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [table.table_name]);
      
      columnsResult.rows.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})${col.is_nullable === 'NO' ? ' NOT NULL' : ''}`);
      });
    }
    
    await pool.end();
  } catch (error) {
    console.error('Hata:', error.message);
    process.exit(1);
  }
}

listTables();

// Migration: company_info tablosuna organization_id ekle
const { pool } = require('../db');

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('🔄 Migration başlıyor: company_info tablosuna organization_id ekleniyor...');
    
    // organization_id sütunu ekle
    await client.query(`
      ALTER TABLE company_info 
      ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE
    `);
    console.log('✅ organization_id sütunu eklendi');

    // Unique index ekle
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_company_info_organization 
      ON company_info(organization_id) 
      WHERE organization_id IS NOT NULL
    `);
    console.log('✅ Unique index oluşturuldu');

    // Performance index ekle
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_company_info_org_id ON company_info(organization_id)
    `);
    console.log('✅ Performance index oluşturuldu');

    console.log('✅ Migration tamamlandı!');
  } catch (error) {
    console.error('❌ Migration hatası:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();

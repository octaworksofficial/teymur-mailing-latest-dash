/**
 * Super Admin Şifre Oluşturma Script'i
 * 
 * Bu script ilk super admin kullanıcısının şifresini oluşturur.
 * Migration çalıştırdıktan sonra bu script'i çalıştırın.
 * 
 * Kullanım:
 * node server/scripts/setup-admin.js
 */

const bcrypt = require('bcrypt');
const { pool } = require('../db');

const SALT_ROUNDS = 10;
const ADMIN_EMAIL = 'admin@cerilas.com';
const ADMIN_PASSWORD = 'admin123'; // Değiştirilebilir

async function setupAdmin() {
  try {
    console.log('🔧 Super Admin şifresi oluşturuluyor...\n');

    // Şifreyi hashle
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);
    console.log('✅ Şifre hash\'lendi');

    // Super admin'i güncelle
    const result = await pool.query(
      `UPDATE users 
       SET password_hash = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE email = $2
       RETURNING id, email, role`,
      [passwordHash, ADMIN_EMAIL]
    );

    if (result.rows.length === 0) {
      // Kullanıcı yoksa oluştur
      console.log('⚠️  Admin kullanıcısı bulunamadı, oluşturuluyor...');

      // Önce organization var mı kontrol et
      let orgId;
      const orgResult = await pool.query(
        `SELECT id FROM organizations WHERE slug = 'system-admin'`
      );

      if (orgResult.rows.length === 0) {
        const newOrg = await pool.query(
          `INSERT INTO organizations (name, slug, description, status, plan, max_users, max_contacts, max_emails_per_month)
           VALUES ('System Admin', 'system-admin', 'Sistem yönetici organizasyonu', 'active', 'enterprise', 999, 999999, 999999)
           RETURNING id`
        );
        orgId = newOrg.rows[0].id;
        console.log('✅ System Admin organizasyonu oluşturuldu');
      } else {
        orgId = orgResult.rows[0].id;
      }

      // Kullanıcıyı oluştur
      const newUser = await pool.query(
        `INSERT INTO users (organization_id, email, password_hash, first_name, last_name, role, status, is_verified)
         VALUES ($1, $2, $3, 'Super', 'Admin', 'super_admin', 'active', true)
         RETURNING id, email, role`,
        [orgId, ADMIN_EMAIL, passwordHash]
      );

      console.log('\n✅ Super Admin kullanıcısı oluşturuldu:');
      console.log(`   Email: ${newUser.rows[0].email}`);
      console.log(`   Şifre: ${ADMIN_PASSWORD}`);
      console.log(`   Rol: ${newUser.rows[0].role}`);
    } else {
      console.log('\n✅ Super Admin şifresi güncellendi:');
      console.log(`   Email: ${result.rows[0].email}`);
      console.log(`   Yeni Şifre: ${ADMIN_PASSWORD}`);
      console.log(`   Rol: ${result.rows[0].role}`);
    }

    console.log('\n⚠️  ÖNEMLİ: Production\'da şifreyi değiştirmeyi unutmayın!');
    console.log('   PUT /api/auth/password endpoint\'ini kullanabilirsiniz.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  }
}

setupAdmin();

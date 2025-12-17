const { pool } = require('./server/db');

(async () => {
  try {
    // Kullanıcıyı kontrol et
    const result = await pool.query(
      'SELECT id, email, is_super_admin, organization_id FROM users WHERE email = $1',
      ['admin@cerilas.com'],
    );

    console.log('\n📊 Kullanıcı Bilgileri:');
    console.log(JSON.stringify(result.rows[0], null, 2));

    if (result.rows[0] && !result.rows[0].is_super_admin) {
      console.log('\n⚠️  is_super_admin: false - Super admin değil!');
      console.log('\n🔧 Düzeltiliyor...');

      await pool.query(
        'UPDATE users SET is_super_admin = true WHERE email = $1',
        ['admin@cerilas.com'],
      );
      console.log('✅ Super admin olarak güncellendi!');

      const check = await pool.query(
        'SELECT is_super_admin FROM users WHERE email = $1',
        ['admin@cerilas.com'],
      );
      console.log('\n✅ Güncel durum:', check.rows[0]);
    } else if (result.rows[0] && result.rows[0].is_super_admin) {
      console.log('\n✅ Kullanıcı zaten super admin!');
    } else {
      console.log('\n❌ Kullanıcı bulunamadı!');
    }

    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Hata:', err.message);
    process.exit(1);
  }
})();

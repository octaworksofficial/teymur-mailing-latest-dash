const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authMiddleware } = require('../middleware/auth');

// Tüm özel günleri listele (yıla göre filtrelenebilir) - Kullanıcı bazlı
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { year } = req.query;
    const userId = req.user.id;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'Kullanıcı bilgisi bulunamadı' });
    }
    let query = `SELECT id, year, day_type, day_name, actual_date, category, user_id FROM special_days_calendar WHERE user_id = $1`;
    const params = [userId];
    if (year) {
      query += ' AND year = $2';
      params.push(parseInt(year));
    }
    query += ' ORDER BY year DESC, actual_date ASC';
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get special days error:', error);
    res.status(500).json({ success: false, message: 'Özel günler yüklenirken hata oluştu' });
  }
});

// Mevcut yılları listele - Kullanıcı bazlı
router.get('/years', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'Kullanıcı bilgisi bulunamadı' });
    }
    const result = await pool.query(`SELECT DISTINCT year FROM special_days_calendar WHERE user_id = $1 ORDER BY year DESC`, [userId]);
    res.json({ success: true, data: result.rows.map(r => r.year) });
  } catch (error) {
    console.error('Get years error:', error);
    res.status(500).json({ success: false, message: 'Yıllar yüklenirken hata oluştu' });
  }
});

// Tekil özel gün getir - Kullanıcı bazlı
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'Kullanıcı bilgisi bulunamadı' });
    }
    const result = await pool.query('SELECT * FROM special_days_calendar WHERE id = $1 AND user_id = $2', [id, userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Özel gün bulunamadı' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get special day error:', error);
    res.status(500).json({ success: false, message: 'Özel gün yüklenirken hata oluştu' });
  }
});

// Özel gün güncelle - Kullanıcı bazlı
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { actual_date, day_name } = req.body;
    const userId = req.user.id;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'Kullanıcı bilgisi bulunamadı' });
    }
    // Mevcut kaydı kontrol et (kullanıcı bazlı)
    const existing = await pool.query('SELECT * FROM special_days_calendar WHERE id = $1 AND user_id = $2', [id, userId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Özel gün bulunamadı veya bu kullanıcıya ait değil' });
    }
    const result = await pool.query(
      `UPDATE special_days_calendar SET actual_date = $1, day_name = COALESCE($2, day_name) WHERE id = $3 AND user_id = $4 RETURNING *`,
      [actual_date, day_name, id, userId]
    );
    res.json({ success: true, data: result.rows[0], message: 'Özel gün güncellendi' });
  } catch (error) {
    console.error('Update special day error:', error);
    res.status(500).json({ success: false, message: 'Özel gün güncellenirken hata oluştu' });
  }
});

// Yeni özel gün ekle - Kullanıcı bazlı
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { year, day_type, day_name, actual_date, category } = req.body;
    const userId = req.user.id;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'Kullanıcı bilgisi bulunamadı' });
    }
    // Validasyon
    if (!year || !day_type || !day_name || !actual_date) {
      const missingFields = [];
      if (!year) missingFields.push('Yıl');
      if (!day_type) missingFields.push('Gün Tipi');
      if (!day_name) missingFields.push('Gün Adı');
      if (!actual_date) missingFields.push('Tarih');
      return res.status(400).json({ success: false, message: `Eksik alanlar: ${missingFields.join(', ')}` });
    }
    // Tarih formatı kontrolü
    const dateObj = new Date(actual_date);
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({ success: false, message: `Geçersiz tarih formatı: "${actual_date}". Tarih YYYY-MM-DD formatında olmalıdır.` });
    }
    // Seçilen yıl ile tarih yılı uyuşuyor mu kontrol et
    const dateYear = dateObj.getFullYear();
    if (dateYear !== parseInt(year)) {
      return res.status(400).json({ success: false, message: `Yıl uyuşmazlığı: Seçilen yıl ${year}, ancak tarih yılı ${dateYear}. Lütfen tarihi ${year} yılından seçin.` });
    }
    // Aynı kullanıcı, yıl ve tip için var mı kontrol et
    const existing = await pool.query('SELECT * FROM special_days_calendar WHERE user_id = $1 AND year = $2 AND day_type = $3', [userId, year, day_type]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: `${year} yılı için "${day_type}" tipinde özel gün zaten mevcut. Mevcut tarih: ${existing.rows[0].actual_date}` });
    }
    const result = await pool.query(
      `INSERT INTO special_days_calendar (user_id, year, day_type, day_name, actual_date, category) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, year, day_type, day_name, actual_date, category || 'ozel']
    );
    res.status(201).json({ success: true, data: result.rows[0], message: 'Özel gün eklendi' });
  } catch (error) {
    console.error('Create special day error:', error);
    res.status(500).json({ success: false, message: `Özel gün eklenirken hata oluştu: ${error.message}` });
  }
});

// Özel gün sil - Kullanıcı bazlı
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'Kullanıcı bilgisi bulunamadı' });
    }
    const result = await pool.query('DELETE FROM special_days_calendar WHERE id = $1 AND user_id = $2 RETURNING *', [id, userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Özel gün bulunamadı veya bu kullanıcıya ait değil' });
    }
    res.json({ success: true, message: 'Özel gün silindi' });
  } catch (error) {
    console.error('Delete special day error:', error);
    res.status(500).json({ success: false, message: 'Özel gün silinirken hata oluştu' });
  }
});

// Bir yılın tüm günlerini başka bir yıla kopyala - Kullanıcı bazlı
router.post('/copy-year', authMiddleware, async (req, res) => {
  try {
    const { sourceYear, targetYear } = req.body;
    const userId = req.user.id;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'Kullanıcı bilgisi bulunamadı' });
    }
    if (!sourceYear || !targetYear) {
      return res.status(400).json({ success: false, message: 'Kaynak ve hedef yıl zorunludur' });
    }
    // Kaynak yılın verilerini al (kullanıcı bazlı)
    const sourceData = await pool.query('SELECT day_type, day_name, actual_date, category FROM special_days_calendar WHERE user_id = $1 AND year = $2', [userId, sourceYear]);
    if (sourceData.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Kaynak yılda veri bulunamadı' });
    }
    // Hedef yılda zaten veri var mı kontrol et (kullanıcı bazlı)
    const existingTarget = await pool.query('SELECT COUNT(*) FROM special_days_calendar WHERE user_id = $1 AND year = $2', [userId, targetYear]);
    if (parseInt(existingTarget.rows[0].count) > 0) {
      return res.status(400).json({ success: false, message: 'Hedef yılda zaten özel günler mevcut. Önce silmeniz gerekiyor.' });
    }
    // Tarihleri yeni yıla göre ayarla ve ekle
    const yearDiff = targetYear - sourceYear;
    let insertedCount = 0;
    for (const row of sourceData.rows) {
      const originalDate = new Date(row.actual_date);
      const newDate = new Date(originalDate);
      newDate.setFullYear(originalDate.getFullYear() + yearDiff);
      await pool.query(
        `INSERT INTO special_days_calendar (user_id, year, day_type, day_name, actual_date, category) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (user_id, year, day_type) DO NOTHING`,
        [userId, targetYear, row.day_type, row.day_name, newDate.toISOString().split('T')[0], row.category]
      );
      insertedCount++;
    }
    res.json({ success: true, message: `${insertedCount} özel gün ${targetYear} yılına kopyalandı. Lütfen dini bayram tarihlerini kontrol edin.` });
  } catch (error) {
    console.error('Copy year error:', error);
    res.status(500).json({ success: false, message: 'Yıl kopyalanırken hata oluştu' });
  }
});

module.exports = router;

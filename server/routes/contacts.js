const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// GET /api/contacts - Tüm müşterileri listele (filtreleme ile)
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      email,
      status,
      subscription_status,
      tags,
      custom_fields,
      search,
      customer_representative,
      country,
      state,
      district,
      importance_level,
    } = req.query;

    const offset = (page - 1) * pageSize;
    let query = 'SELECT * FROM contacts WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    // Filtreleme
    if (email) {
      query += ` AND email ILIKE $${paramIndex}`;
      params.push(`%${email}%`);
      paramIndex++;
    }

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (subscription_status) {
      query += ` AND subscription_status = $${paramIndex}`;
      params.push(subscription_status);
      paramIndex++;
    }

    if (tags) {
      // Tags string olarak gelirse virgülle ayır
      const tagArray = tags.includes(',') ? tags.split(',').map(t => t.trim()) : [tags];
      query += ` AND tags && $${paramIndex}`;
      params.push(tagArray);
      paramIndex++;
    }

    if (custom_fields) {
      // custom_fields formatı: Sadece value ile arama yap
      // JSONB içindeki tüm value'larda ara (case-insensitive)
      query += ` AND EXISTS (
        SELECT 1 FROM jsonb_each_text(custom_fields) 
        WHERE value ILIKE $${paramIndex}
      )`;
      params.push(`%${custom_fields}%`);
      paramIndex++;
    }

    if (search) {
      query += ` AND (email ILIKE $${paramIndex} OR first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex} OR company ILIKE $${paramIndex} OR position ILIKE $${paramIndex} OR company_title ILIKE $${paramIndex} OR address_1 ILIKE $${paramIndex} OR address_2 ILIKE $${paramIndex} OR notes ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Yeni filtreleme alanları
    if (customer_representative) {
      query += ` AND customer_representative ILIKE $${paramIndex}`;
      params.push(`%${customer_representative}%`);
      paramIndex++;
    }

    if (country) {
      query += ` AND country ILIKE $${paramIndex}`;
      params.push(`%${country}%`);
      paramIndex++;
    }

    if (state) {
      query += ` AND state ILIKE $${paramIndex}`;
      params.push(`%${state}%`);
      paramIndex++;
    }

    if (district) {
      query += ` AND district ILIKE $${paramIndex}`;
      params.push(`%${district}%`);
      paramIndex++;
    }

    if (importance_level) {
      query += ` AND importance_level = $${paramIndex}`;
      params.push(parseInt(importance_level));
      paramIndex++;
    }

    // Total count için query
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Sıralama ve pagination
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(pageSize, offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    });
  } catch (error) {
    console.error('Contacts listeleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Müşteriler listelenirken hata oluştu',
      error: error.message,
    });
  }
});

// GET /api/contacts/:id - Tek müşteriyi getir
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[GET /api/contacts/${id}] Müşteri detayı isteniyor...`);
    
    const result = await pool.query('SELECT * FROM contacts WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      console.log(`[GET /api/contacts/${id}] Müşteri bulunamadı - 404`);
      return res.status(404).json({
        success: false,
        message: 'Müşteri bulunamadı',
      });
    }

    console.log(`[GET /api/contacts/${id}] Müşteri bulundu: ${result.rows[0].email}`);
    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Müşteri getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Müşteri getirilirken hata oluştu',
      error: error.message,
    });
  }
});

// POST /api/contacts - Yeni müşteri ekle
router.post('/', async (req, res) => {
  try {
    const {
      email,
      first_name,
      last_name,
      phone,
      mobile_phone,
      company,
      company_title,
      position,
      status = 'active',
      subscription_status = 'subscribed',
      source,
      tags = [],
      custom_fields = {},
      customer_representative,
      country,
      state,
      district,
      address_1,
      address_2,
      importance_level,
      notes,
    } = req.body;

    // Email zorunlu
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email adresi zorunludur',
      });
    }

    // importance_level validation
    let validatedImportanceLevel = importance_level;
    if (importance_level !== undefined && importance_level !== null && importance_level !== '') {
      const level = parseInt(importance_level);
      if (isNaN(level) || level < 1 || level > 10) {
        return res.status(400).json({
          success: false,
          message: 'Önem derecesi 1-10 arası bir sayı olmalıdır',
        });
      }
      validatedImportanceLevel = level;
    } else {
      validatedImportanceLevel = null;
    }

    const query = `
      INSERT INTO contacts (
        email, first_name, last_name, phone, mobile_phone, company, company_title, position,
        status, subscription_status, source, tags, custom_fields,
        customer_representative, country, state, district, address_1, address_2, importance_level, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *
    `;

    const values = [
      email,
      first_name,
      last_name,
      phone,
      mobile_phone,
      company,
      company_title,
      position,
      status,
      subscription_status,
      source,
      tags,
      JSON.stringify(custom_fields),
      customer_representative,
      country,
      state,
      district,
      address_1,
      address_2,
      validatedImportanceLevel,
      notes,
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      success: true,
      message: 'Müşteri başarıyla eklendi',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Müşteri ekleme hatası:', error);

    // Email unique constraint hatası
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'Bu email adresi zaten kayıtlı',
      });
    }

    // CHECK constraint hatası (importance_level)
    if (error.code === '23514') {
      return res.status(400).json({
        success: false,
        message: 'Önem derecesi 1-10 arası olmalıdır',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Müşteri eklenirken hata oluştu',
      error: error.message,
    });
  }
});

// PUT /api/contacts/:id - Müşteri güncelle
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      email,
      first_name,
      last_name,
      phone,
      mobile_phone,
      company,
      company_title,
      position,
      status,
      subscription_status,
      tags,
      custom_fields,
      customer_representative,
      country,
      state,
      district,
      address_1,
      address_2,
      importance_level,
      notes,
    } = req.body;

    // importance_level validation
    let validatedImportanceLevel = importance_level;
    if (importance_level !== undefined && importance_level !== null && importance_level !== '') {
      const level = parseInt(importance_level);
      if (isNaN(level) || level < 1 || level > 10) {
        return res.status(400).json({
          success: false,
          message: 'Önem derecesi 1-10 arası bir sayı olmalıdır',
        });
      }
      validatedImportanceLevel = level;
    } else {
      validatedImportanceLevel = null;
    }

    // Önce müşterinin var olup olmadığını kontrol et
    const checkResult = await pool.query('SELECT * FROM contacts WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Müşteri bulunamadı',
      });
    }

    const query = `
      UPDATE contacts SET
        email = COALESCE($1, email),
        first_name = COALESCE($2, first_name),
        last_name = COALESCE($3, last_name),
        phone = COALESCE($4, phone),
        mobile_phone = COALESCE($5, mobile_phone),
        company = COALESCE($6, company),
        company_title = COALESCE($7, company_title),
        position = COALESCE($8, position),
        status = COALESCE($9, status),
        subscription_status = COALESCE($10, subscription_status),
        tags = COALESCE($11, tags),
        custom_fields = COALESCE($12, custom_fields),
        customer_representative = COALESCE($13, customer_representative),
        country = COALESCE($14, country),
        state = COALESCE($15, state),
        district = COALESCE($16, district),
        address_1 = COALESCE($17, address_1),
        address_2 = COALESCE($18, address_2),
        importance_level = COALESCE($19, importance_level),
        notes = COALESCE($20, notes)
      WHERE id = $21
      RETURNING *
    `;

    const values = [
      email,
      first_name,
      last_name,
      phone,
      mobile_phone,
      company,
      company_title,
      position,
      status,
      subscription_status,
      tags,
      custom_fields ? JSON.stringify(custom_fields) : null,
      customer_representative,
      country,
      state,
      district,
      address_1,
      address_2,
      validatedImportanceLevel,
      notes,
      id,
    ];

    const result = await pool.query(query, values);

    res.json({
      success: true,
      message: 'Müşteri başarıyla güncellendi',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Müşteri güncelleme hatası:', error);

    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'Bu email adresi başka bir müşteri tarafından kullanılıyor',
      });
    }

    if (error.code === '23514') {
      return res.status(400).json({
        success: false,
        message: 'Önem derecesi 1-10 arası olmalıdır',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Müşteri güncellenirken hata oluştu',
      error: error.message,
    });
  }
});

// DELETE /api/contacts/:id - Müşteri sil
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM contacts WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Müşteri bulunamadı',
      });
    }

    res.json({
      success: true,
      message: 'Müşteri başarıyla silindi',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Müşteri silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Müşteri silinirken hata oluştu',
      error: error.message,
    });
  }
});

// POST /api/contacts/bulk-delete - Toplu silme
router.post('/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Geçerli ID listesi gönderilmedi',
      });
    }

    const result = await pool.query(
      'DELETE FROM contacts WHERE id = ANY($1) RETURNING id',
      [ids]
    );

    res.json({
      success: true,
      message: `${result.rows.length} müşteri başarıyla silindi`,
      deletedCount: result.rows.length,
    });
  } catch (error) {
    console.error('Toplu silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Müşteriler silinirken hata oluştu',
      error: error.message,
    });
  }
});

// GET /api/contacts/stats/summary - İstatistikler
router.get('/stats/summary', async (req, res) => {
  try {
    const statsQuery = `
      SELECT
        COUNT(*) as total_contacts,
        COUNT(*) FILTER (WHERE status = 'active') as active_contacts,
        COUNT(*) FILTER (WHERE subscription_status = 'subscribed') as subscribed_contacts,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_this_month
      FROM contacts
    `;

    const result = await pool.query(statsQuery);

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('İstatistik hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İstatistikler alınırken hata oluştu',
      error: error.message,
    });
  }
});

// POST /api/contacts/validate-ids - ID'lerin varlığını kontrol et (debug endpoint)
router.post('/validate-ids', async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids)) {
      return res.status(400).json({
        success: false,
        message: 'IDs array bekleniyor',
      });
    }

    const result = await pool.query(
      'SELECT id FROM contacts WHERE id = ANY($1)',
      [ids]
    );

    const existingIds = result.rows.map(row => row.id);
    const missingIds = ids.filter(id => !existingIds.includes(id));

    res.json({
      success: true,
      data: {
        total: ids.length,
        existing: existingIds.length,
        missing: missingIds.length,
        existingIds,
        missingIds,
      },
    });
  } catch (error) {
    console.error('ID validation error:', error);
    res.status(500).json({
      success: false,
      message: 'ID doğrulama hatası',
      error: error.message,
    });
  }
});

// GET /api/contacts/:id/sent-emails - Kişiye gönderilen tüm emailleri listele
router.get('/:id/sent-emails', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    // Kişiye gönderilen emailleri campaign bilgisi ile birlikte getir
    const query = `
      SELECT 
        cs.id,
        cs.campaign_id,
        cs.template_id,
        cs.sequence_index,
        cs.scheduled_date,
        cs.sent_date,
        cs.rendered_subject,
        cs.rendered_body_html,
        cs.is_sent,
        cs.is_opened,
        cs.is_clicked,
        cs.is_replied,
        cs.is_failed,
        cs.opened_at,
        cs.clicked_at,
        cs.replied_at,
        cs.failed_at,
        cs.failure_reason,
        ec.name as campaign_name,
        ec.status as campaign_status,
        et.name as template_name,
        et.category as template_category
      FROM campaign_sends cs
      LEFT JOIN email_campaigns ec ON cs.campaign_id = ec.id
      LEFT JOIN email_templates et ON cs.template_id = et.id
      WHERE cs.contact_id = $1
      ORDER BY cs.sent_date DESC NULLS LAST, cs.scheduled_date DESC
      LIMIT $2 OFFSET $3
    `;

    const countQuery = `
      SELECT COUNT(*) 
      FROM campaign_sends 
      WHERE contact_id = $1
    `;

    const [dataResult, countResult] = await Promise.all([
      pool.query(query, [id, pageSize, offset]),
      pool.query(countQuery, [id]),
    ]);

    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: dataResult.rows,
      pagination: {
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Sent emails error:', error);
    res.status(500).json({
      success: false,
      message: 'Gönderilen emailler alınırken hata oluştu',
      error: error.message,
    });
  }
});

module.exports = router;

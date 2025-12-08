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
      salutation,
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
      company,
      position,
    } = req.query;

    const offset = (page - 1) * pageSize;
    let query = 'SELECT * FROM contacts WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    // Helper: Virgülle ayrılmış string veya array'i array'e çevir
    const toArray = (val) => {
      if (!val) return null;
      if (Array.isArray(val)) return val;
      return val.includes(',') ? val.split(',').map(v => v.trim()) : [val];
    };

    // Filtreleme
    if (email) {
      query += ` AND email ILIKE $${paramIndex}`;
      params.push(`%${email}%`);
      paramIndex++;
    }

    // Salutation - multiple selection destekli
    if (salutation) {
      const salArr = toArray(salutation);
      if (salArr.length === 1) {
        query += ` AND salutation = $${paramIndex}`;
        params.push(salArr[0]);
      } else {
        query += ` AND salutation = ANY($${paramIndex})`;
        params.push(salArr);
      }
      paramIndex++;
    }

    // Status - multiple selection destekli
    if (status) {
      const statusArr = toArray(status);
      if (statusArr.length === 1) {
        query += ` AND status = $${paramIndex}`;
        params.push(statusArr[0]);
      } else {
        query += ` AND status = ANY($${paramIndex})`;
        params.push(statusArr);
      }
      paramIndex++;
    }

    // Subscription Status - multiple selection destekli
    if (subscription_status) {
      const subArr = toArray(subscription_status);
      if (subArr.length === 1) {
        query += ` AND subscription_status = $${paramIndex}`;
        params.push(subArr[0]);
      } else {
        query += ` AND subscription_status = ANY($${paramIndex})`;
        params.push(subArr);
      }
      paramIndex++;
    }

    if (tags) {
      // Tags string olarak gelirse virgülle ayır
      const tagArray = toArray(tags);
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

    // Customer Representative - multiple selection destekli
    if (customer_representative) {
      const repArr = toArray(customer_representative);
      if (repArr.length === 1) {
        query += ` AND customer_representative ILIKE $${paramIndex}`;
        params.push(`%${repArr[0]}%`);
      } else {
        query += ` AND customer_representative = ANY($${paramIndex})`;
        params.push(repArr);
      }
      paramIndex++;
    }

    // Country - multiple selection destekli
    if (country) {
      const countryArr = toArray(country);
      if (countryArr.length === 1) {
        query += ` AND country ILIKE $${paramIndex}`;
        params.push(`%${countryArr[0]}%`);
      } else {
        query += ` AND country = ANY($${paramIndex})`;
        params.push(countryArr);
      }
      paramIndex++;
    }

    // State - multiple selection destekli
    if (state) {
      const stateArr = toArray(state);
      if (stateArr.length === 1) {
        query += ` AND state ILIKE $${paramIndex}`;
        params.push(`%${stateArr[0]}%`);
      } else {
        query += ` AND state = ANY($${paramIndex})`;
        params.push(stateArr);
      }
      paramIndex++;
    }

    // District - multiple selection destekli
    if (district) {
      const districtArr = toArray(district);
      if (districtArr.length === 1) {
        query += ` AND district ILIKE $${paramIndex}`;
        params.push(`%${districtArr[0]}%`);
      } else {
        query += ` AND district = ANY($${paramIndex})`;
        params.push(districtArr);
      }
      paramIndex++;
    }

    // Importance Level - multiple selection destekli
    if (importance_level) {
      const impArr = toArray(importance_level).map(v => parseInt(v));
      if (impArr.length === 1) {
        query += ` AND importance_level = $${paramIndex}`;
        params.push(impArr[0]);
      } else {
        query += ` AND importance_level = ANY($${paramIndex})`;
        params.push(impArr);
      }
      paramIndex++;
    }

    // Company - multiple selection destekli
    if (company) {
      const companyArr = toArray(company);
      if (companyArr.length === 1) {
        query += ` AND company ILIKE $${paramIndex}`;
        params.push(`%${companyArr[0]}%`);
      } else {
        query += ` AND company = ANY($${paramIndex})`;
        params.push(companyArr);
      }
      paramIndex++;
    }

    // Position - multiple selection destekli
    if (position) {
      const positionArr = toArray(position);
      if (positionArr.length === 1) {
        query += ` AND position ILIKE $${paramIndex}`;
        params.push(`%${positionArr[0]}%`);
      } else {
        query += ` AND position = ANY($${paramIndex})`;
        params.push(positionArr);
      }
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

// GET /api/contacts/filter-options - Filtreleme için benzersiz değerleri getir
router.get('/filter-options', async (req, res) => {
  try {
    // Tüm filtrelenebilir alanlar için benzersiz değerleri al
    // Not: importance_level integer olabilir, bu yüzden boş string kontrolü yapmıyoruz
    const queries = {
      salutation: `SELECT DISTINCT salutation FROM contacts WHERE salutation IS NOT NULL AND salutation != '' ORDER BY salutation`,
      status: `SELECT DISTINCT status FROM contacts WHERE status IS NOT NULL AND status != '' ORDER BY status`,
      subscription_status: `SELECT DISTINCT subscription_status FROM contacts WHERE subscription_status IS NOT NULL AND subscription_status != '' ORDER BY subscription_status`,
      importance_level: `SELECT DISTINCT importance_level FROM contacts WHERE importance_level IS NOT NULL ORDER BY importance_level`,
      customer_representative: `SELECT DISTINCT customer_representative FROM contacts WHERE customer_representative IS NOT NULL AND customer_representative != '' ORDER BY customer_representative`,
      country: `SELECT DISTINCT country FROM contacts WHERE country IS NOT NULL AND country != '' ORDER BY country`,
      state: `SELECT DISTINCT state FROM contacts WHERE state IS NOT NULL AND state != '' ORDER BY state`,
      district: `SELECT DISTINCT district FROM contacts WHERE district IS NOT NULL AND district != '' ORDER BY district`,
      company: `SELECT DISTINCT company FROM contacts WHERE company IS NOT NULL AND company != '' ORDER BY company LIMIT 100`,
      position: `SELECT DISTINCT position FROM contacts WHERE position IS NOT NULL AND position != '' ORDER BY position LIMIT 100`,
      source: `SELECT DISTINCT source FROM contacts WHERE source IS NOT NULL AND source != '' ORDER BY source`,
    };

    const results = {};
    
    for (const [field, query] of Object.entries(queries)) {
      const result = await pool.query(query);
      results[field] = result.rows.map(row => row[field]).filter(v => v);
    }

    // Tags için özel işlem - JSONB array'den unique değerleri al
    const tagsQuery = `
      SELECT DISTINCT unnest(tags) as tag 
      FROM contacts 
      WHERE tags IS NOT NULL AND array_length(tags, 1) > 0 
      ORDER BY tag 
      LIMIT 100
    `;
    try {
      const tagsResult = await pool.query(tagsQuery);
      results.tags = tagsResult.rows.map(row => row.tag).filter(v => v);
    } catch (e) {
      results.tags = [];
    }

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Filter options error:', error);
    res.status(500).json({
      success: false,
      message: 'Filtre seçenekleri alınırken hata oluştu',
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
      salutation,
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
        email, salutation, first_name, last_name, phone, mobile_phone, company, company_title, position,
        status, subscription_status, source, tags, custom_fields,
        customer_representative, country, state, district, address_1, address_2, importance_level, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING *
    `;

    const values = [
      email,
      salutation,
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
      salutation,
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
        salutation = COALESCE($2, salutation),
        first_name = COALESCE($3, first_name),
        last_name = COALESCE($4, last_name),
        phone = COALESCE($5, phone),
        mobile_phone = COALESCE($6, mobile_phone),
        company = COALESCE($7, company),
        company_title = COALESCE($8, company_title),
        position = COALESCE($9, position),
        status = COALESCE($10, status),
        subscription_status = COALESCE($11, subscription_status),
        tags = COALESCE($12, tags),
        custom_fields = COALESCE($13, custom_fields),
        customer_representative = COALESCE($14, customer_representative),
        country = COALESCE($15, country),
        state = COALESCE($16, state),
        district = COALESCE($17, district),
        address_1 = COALESCE($18, address_1),
        address_2 = COALESCE($19, address_2),
        importance_level = COALESCE($20, importance_level),
        notes = COALESCE($21, notes)
      WHERE id = $22
      RETURNING *
    `;

    const values = [
      email,
      salutation,
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

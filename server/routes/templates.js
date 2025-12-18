const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authMiddleware } = require('../middleware/auth');

// Tüm templates route'ları için authentication zorunlu
router.use(authMiddleware);

// Helper: Kullanıcının organization_id'sini al (super_admin için null döner)
const getOrganizationId = (req) => {
  if (req.user.role === 'super_admin') {
    return null; // Super admin tüm organizasyonları görebilir
  }
  return req.user.organization_id;
};

async function generateUniqueTemplateName(originalName, organizationId, isSuperAdmin) {
  const baseName = `${originalName} (Kopya)`;
  let candidate = baseName;
  let counter = 2;

  while (true) {
    let exists;
    if (isSuperAdmin) {
      exists = await pool.query(
        'SELECT 1 FROM email_templates WHERE name = $1 LIMIT 1',
        [candidate]
      );
    } else {
      exists = await pool.query(
        'SELECT 1 FROM email_templates WHERE name = $1 AND organization_id = $2 LIMIT 1',
        [candidate, organizationId]
      );
    }

    if (exists.rows.length === 0) {
      return candidate;
    }

    candidate = `${baseName} ${counter}`;
    counter++;
  }
}

// GET /api/templates - Tüm şablonları listele - KULLANICI BAZLI
router.get('/', async (req, res) => {
  try {
    const organizationId = getOrganizationId(req);
    const userId = req.user.id;
    const isSuperAdmin = req.user.role === 'super_admin';
    const {
      page = 1,
      pageSize = 10,
      name,
      category,
      status,
      tags,
      search,
    } = req.query;

    const offset = (page - 1) * pageSize;
    
    let query, params, paramIndex;
    if (isSuperAdmin) {
      query = 'SELECT * FROM email_templates WHERE 1=1';
      params = [];
      paramIndex = 1;
    } else {
      // Her kullanıcı sadece kendi şablonlarını görebilir
      query = 'SELECT * FROM email_templates WHERE organization_id = $1 AND user_id = $2';
      params = [organizationId, userId];
      paramIndex = 3;
    }

    // Filtreleme
    if (name) {
      query += ` AND name ILIKE $${paramIndex}`;
      params.push(`%${name}%`);
      paramIndex++;
    }

    if (category) {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (tags) {
      const tagArray = tags.includes(',') ? tags.split(',').map(t => t.trim()) : [tags];
      query += ` AND tags && $${paramIndex}`;
      params.push(tagArray);
      paramIndex++;
    }

    if (search) {
      query += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR subject ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Total count için query
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Sıralama ve sayfalama
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(pageSize, offset);

    const result = await pool.query(query, params);

    res.json({
      data: result.rows,
      pagination: {
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
      },
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/templates/:id - Tek şablon detayı - KULLANICI BAZLI
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = getOrganizationId(req);
    const userId = req.user.id;
    const isSuperAdmin = req.user.role === 'super_admin';
    
    let result;
    if (isSuperAdmin) {
      result = await pool.query('SELECT * FROM email_templates WHERE id = $1', [id]);
    } else {
      // Her kullanıcı sadece kendi şablonuna erişebilir
      result = await pool.query('SELECT * FROM email_templates WHERE id = $1 AND organization_id = $2 AND user_id = $3', [id, organizationId, userId]);
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Şablon bulunamadı' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/templates - Yeni şablon oluştur - ORGANİZASYONA AİT
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const organizationId = req.user.organization_id;
    const {
      name,
      description,
      category,
      subject,
      preheader,
      body_html,
      body_text,
      from_name,
      from_email,
      reply_to,
      cc_emails,
      bcc_emails,
      priority,
      track_opens,
      track_clicks,
      available_variables,
      attachments,
      design_json,
      thumbnail_url,
      tags,
      language,
      status,
      is_default,
    } = req.body;

    const query = `
      INSERT INTO email_templates (
        name, description, category, subject, preheader,
        body_html, body_text, from_name, from_email, reply_to,
        cc_emails, bcc_emails, priority, track_opens, track_clicks,
        available_variables, attachments, design_json, thumbnail_url,
        tags, language, status, is_default, user_id, organization_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19,
        $20, $21, $22, $23, $24, $25
      ) RETURNING *
    `;

    const values = [
      name,
      description,
      category,
      subject,
      preheader,
      body_html,
      body_text || null,
      from_name || 'Email Otomasyon Platformu',
      from_email || 'noreply@example.com',
      reply_to || null,
      cc_emails || null,
      bcc_emails || null,
      priority || 'normal',
      track_opens !== undefined ? track_opens : true,
      track_clicks !== undefined ? track_clicks : true,
      JSON.stringify(available_variables || []),
      JSON.stringify(attachments || []),
      design_json ? JSON.stringify(design_json) : null,
      thumbnail_url || null,
      tags || null,
      language || 'tr',
      status || 'draft',
      is_default || false,
      userId,
      organizationId,
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Şablon başarıyla oluşturuldu',
    });
  } catch (error) {
    console.error('Create template error:', error);
    
    // Kullanıcı dostu hata mesajları
    let userMessage = 'Şablon oluşturulurken bir hata oluştu';
    
    if (error.code === '23505') {
      // Duplicate key hatası
      if (error.constraint === 'email_templates_name_key') {
        userMessage = 'Bu isimde bir şablon zaten mevcut. Lütfen farklı bir şablon adı girin.';
      } else {
        userMessage = 'Bu kayıt zaten mevcut.';
      }
    } else if (error.code === '23514') {
      // Check constraint hatası
      if (error.constraint === 'valid_category') {
        userMessage = 'Geçersiz kategori seçildi. Lütfen listeden bir kategori seçin.';
      } else if (error.constraint === 'valid_priority') {
        userMessage = 'Geçersiz öncelik seçildi.';
      } else if (error.constraint === 'valid_status') {
        userMessage = 'Geçersiz durum seçildi.';
      } else {
        userMessage = 'Girilen veriler geçerli değil: ' + (error.constraint || '');
      }
    } else if (error.code === '23502') {
      // Not null constraint hatası
      userMessage = 'Zorunlu alanlar eksik. Lütfen tüm zorunlu alanları doldurun.';
    } else if (error.code === '22001') {
      // String too long
      userMessage = 'Girilen metin çok uzun. Lütfen daha kısa bir değer girin.';
    }
    
    res.status(400).json({ 
      success: false, 
      message: userMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/templates/:id - Şablon güncelle - KULLANICI BAZLI
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = getOrganizationId(req);
    const userId = req.user.id;
    const isSuperAdmin = req.user.role === 'super_admin';
    
    // Önce şablonun kullanıcıya ait olduğunu kontrol et
    let checkResult;
    if (isSuperAdmin) {
      checkResult = await pool.query('SELECT id FROM email_templates WHERE id = $1', [id]);
    } else {
      // Her kullanıcı sadece kendi şablonunu güncelleyebilir
      checkResult = await pool.query('SELECT id FROM email_templates WHERE id = $1 AND organization_id = $2 AND user_id = $3', [id, organizationId, userId]);
    }
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Şablon bulunamadı' });
    }
    
    const {
      name,
      description,
      category,
      subject,
      preheader,
      body_html,
      body_text,
      from_name,
      from_email,
      reply_to,
      cc_emails,
      bcc_emails,
      priority,
      track_opens,
      track_clicks,
      available_variables,
      attachments,
      design_json,
      thumbnail_url,
      tags,
      language,
      status,
      is_default,
    } = req.body;

    const query = `
      UPDATE email_templates SET
        name = $1,
        description = $2,
        category = $3,
        subject = $4,
        preheader = $5,
        body_html = $6,
        body_text = $7,
        from_name = $8,
        from_email = $9,
        reply_to = $10,
        cc_emails = $11,
        bcc_emails = $12,
        priority = $13,
        track_opens = $14,
        track_clicks = $15,
        available_variables = $16,
        attachments = $17,
        design_json = $18,
        thumbnail_url = $19,
        tags = $20,
        language = $21,
        status = $22,
        is_default = $23,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $24
      RETURNING *
    `;

    const values = [
      name,
      description,
      category,
      subject,
      preheader,
      body_html,
      body_text,
      from_name,
      from_email,
      reply_to,
      cc_emails || null,
      bcc_emails || null,
      priority,
      track_opens,
      track_clicks,
      available_variables ? JSON.stringify(available_variables) : null,
      attachments ? JSON.stringify(attachments) : null,
      design_json ? JSON.stringify(design_json) : null,
      thumbnail_url,
      tags || null,
      language,
      status,
      is_default,
      id,
    ];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Şablon bulunamadı' });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Şablon başarıyla güncellendi',
    });
  } catch (error) {
    console.error('Update template error:', error);
    
    // Kullanıcı dostu hata mesajları
    let userMessage = 'Şablon güncellenirken bir hata oluştu';
    
    if (error.code === '23505') {
      if (error.constraint === 'email_templates_name_key') {
        userMessage = 'Bu isimde bir şablon zaten mevcut. Lütfen farklı bir şablon adı girin.';
      } else {
        userMessage = 'Bu kayıt zaten mevcut.';
      }
    } else if (error.code === '23514') {
      if (error.constraint === 'valid_category') {
        userMessage = 'Geçersiz kategori seçildi. Lütfen listeden bir kategori seçin.';
      } else if (error.constraint === 'valid_priority') {
        userMessage = 'Geçersiz öncelik seçildi.';
      } else if (error.constraint === 'valid_status') {
        userMessage = 'Geçersiz durum seçildi.';
      } else {
        userMessage = 'Girilen veriler geçerli değil: ' + (error.constraint || '');
      }
    } else if (error.code === '23502') {
      userMessage = 'Zorunlu alanlar eksik. Lütfen tüm zorunlu alanları doldurun.';
    } else if (error.code === '22001') {
      userMessage = 'Girilen metin çok uzun. Lütfen daha kısa bir değer girin.';
    }
    
    res.status(400).json({ 
      success: false, 
      message: userMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETE /api/templates/:id - Şablon sil - KULLANICI BAZLI
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = getOrganizationId(req);
    const userId = req.user.id;
    const isSuperAdmin = req.user.role === 'super_admin';
    
    // Önce şablonun kullanıcıya ait olduğunu kontrol et
    let ownerCheck;
    if (isSuperAdmin) {
      ownerCheck = await pool.query('SELECT id FROM email_templates WHERE id = $1', [id]);
    } else {
      // Her kullanıcı sadece kendi şablonunu silebilir
      ownerCheck = await pool.query('SELECT id FROM email_templates WHERE id = $1 AND organization_id = $2 AND user_id = $3', [id, organizationId, userId]);
    }
    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Şablon bulunamadı' });
    }
    
    // Şablonun herhangi bir kampanyada kullanılıp kullanılmadığını kontrol et
    // JSONB içinde template_id kontrolü - kullanıcının kampanyaları
    let campaignUsage;
    if (isSuperAdmin) {
      campaignUsage = await pool.query(
        `SELECT c.id, c.name
         FROM email_campaigns c
         CROSS JOIN LATERAL jsonb_array_elements(c.template_sequence) AS template
         WHERE COALESCE((template->>'template_id')::integer, (template->>'templateId')::integer) = $1`,
        [id]
      );
    } else {
      // Sadece kullanıcının kendi kampanyalarında kullanıp kullanmadığını kontrol et
      campaignUsage = await pool.query(
        `SELECT c.id, c.name
         FROM email_campaigns c
         CROSS JOIN LATERAL jsonb_array_elements(c.template_sequence) AS template
         WHERE c.organization_id = $1 AND c.user_id = $2 AND COALESCE((template->>'template_id')::integer, (template->>'templateId')::integer) = $3`,
        [organizationId, userId, id]
      );
    }
    
    if (campaignUsage.rows.length > 0) {
      const campaignNames = campaignUsage.rows.map((row) => `"${row.name}"`).join(', ');
      return res.status(400).json({ 
        success: false, 
        message: `Bu şablon şu kampanyalarda kullanılıyor: ${campaignNames}. Lütfen önce bu kampanyalardan çıkarın.`,
        usedInCampaigns: campaignUsage.rows
      });
    }

    // Şablonun campaign_sends'de kullanılıp kullanılmadığını kontrol et
    const sendsCheck = await pool.query(
      `SELECT COUNT(*) as count 
       FROM campaign_sends 
       WHERE template_id = $1 
       LIMIT 1`,
      [id]
    );

    if (sendsCheck.rows[0].count > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Bu şablon daha önce ${sendsCheck.rows[0].count} kez kullanılmış ve silinemez. Bunun yerine arşivleyebilirsiniz.`
      });
    }
    
    const result = await pool.query(
      'DELETE FROM email_templates WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Şablon bulunamadı' });
    }

    res.json({
      success: true,
      message: 'Şablon başarıyla silindi',
    });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/templates/bulk-delete - Toplu şablon silme - KULLANICI BAZLI
router.post('/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    const organizationId = getOrganizationId(req);
    const userId = req.user.id;
    const isSuperAdmin = req.user.role === 'super_admin';

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Geçersiz ID listesi' });
    }

    // Hangi şablonların kampanyalarda kullanıldığını kontrol et
    const usedTemplates = [];
    for (const id of ids) {
      // Önce şablonun kullanıcıya ait olduğunu kontrol et
      let ownerCheck;
      if (isSuperAdmin) {
        ownerCheck = await pool.query('SELECT name FROM email_templates WHERE id = $1', [id]);
      } else {
        // Her kullanıcı sadece kendi şablonunu silebilir
        ownerCheck = await pool.query('SELECT name FROM email_templates WHERE id = $1 AND organization_id = $2 AND user_id = $3', [id, organizationId, userId]);
      }
      if (ownerCheck.rows.length === 0) {
        continue; // Kullanıcıya ait olmayan şablonu atla
      }
      
      // Kampanyalarda kullanım kontrolü - kullanıcının kendi kampanyalarında
      let campaignUsage;
      if (isSuperAdmin) {
        campaignUsage = await pool.query(
          `SELECT c.id, c.name 
           FROM email_campaigns c
           CROSS JOIN LATERAL jsonb_array_elements(c.template_sequence) AS template
           WHERE COALESCE((template->>'template_id')::integer, (template->>'templateId')::integer) = $1`,
          [id]
        );
      } else {
        campaignUsage = await pool.query(
          `SELECT c.id, c.name 
           FROM email_campaigns c
           CROSS JOIN LATERAL jsonb_array_elements(c.template_sequence) AS template
           WHERE c.organization_id = $1 AND c.user_id = $2 AND COALESCE((template->>'template_id')::integer, (template->>'templateId')::integer) = $3`,
          [organizationId, userId, id]
        );
      }
      
      if (campaignUsage.rows.length > 0) {
        usedTemplates.push({
          templateId: id,
          templateName: ownerCheck.rows[0]?.name || `Template #${id}`,
          campaignNames: campaignUsage.rows.map((row) => row.name)
        });
        continue;
      }

      // campaign_sends'de kullanım kontrolü
      const sendsCheck = await pool.query(
        `SELECT COUNT(*) as count FROM campaign_sends WHERE template_id = $1`,
        [id]
      );

      if (parseInt(sendsCheck.rows[0].count) > 0) {
        usedTemplates.push({
          templateId: id,
          templateName: ownerCheck.rows[0]?.name || `Template #${id}`,
          usageCount: sendsCheck.rows[0].count
        });
      }
    }
    
    // Eğer kullanılmakta olan şablon varsa, silme işlemini engelle
    if (usedTemplates.length > 0) {
      const messages = usedTemplates.map(t => {
        if (t.campaignNames) {
          const campaigns = t.campaignNames.map(name => `"${name}"`).join(', ');
          return `"${t.templateName}" şablonu şu kampanyalarda kullanılıyor: ${campaigns}`;
        } else {
          return `"${t.templateName}" şablonu ${t.usageCount} kez kullanılmış`;
        }
      }).join('; ');
      
      return res.status(400).json({ 
        success: false, 
        message: `Şu şablonlar silinemez: ${messages}. Lütfen önce bu kampanyalardaki kullanımları kaldırın.`,
        usedTemplates
      });
    }

    // Hiçbiri kullanılmıyorsa, tümünü sil
    let result;
    if (isSuperAdmin) {
      result = await pool.query(
        'DELETE FROM email_templates WHERE id = ANY($1) RETURNING id',
        [ids]
      );
    } else {
      // Her kullanıcı sadece kendi şablonlarını silebilir
      result = await pool.query(
        'DELETE FROM email_templates WHERE id = ANY($1) AND organization_id = $2 AND user_id = $3 RETURNING id',
        [ids, organizationId, userId]
      );
    }

    res.json({
      success: true,
      message: `${result.rows.length} şablon başarıyla silindi`,
      deletedCount: result.rows.length,
    });
  } catch (error) {
    console.error('Bulk delete templates error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/templates/:id/duplicate - Şablon kopyala - KULLANICI BAZLI
router.post('/:id/duplicate', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const organizationId = req.user.organization_id;
    const isSuperAdmin = req.user.role === 'super_admin';
    
    // Orijinal şablonu al - her kullanıcı sadece kendi şablonunu kopyalayabilir
    let original;
    if (isSuperAdmin) {
      original = await pool.query('SELECT * FROM email_templates WHERE id = $1', [id]);
    } else {
      original = await pool.query('SELECT * FROM email_templates WHERE id = $1 AND organization_id = $2 AND user_id = $3', [id, organizationId, userId]);
    }
    
    if (original.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Şablon bulunamadı' });
    }

    const template = original.rows[0];

    const newName = await generateUniqueTemplateName(template.name, organizationId, isSuperAdmin);

    let result;
    if (isSuperAdmin) {
      result = await pool.query(
        `INSERT INTO email_templates (
           name, description, category, subject, preheader,
           body_html, body_text, from_name, from_email, reply_to,
           cc_emails, bcc_emails, priority, track_opens, track_clicks,
           available_variables, attachments, design_json, thumbnail_url,
           tags, language, status, user_id, organization_id
         )
         SELECT
           $1, description, category, subject, preheader,
           body_html, body_text, from_name, from_email, reply_to,
           cc_emails, bcc_emails, priority, track_opens, track_clicks,
           available_variables, attachments, design_json, thumbnail_url,
           tags, language, 'draft', $3, organization_id
         FROM email_templates
         WHERE id = $2
         RETURNING *`,
        [newName, id, userId]
      );
    } else {
      result = await pool.query(
        `INSERT INTO email_templates (
           name, description, category, subject, preheader,
           body_html, body_text, from_name, from_email, reply_to,
           cc_emails, bcc_emails, priority, track_opens, track_clicks,
           available_variables, attachments, design_json, thumbnail_url,
           tags, language, status, user_id, organization_id
         )
         SELECT
           $1, description, category, subject, preheader,
           body_html, body_text, from_name, from_email, reply_to,
           cc_emails, bcc_emails, priority, track_opens, track_clicks,
           available_variables, attachments, design_json, thumbnail_url,
           tags, language, 'draft', $3, $4
         FROM email_templates
         WHERE id = $2 AND organization_id = $4 AND user_id = $3
         RETURNING *`,
        [newName, id, userId, organizationId]
      );
    }

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Şablon başarıyla kopyalandı',
    });
  } catch (error) {
    console.error('Duplicate template error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/templates/stats/summary - İstatistikler - KULLANICI BAZLI
router.get('/stats/summary', async (req, res) => {
  try {
    const organizationId = getOrganizationId(req);
    const userId = req.user.id;
    const isSuperAdmin = req.user.role === 'super_admin';
    
    // Her kullanıcı sadece kendi şablonlarının istatistiklerini görebilir
    const whereClause = isSuperAdmin ? '1=1' : 'organization_id = $1 AND user_id = $2';
    const params = isSuperAdmin ? [] : [organizationId, userId];
    
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_templates,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_templates,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_templates,
        COUNT(CASE WHEN status = 'archived' THEN 1 END) as archived_templates,
        SUM(usage_count) as total_usage
      FROM email_templates
      WHERE ${whereClause}
    `, params);

    const categoryStats = await pool.query(`
      SELECT category, COUNT(*) as count
      FROM email_templates
      WHERE ${whereClause} AND category IS NOT NULL
      GROUP BY category
      ORDER BY count DESC
    `, params);

    res.json({
      success: true,
      data: {
        summary: stats.rows[0],
        byCategory: categoryStats.rows,
      },
    });
  } catch (error) {
    console.error('Get template stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { pool } = require('../db');

async function generateUniqueTemplateName(originalName) {
  const baseName = `${originalName} (Kopya)`;
  let candidate = baseName;
  let counter = 2;

  while (true) {
    const exists = await pool.query(
      'SELECT 1 FROM email_templates WHERE name = $1 LIMIT 1',
      [candidate]
    );

    if (exists.rows.length === 0) {
      return candidate;
    }

    candidate = `${baseName} ${counter}`;
    counter++;
  }
}

// GET /api/templates - Tüm şablonları listele (filtreleme ile)
router.get('/', async (req, res) => {
  try {
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
    let query = 'SELECT * FROM email_templates WHERE 1=1';
    const params = [];
    let paramIndex = 1;

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

// GET /api/templates/:id - Tek şablon detayı
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM email_templates WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Şablon bulunamadı' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/templates - Yeni şablon oluştur
router.post('/', async (req, res) => {
  try {
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
        tags, language, status, is_default
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19,
        $20, $21, $22, $23
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
      cc_emails || [],
      bcc_emails || [],
      priority || 'normal',
      track_opens !== undefined ? track_opens : true,
      track_clicks !== undefined ? track_clicks : true,
      available_variables || [],
      attachments || [],
      design_json || null,
      thumbnail_url || null,
      tags || [],
      language || 'tr',
      status || 'draft',
      is_default || false,
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Şablon başarıyla oluşturuldu',
    });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/templates/:id - Şablon güncelle
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
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
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/templates/:id - Şablon sil
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Şablonun herhangi bir kampanyada kullanılıp kullanılmadığını kontrol et
    // JSONB içinde template_id kontrolü
    const campaignUsage = await pool.query(
      `SELECT c.id, c.name
       FROM email_campaigns c
       CROSS JOIN LATERAL jsonb_array_elements(c.template_sequence) AS template
       WHERE COALESCE((template->>'template_id')::integer, (template->>'templateId')::integer) = $1`,
      [id]
    );
    
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

// POST /api/templates/bulk-delete - Toplu şablon silme
router.post('/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Geçersiz ID listesi' });
    }

    // Hangi şablonların kampanyalarda kullanıldığını kontrol et
    const usedTemplates = [];
    for (const id of ids) {
      // Kampanyalarda kullanım kontrolü (JSONB doğru şekilde)
      const campaignUsage = await pool.query(
        `SELECT c.id, c.name 
         FROM email_campaigns c
         CROSS JOIN LATERAL jsonb_array_elements(c.template_sequence) AS template
         WHERE COALESCE((template->>'template_id')::integer, (template->>'templateId')::integer) = $1`,
        [id]
      );
      
      if (campaignUsage.rows.length > 0) {
        // Şablon adını al
        const templateResult = await pool.query(
          'SELECT name FROM email_templates WHERE id = $1',
          [id]
        );
        
        usedTemplates.push({
          templateId: id,
          templateName: templateResult.rows[0]?.name || `Template #${id}`,
          campaignNames: campaignUsage.rows.map((row) => row.name)
        });
        continue; // Bir sonraki şablona geç
      }

      // campaign_sends'de kullanım kontrolü
      const sendsCheck = await pool.query(
        `SELECT COUNT(*) as count FROM campaign_sends WHERE template_id = $1`,
        [id]
      );

      if (parseInt(sendsCheck.rows[0].count) > 0) {
        const templateResult = await pool.query(
          'SELECT name FROM email_templates WHERE id = $1',
          [id]
        );
        
        usedTemplates.push({
          templateId: id,
          templateName: templateResult.rows[0]?.name || `Template #${id}`,
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
    const result = await pool.query(
      'DELETE FROM email_templates WHERE id = ANY($1) RETURNING id',
      [ids]
    );

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

// POST /api/templates/:id/duplicate - Şablon kopyala
router.post('/:id/duplicate', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Orijinal şablonu al
    const original = await pool.query('SELECT * FROM email_templates WHERE id = $1', [id]);
    
    if (original.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Şablon bulunamadı' });
    }

    const template = original.rows[0];

    const newName = await generateUniqueTemplateName(template.name);

    const result = await pool.query(
      `INSERT INTO email_templates (
         name, description, category, subject, preheader,
         body_html, body_text, from_name, from_email, reply_to,
         cc_emails, bcc_emails, priority, track_opens, track_clicks,
         available_variables, attachments, design_json, thumbnail_url,
         tags, language, status
       )
       SELECT
         $1, description, category, subject, preheader,
         body_html, body_text, from_name, from_email, reply_to,
         cc_emails, bcc_emails, priority, track_opens, track_clicks,
         available_variables, attachments, design_json, thumbnail_url,
         tags, language, 'draft'
       FROM email_templates
       WHERE id = $2
       RETURNING *`,
      [newName, id]
    );

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

// GET /api/templates/stats/summary - İstatistikler
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_templates,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_templates,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_templates,
        COUNT(CASE WHEN status = 'archived' THEN 1 END) as archived_templates,
        SUM(usage_count) as total_usage
      FROM email_templates
    `);

    const categoryStats = await pool.query(`
      SELECT category, COUNT(*) as count
      FROM email_templates
      WHERE category IS NOT NULL
      GROUP BY category
      ORDER BY count DESC
    `);

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

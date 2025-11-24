const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('connect', () => {
  console.log('✅ PostgreSQL veritabanına bağlandı (Campaigns)');
});

function normalizeTemplateSequence(sequence) {
  if (!sequence) {
    return [];
  }

  if (Array.isArray(sequence)) {
    return sequence;
  }

  if (typeof sequence === 'string') {
    try {
      const parsed = JSON.parse(sequence);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Template sequence parse error:', error);
      return [];
    }
  }

  if (typeof sequence === 'object') {
    return Array.isArray(sequence) ? sequence : [];
  }

  return [];
}

function getTemplateUsageCounts(sequence) {
  const normalized = normalizeTemplateSequence(sequence);
  const counts = {};

  normalized.forEach((item) => {
    if (!item || typeof item !== 'object') {
      return;
    }

    const templateId = item.template_id ?? item.templateId;
    const numericId = Number(templateId);

    if (!Number.isInteger(numericId)) {
      return;
    }

    counts[numericId] = (counts[numericId] || 0) + 1;
  });

  return counts;
}

function calculateTemplateUsageDiff(oldCounts = {}, newCounts = {}) {
  const diff = {};
  const templateIds = new Set([
    ...Object.keys(oldCounts),
    ...Object.keys(newCounts),
  ]);

  templateIds.forEach((templateId) => {
    const numericId = Number(templateId);
    if (!Number.isInteger(numericId)) {
      return;
    }

    const delta = (newCounts[templateId] || 0) - (oldCounts[templateId] || 0);
    if (delta !== 0) {
      diff[numericId] = delta;
    }
  });

  return diff;
}

async function applyTemplateUsageDiff(diffMap = {}) {
  const entries = Object.entries(diffMap);
  for (const [templateId, diffValue] of entries) {
    const numericId = Number(templateId);
    const numericDiff = Number(diffValue);

    if (!Number.isInteger(numericId) || Number.isNaN(numericDiff) || numericDiff === 0) {
      continue;
    }

    await pool.query(
      `UPDATE email_templates
         SET usage_count = GREATEST(0, COALESCE(usage_count, 0) + $2),
             last_used_at = CASE WHEN $2 > 0 THEN CURRENT_TIMESTAMP ELSE last_used_at END
       WHERE id = $1`,
      [numericId, numericDiff]
    );
  }
}

// GET /api/campaigns - Tüm kampanyaları listele (sayfalama, filtreleme, sıralama)
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      pageSize = 10,
      name,
      status,
      search,
      sort_by = 'created_at',
      sort_order = 'desc',
    } = req.query;

    const offset = (page - 1) * (pageSize || limit);

    let query = 'SELECT * FROM email_campaigns WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (name) {
      query += ` AND name ILIKE $${paramIndex}`;
      params.push(`%${name}%`);
      paramIndex++;
    }

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (search) {
      query += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Sıralama ve sayfalama
    const validSortColumns = ['created_at', 'name', 'status', 'first_send_date', 'total_recipients', 'total_sent'];
    const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'created_at';
    const sortDirection = sort_order === 'asc' ? 'ASC' : 'DESC';
    
    query += ` ORDER BY ${sortColumn} ${sortDirection} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(pageSize || limit, offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize || limit),
      },
    });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/campaigns/:id - Tek kampanya detayı
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM email_campaigns WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Kampanya bulunamadı' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/campaigns - Yeni kampanya oluştur
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      target_contact_ids,
      target_filters,
      is_recurring,
      template_sequence,
      first_send_date,
      recurrence_interval_days,
      stop_on_reply,
      reply_notification_email,
      status = 'draft',
    } = req.body;

    // Hedef kişi sayısını hesapla
    let total_recipients = 0;
    if (target_contact_ids && target_contact_ids.length > 0) {
      total_recipients = target_contact_ids.length;
    }

    const templateCounts = getTemplateUsageCounts(template_sequence);
    const templateSequenceJson =
      typeof template_sequence === 'undefined' || template_sequence === null
        ? null
        : JSON.stringify(template_sequence);

    const query = `
      INSERT INTO email_campaigns (
        name, description, target_contact_ids, target_filters,
        is_recurring, template_sequence, first_send_date, recurrence_interval_days,
        stop_on_reply, reply_notification_email, total_recipients, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const values = [
      name,
      description,
      target_contact_ids,
      target_filters ? JSON.stringify(target_filters) : null,
      is_recurring,
      templateSequenceJson,
      first_send_date,
      recurrence_interval_days,
      stop_on_reply,
      reply_notification_email,
      total_recipients,
      status,
    ];

    const result = await pool.query(query, values);

    if (Object.keys(templateCounts).length > 0) {
      await applyTemplateUsageDiff(templateCounts);
    }

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Kampanya başarıyla oluşturuldu',
    });
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/campaigns/:id - Kampanya güncelle
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      target_contact_ids,
      target_filters,
      is_recurring,
      template_sequence,
      first_send_date,
      recurrence_interval_days,
      stop_on_reply,
      reply_notification_email,
      status,
    } = req.body;

    const existingCampaign = await pool.query(
      'SELECT template_sequence FROM email_campaigns WHERE id = $1',
      [id]
    );

    if (existingCampaign.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Kampanya bulunamadı' });
    }

    const existingSequenceNormalized = normalizeTemplateSequence(
      existingCampaign.rows[0].template_sequence
    );
    const existingCounts = getTemplateUsageCounts(existingSequenceNormalized);
    const incomingSequenceProvided = typeof template_sequence !== 'undefined';
    const effectiveSequence = incomingSequenceProvided
      ? template_sequence
      : existingSequenceNormalized;
    const newCounts = getTemplateUsageCounts(effectiveSequence);
    const usageDiff = calculateTemplateUsageDiff(existingCounts, newCounts);
    const templateSequenceJson = incomingSequenceProvided
      ? template_sequence === null
        ? null
        : JSON.stringify(template_sequence)
      : existingCampaign.rows[0].template_sequence === null
        ? null
        : JSON.stringify(existingSequenceNormalized);

    // Hedef kişi sayısını hesapla
    let total_recipients = 0;
    if (target_contact_ids && target_contact_ids.length > 0) {
      total_recipients = target_contact_ids.length;
    }

    const query = `
      UPDATE email_campaigns SET
        name = $1,
        description = $2,
        target_contact_ids = $3,
        target_filters = $4,
        is_recurring = $5,
        template_sequence = $6,
        first_send_date = $7,
        recurrence_interval_days = $8,
        stop_on_reply = $9,
        reply_notification_email = $10,
        total_recipients = $11,
        status = $12,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $13
      RETURNING *
    `;

    const values = [
      name,
      description,
      target_contact_ids,
      target_filters ? JSON.stringify(target_filters) : null,
      is_recurring,
      templateSequenceJson,
      first_send_date,
      recurrence_interval_days,
      stop_on_reply,
      reply_notification_email,
      total_recipients,
      status,
      id,
    ];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Kampanya bulunamadı' });
    }

    if (Object.keys(usageDiff).length > 0) {
      await applyTemplateUsageDiff(usageDiff);
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Kampanya başarıyla güncellendi',
    });
  } catch (error) {
    console.error('Update campaign error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/campaigns/:id - Kampanya sil
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existingCampaign = await pool.query(
      'SELECT template_sequence FROM email_campaigns WHERE id = $1',
      [id]
    );

    if (existingCampaign.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Kampanya bulunamadı' });
    }

    const existingCounts = getTemplateUsageCounts(existingCampaign.rows[0].template_sequence);
    const usageDiff = calculateTemplateUsageDiff(existingCounts, {});

    const result = await pool.query(
      'DELETE FROM email_campaigns WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Kampanya bulunamadı' });
    }

    if (Object.keys(usageDiff).length > 0) {
      await applyTemplateUsageDiff(usageDiff);
    }

    res.json({
      success: true,
      message: 'Kampanya başarıyla silindi',
    });
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/campaigns/bulk-delete - Toplu kampanya silme
router.post('/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Geçerli ID listesi gönderilmedi' });
    }

    const campaigns = await pool.query(
      'SELECT id, template_sequence FROM email_campaigns WHERE id = ANY($1)',
      [ids]
    );

    const aggregatedCounts = {};
    campaigns.rows.forEach((row) => {
      const counts = getTemplateUsageCounts(row.template_sequence);
      Object.entries(counts).forEach(([templateId, count]) => {
        const numericId = Number(templateId);
        if (!Number.isInteger(numericId)) {
          return;
        }
        aggregatedCounts[numericId] = (aggregatedCounts[numericId] || 0) + count;
      });
    });

    const usageDiff = calculateTemplateUsageDiff(aggregatedCounts, {});

    const result = await pool.query(
      'DELETE FROM email_campaigns WHERE id = ANY($1) RETURNING id',
      [ids]
    );

    if (Object.keys(usageDiff).length > 0) {
      await applyTemplateUsageDiff(usageDiff);
    }

    res.json({
      success: true,
      message: `${result.rows.length} kampanya başarıyla silindi`,
      deleted_count: result.rows.length,
    });
  } catch (error) {
    console.error('Bulk delete campaigns error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/campaigns/:id/duplicate - Kampanya kopyala
router.post('/:id/duplicate', async (req, res) => {
  try {
    const { id } = req.params;
    
    const original = await pool.query('SELECT * FROM email_campaigns WHERE id = $1', [id]);
    
    if (original.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Kampanya bulunamadı' });
    }

    const campaign = original.rows[0];
    const newName = `${campaign.name} (Kopya)`;
    const templateCounts = getTemplateUsageCounts(campaign.template_sequence);

    const query = `
      INSERT INTO email_campaigns (
        name, description, target_contact_ids, target_filters,
        is_recurring, template_sequence, first_send_date, recurrence_interval_days,
        stop_on_reply, reply_notification_email, total_recipients, status
      ) VALUES ($1, $2, $3, $4::jsonb, $5, $6::jsonb, $7, $8, $9, $10, $11, 'draft')
      RETURNING *
    `;

    const values = [
      newName,
      campaign.description,
      campaign.target_contact_ids, // integer[] olarak direkt
      JSON.stringify(campaign.target_filters || {}), // jsonb
      campaign.is_recurring,
      JSON.stringify(campaign.template_sequence || []), // jsonb
      campaign.first_send_date,
      campaign.recurrence_interval_days,
      campaign.stop_on_reply,
      campaign.reply_notification_email,
      campaign.total_recipients,
    ];

    const result = await pool.query(query, values);

    if (Object.keys(templateCounts).length > 0) {
      await applyTemplateUsageDiff(templateCounts);
    }

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Kampanya başarıyla kopyalandı',
    });
  } catch (error) {
    console.error('Duplicate campaign error:', error);
    console.error('Error details:', error.stack);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/campaigns/stats/summary - İstatistikler
router.get('/stats/summary', async (req, res) => {
  try {
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_campaigns,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_campaigns,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_campaigns,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_campaigns,
        SUM(total_sent) as total_sends,
        SUM(total_opened) as total_opens,
        SUM(total_clicked) as total_clicks
      FROM email_campaigns
    `;

    const byStatusQuery = `
      SELECT status, COUNT(*) as count
      FROM email_campaigns
      GROUP BY status
      ORDER BY count DESC
    `;

    const [summaryResult, byStatusResult] = await Promise.all([
      pool.query(summaryQuery),
      pool.query(byStatusQuery),
    ]);

    res.json({
      success: true,
      data: {
        summary: summaryResult.rows[0],
        byStatus: byStatusResult.rows,
      },
    });
  } catch (error) {
    console.error('Get campaign stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

/**
 * Organizations API Routes
 * Organizasyon yönetimi - Sadece Super Admin erişebilir
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authMiddleware, requireSuperAdmin } = require('../middleware/auth');

// Tüm routes için authentication zorunlu
router.use(authMiddleware);

// ============================================
// GET /api/organizations - Tüm organizasyonları listele
// Sadece Super Admin
// ============================================
router.get('/', requireSuperAdmin, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, search, status } = req.query;
    const offset = (page - 1) * pageSize;
    
    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (status) {
      whereConditions.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Toplam sayı
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM organizations ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Organizasyonlar + kullanıcı sayısı
    const result = await pool.query(
      `SELECT 
        o.*,
        (SELECT COUNT(*) FROM users u WHERE u.organization_id = o.id) as user_count,
        (SELECT COUNT(*) FROM contacts c WHERE c.user_id IN (SELECT id FROM users WHERE organization_id = o.id)) as contact_count,
        (SELECT COUNT(*) FROM email_campaigns ec WHERE ec.user_id IN (SELECT id FROM users WHERE organization_id = o.id)) as campaign_count
      FROM organizations o
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, pageSize, offset]
    );

    res.json({
      success: true,
      data: result.rows,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    console.error('Organizasyonlar listelenirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Organizasyonlar listelenirken bir hata oluştu'
    });
  }
});

// ============================================
// GET /api/organizations/:id - Tek organizasyon detayı
// Super Admin veya kendi organizasyonu
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // Super admin değilse sadece kendi organizasyonunu görebilir
    if (user.role !== 'super_admin' && user.organizationId !== parseInt(id)) {
      return res.status(403).json({
        success: false,
        message: 'Bu organizasyonu görüntüleme yetkiniz yok'
      });
    }

    const result = await pool.query(
      `SELECT 
        o.*,
        (SELECT COUNT(*) FROM users u WHERE u.organization_id = o.id) as user_count,
        (SELECT COUNT(*) FROM contacts c WHERE c.user_id IN (SELECT id FROM users WHERE organization_id = o.id)) as contact_count,
        (SELECT COUNT(*) FROM email_campaigns ec WHERE ec.user_id IN (SELECT id FROM users WHERE organization_id = o.id)) as campaign_count
      FROM organizations o
      WHERE o.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Organizasyon bulunamadı'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Organizasyon detayı alınırken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Organizasyon detayı alınırken bir hata oluştu'
    });
  }
});

// ============================================
// POST /api/organizations - Yeni organizasyon oluştur
// Sadece Super Admin
// ============================================
router.post('/', requireSuperAdmin, async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      email,
      phone,
      website,
      address,
      city,
      country = 'Türkiye',
      plan = 'free',
      max_users = 5,
      max_contacts = 1000,
      max_emails_per_month = 5000,
      status = 'active'
    } = req.body;

    // Zorunlu alanlar
    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        message: 'İsim ve slug zorunludur'
      });
    }

    // Slug benzersizliğini kontrol et
    const slugCheck = await pool.query(
      'SELECT id FROM organizations WHERE slug = $1',
      [slug]
    );

    if (slugCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Bu slug zaten kullanılıyor'
      });
    }

    const result = await pool.query(
      `INSERT INTO organizations (
        name, slug, description, email, phone, website, 
        address, city, country, plan, max_users, max_contacts, 
        max_emails_per_month, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        name, slug, description, email, phone, website,
        address, city, country, plan, max_users, max_contacts,
        max_emails_per_month, status
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Organizasyon başarıyla oluşturuldu',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Organizasyon oluşturulurken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Organizasyon oluşturulurken bir hata oluştu'
    });
  }
});

// ============================================
// PUT /api/organizations/:id - Organizasyon güncelle
// Super Admin: her şeyi güncelleyebilir
// Org Admin: sadece kendi org'unun temel bilgilerini (limit hariç)
// ============================================
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const {
      name,
      description,
      email,
      phone,
      website,
      address,
      city,
      country,
      plan,
      max_users,
      max_contacts,
      max_emails_per_month,
      status,
      settings
    } = req.body;

    // Organizasyonun varlığını kontrol et
    const orgCheck = await pool.query('SELECT * FROM organizations WHERE id = $1', [id]);
    if (orgCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Organizasyon bulunamadı'
      });
    }

    // Yetki kontrolü
    const isSuperAdmin = user.role === 'super_admin';
    const isOwnOrg = user.organizationId === parseInt(id);
    const isOrgAdmin = user.role === 'org_admin';

    if (!isSuperAdmin && !(isOrgAdmin && isOwnOrg)) {
      return res.status(403).json({
        success: false,
        message: 'Bu organizasyonu düzenleme yetkiniz yok'
      });
    }

    // Org admin limit değiştiremez
    let updateFields = [];
    let updateValues = [];
    let paramIndex = 1;

    // Temel bilgiler - herkes güncelleyebilir
    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      updateValues.push(name);
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      updateValues.push(description);
    }
    if (email !== undefined) {
      updateFields.push(`email = $${paramIndex++}`);
      updateValues.push(email);
    }
    if (phone !== undefined) {
      updateFields.push(`phone = $${paramIndex++}`);
      updateValues.push(phone);
    }
    if (website !== undefined) {
      updateFields.push(`website = $${paramIndex++}`);
      updateValues.push(website);
    }
    if (address !== undefined) {
      updateFields.push(`address = $${paramIndex++}`);
      updateValues.push(address);
    }
    if (city !== undefined) {
      updateFields.push(`city = $${paramIndex++}`);
      updateValues.push(city);
    }
    if (country !== undefined) {
      updateFields.push(`country = $${paramIndex++}`);
      updateValues.push(country);
    }
    if (settings !== undefined) {
      updateFields.push(`settings = $${paramIndex++}`);
      updateValues.push(JSON.stringify(settings));
    }

    // Sadece Super Admin güncelleyebilir
    if (isSuperAdmin) {
      if (plan !== undefined) {
        updateFields.push(`plan = $${paramIndex++}`);
        updateValues.push(plan);
      }
      if (max_users !== undefined) {
        updateFields.push(`max_users = $${paramIndex++}`);
        updateValues.push(max_users);
      }
      if (max_contacts !== undefined) {
        updateFields.push(`max_contacts = $${paramIndex++}`);
        updateValues.push(max_contacts);
      }
      if (max_emails_per_month !== undefined) {
        updateFields.push(`max_emails_per_month = $${paramIndex++}`);
        updateValues.push(max_emails_per_month);
      }
      if (status !== undefined) {
        updateFields.push(`status = $${paramIndex++}`);
        updateValues.push(status);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Güncellenecek alan bulunamadı'
      });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(id);

    const result = await pool.query(
      `UPDATE organizations SET ${updateFields.join(', ')} 
       WHERE id = $${paramIndex} RETURNING *`,
      updateValues
    );

    res.json({
      success: true,
      message: 'Organizasyon başarıyla güncellendi',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Organizasyon güncellenirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Organizasyon güncellenirken bir hata oluştu'
    });
  }
});

// ============================================
// DELETE /api/organizations/:id - Organizasyon sil
// Sadece Super Admin
// ============================================
router.delete('/:id', requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // System-admin organizasyonu silinemez
    const orgCheck = await pool.query('SELECT slug FROM organizations WHERE id = $1', [id]);
    if (orgCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Organizasyon bulunamadı'
      });
    }

    if (orgCheck.rows[0].slug === 'system-admin') {
      return res.status(403).json({
        success: false,
        message: 'Sistem organizasyonu silinemez'
      });
    }

    await pool.query('DELETE FROM organizations WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Organizasyon başarıyla silindi'
    });
  } catch (error) {
    console.error('Organizasyon silinirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Organizasyon silinirken bir hata oluştu'
    });
  }
});

// ============================================
// GET /api/organizations/:id/limits - Organizasyon limitleri
// Super Admin veya kendi organizasyonu
// ============================================
router.get('/:id/limits', async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // Yetki kontrolü
    if (user.role !== 'super_admin' && user.organizationId !== parseInt(id)) {
      return res.status(403).json({
        success: false,
        message: 'Bu limitleri görüntüleme yetkiniz yok'
      });
    }

    // Organizasyon limitleri
    const orgResult = await pool.query(
      `SELECT 
        id, name, plan, max_users, max_contacts, max_emails_per_month
      FROM organizations WHERE id = $1`,
      [id]
    );

    if (orgResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Organizasyon bulunamadı'
      });
    }

    const org = orgResult.rows[0];

    // Mevcut kullanım
    const usageResult = await pool.query(
      `SELECT 
        (SELECT COUNT(*) FROM users WHERE organization_id = $1) as current_users,
        (SELECT COUNT(*) FROM contacts WHERE user_id IN (SELECT id FROM users WHERE organization_id = $1)) as current_contacts,
        (SELECT COUNT(*) FROM email_campaigns WHERE user_id IN (SELECT id FROM users WHERE organization_id = $1) 
         AND created_at >= date_trunc('month', CURRENT_DATE)) as emails_this_month`,
      [id]
    );

    const usage = usageResult.rows[0];

    res.json({
      success: true,
      data: {
        organization: org.name,
        plan: org.plan,
        limits: {
          max_users: org.max_users,
          max_contacts: org.max_contacts,
          max_emails_per_month: org.max_emails_per_month
        },
        usage: {
          current_users: parseInt(usage.current_users),
          current_contacts: parseInt(usage.current_contacts),
          emails_this_month: parseInt(usage.emails_this_month)
        },
        remaining: {
          users: org.max_users - parseInt(usage.current_users),
          contacts: org.max_contacts - parseInt(usage.current_contacts),
          emails: org.max_emails_per_month - parseInt(usage.emails_this_month)
        }
      }
    });
  } catch (error) {
    console.error('Limitler alınırken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Limitler alınırken bir hata oluştu'
    });
  }
});

// ============================================
// GET /api/organizations/:id/users - Organizasyondaki kullanıcılar
// Super Admin veya kendi organizasyonu
// ============================================
router.get('/:id/users', async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // Yetki kontrolü
    if (user.role !== 'super_admin' && user.organizationId !== parseInt(id)) {
      return res.status(403).json({
        success: false,
        message: 'Bu kullanıcıları görüntüleme yetkiniz yok'
      });
    }

    const result = await pool.query(
      `SELECT 
        id, email, first_name, last_name, role, status, 
        last_login_at, created_at
      FROM users 
      WHERE organization_id = $1
      ORDER BY created_at DESC`,
      [id]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Kullanıcılar alınırken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Kullanıcılar alınırken bir hata oluştu'
    });
  }
});

module.exports = router;

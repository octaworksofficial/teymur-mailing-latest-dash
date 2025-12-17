/**
 * Users Management API Routes
 * Kullanıcı yönetimi
 * - Super Admin: Tüm kullanıcıları yönetebilir
 * - Org Admin: Kendi organizasyonundaki kullanıcıları yönetebilir
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { pool } = require('../db');
const { authMiddleware, requireSuperAdmin } = require('../middleware/auth');

// Tüm routes için authentication zorunlu
router.use(authMiddleware);

// ============================================
// GET /api/users - Kullanıcıları listele
// Super Admin: Tüm kullanıcılar
// Org Admin: Kendi organizasyonundaki kullanıcılar
// ============================================
router.get('/', async (req, res) => {
  try {
    const user = req.user;
    const { page = 1, pageSize = 10, search, status, role, organization_id } = req.query;
    const offset = (page - 1) * pageSize;

    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    // Super admin değilse sadece kendi organizasyonunu görebilir
    if (user.role !== 'super_admin') {
      whereConditions.push(`u.organization_id = $${paramIndex}`);
      params.push(user.organizationId);
      paramIndex++;
    } else if (organization_id) {
      // Super admin belirli bir organizasyonu filtreleyebilir
      whereConditions.push(`u.organization_id = $${paramIndex}`);
      params.push(organization_id);
      paramIndex++;
    }

    if (search) {
      whereConditions.push(`(u.email ILIKE $${paramIndex} OR u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (status) {
      whereConditions.push(`u.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (role) {
      whereConditions.push(`u.role = $${paramIndex}`);
      params.push(role);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Toplam sayı
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM users u ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Kullanıcılar
    const result = await pool.query(
      `SELECT 
        u.id, u.email, u.first_name, u.last_name, u.phone, u.avatar_url,
        u.role, u.status, u.is_verified, u.last_login_at, u.last_activity_at,
        u.login_count, u.created_at, u.organization_id,
        o.name as organization_name, o.slug as organization_slug
      FROM users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      ${whereClause}
      ORDER BY u.created_at DESC
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
    console.error('Kullanıcılar listelenirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Kullanıcılar listelenirken bir hata oluştu'
    });
  }
});

// ============================================
// GET /api/users/:id - Tek kullanıcı detayı
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const result = await pool.query(
      `SELECT 
        u.id, u.email, u.first_name, u.last_name, u.phone, u.avatar_url,
        u.role, u.status, u.is_verified, u.last_login_at, u.last_activity_at,
        u.login_count, u.created_at, u.organization_id, u.permissions,
        o.name as organization_name, o.slug as organization_slug
      FROM users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      WHERE u.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    const targetUser = result.rows[0];

    // Yetki kontrolü
    const isSuperAdmin = currentUser.role === 'super_admin';
    const isSameOrg = currentUser.organizationId === targetUser.organization_id;
    const isOrgAdmin = currentUser.role === 'org_admin';

    if (!isSuperAdmin && !(isOrgAdmin && isSameOrg) && currentUser.id !== parseInt(id)) {
      return res.status(403).json({
        success: false,
        message: 'Bu kullanıcıyı görüntüleme yetkiniz yok'
      });
    }

    res.json({
      success: true,
      data: targetUser
    });
  } catch (error) {
    console.error('Kullanıcı detayı alınırken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Kullanıcı detayı alınırken bir hata oluştu'
    });
  }
});

// ============================================
// POST /api/users - Yeni kullanıcı oluştur
// Super Admin: Herhangi bir organizasyona ekleyebilir
// Org Admin: Kendi organizasyonuna ekleyebilir (limit dahilinde)
// ============================================
router.post('/', async (req, res) => {
  try {
    const currentUser = req.user;
    
    // currentUser kontrolü
    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'Oturum açmanız gerekiyor'
      });
    }
    
    const {
      email,
      password,
      first_name,
      last_name,
      phone,
      role = 'user',
      organization_id,
      status = 'active'
    } = req.body;

    // Zorunlu alanlar
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email ve şifre zorunludur'
      });
    }

    // Organizasyon belirleme
    let targetOrgId = organization_id;
    
    if (currentUser.role === 'super_admin') {
      // Super admin istediği organizasyona ekleyebilir
      if (!targetOrgId) {
        return res.status(400).json({
          success: false,
          message: 'Organizasyon seçilmelidir'
        });
      }
    } else if (currentUser.role === 'org_admin') {
      // Org admin sadece kendi organizasyonuna ekleyebilir
      targetOrgId = currentUser.organizationId;
      
      // Super admin veya org_admin rolü atayamaz
      if (role === 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Super admin rolü atama yetkiniz yok'
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'Kullanıcı oluşturma yetkiniz yok'
      });
    }

    // Limit kontrolü
    const limitCheck = await pool.query(
      `SELECT 
        o.max_users,
        (SELECT COUNT(*) FROM users WHERE organization_id = o.id) as current_users
      FROM organizations o WHERE o.id = $1`,
      [targetOrgId]
    );

    if (limitCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Organizasyon bulunamadı'
      });
    }

    const { max_users, current_users } = limitCheck.rows[0];
    if (parseInt(current_users) >= max_users) {
      return res.status(400).json({
        success: false,
        message: `Kullanıcı limiti doldu (${max_users}/${max_users}). Limit artışı için yöneticinize başvurun.`
      });
    }

    // Email benzersizliğini kontrol et
    const emailCheck = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Bu email zaten kullanılıyor'
      });
    }

    // Şifreyi hashle
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await pool.query(
      `INSERT INTO users (
        email, password_hash, first_name, last_name, phone, 
        role, organization_id, status, is_verified
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
      RETURNING id, email, first_name, last_name, phone, role, organization_id, status, created_at`,
      [email, passwordHash, first_name, last_name, phone, role, targetOrgId, status]
    );

    res.status(201).json({
      success: true,
      message: 'Kullanıcı başarıyla oluşturuldu',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Kullanıcı oluşturulurken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Kullanıcı oluşturulurken bir hata oluştu'
    });
  }
});

// ============================================
// PUT /api/users/:id - Kullanıcı güncelle
// ============================================
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    const {
      email,
      first_name,
      last_name,
      phone,
      role,
      status,
      organization_id
    } = req.body;

    // Hedef kullanıcıyı bul
    const userCheck = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    const targetUser = userCheck.rows[0];

    // Yetki kontrolü
    const isSuperAdmin = currentUser.role === 'super_admin';
    const isOrgAdmin = currentUser.role === 'org_admin';
    const isSameOrg = currentUser.organizationId === targetUser.organization_id;

    if (!isSuperAdmin && !(isOrgAdmin && isSameOrg)) {
      return res.status(403).json({
        success: false,
        message: 'Bu kullanıcıyı düzenleme yetkiniz yok'
      });
    }

    // Org admin kısıtlamaları
    if (isOrgAdmin && !isSuperAdmin) {
      // Org admin super_admin veya org_admin rolü atayamaz
      if (role === 'super_admin' || (role === 'org_admin' && targetUser.role !== 'org_admin')) {
        return res.status(403).json({
          success: false,
          message: 'Bu rolü atama yetkiniz yok'
        });
      }
      // Org admin organizasyon değiştiremez
      if (organization_id && organization_id !== currentUser.organizationId) {
        return res.status(403).json({
          success: false,
          message: 'Kullanıcıyı başka organizasyona taşıyamazsınız'
        });
      }
    }

    // Dinamik update sorgusu oluştur
    let updateFields = [];
    let updateValues = [];
    let paramIndex = 1;

    if (email !== undefined) {
      // Email benzersizliğini kontrol et
      const emailCheck = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, id]
      );
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Bu email zaten kullanılıyor'
        });
      }
      updateFields.push(`email = $${paramIndex++}`);
      updateValues.push(email);
    }

    if (first_name !== undefined) {
      updateFields.push(`first_name = $${paramIndex++}`);
      updateValues.push(first_name);
    }
    if (last_name !== undefined) {
      updateFields.push(`last_name = $${paramIndex++}`);
      updateValues.push(last_name);
    }
    if (phone !== undefined) {
      updateFields.push(`phone = $${paramIndex++}`);
      updateValues.push(phone);
    }
    if (role !== undefined && isSuperAdmin) {
      updateFields.push(`role = $${paramIndex++}`);
      updateValues.push(role);
    } else if (role !== undefined && isOrgAdmin && role === 'user') {
      updateFields.push(`role = $${paramIndex++}`);
      updateValues.push(role);
    }
    if (status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`);
      updateValues.push(status);
    }
    if (organization_id !== undefined && isSuperAdmin) {
      updateFields.push(`organization_id = $${paramIndex++}`);
      updateValues.push(organization_id);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Güncellenecek alan bulunamadı'
      });
    }

    updateValues.push(id);

    const result = await pool.query(
      `UPDATE users SET ${updateFields.join(', ')} 
       WHERE id = $${paramIndex}
       RETURNING id, email, first_name, last_name, phone, role, organization_id, status`,
      updateValues
    );

    res.json({
      success: true,
      message: 'Kullanıcı başarıyla güncellendi',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Kullanıcı güncellenirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Kullanıcı güncellenirken bir hata oluştu'
    });
  }
});

// ============================================
// PUT /api/users/:id/password - Şifre güncelle
// Super Admin: Herkesin şifresini değiştirebilir
// Org Admin: Kendi organizasyonundaki kullanıcıların şifresini değiştirebilir
// ============================================
router.put('/:id/password', async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    const { password, show_password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Şifre en az 6 karakter olmalıdır'
      });
    }

    // Hedef kullanıcıyı bul
    const userCheck = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    const targetUser = userCheck.rows[0];

    // Yetki kontrolü
    const isSuperAdmin = currentUser.role === 'super_admin';
    const isOrgAdmin = currentUser.role === 'org_admin';
    const isSameOrg = currentUser.organizationId === targetUser.organization_id;

    if (!isSuperAdmin && !(isOrgAdmin && isSameOrg)) {
      return res.status(403).json({
        success: false,
        message: 'Bu kullanıcının şifresini değiştirme yetkiniz yok'
      });
    }

    // Org admin, super_admin veya başka org_admin'in şifresini değiştiremez
    if (isOrgAdmin && !isSuperAdmin) {
      if (targetUser.role === 'super_admin' || targetUser.role === 'org_admin') {
        return res.status(403).json({
          success: false,
          message: 'Bu kullanıcının şifresini değiştirme yetkiniz yok'
        });
      }
    }

    // Şifreyi hashle
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, id]
    );

    const response = {
      success: true,
      message: 'Şifre başarıyla güncellendi'
    };

    // Org admin isterse plain text şifreyi görebilir
    if (show_password && (isOrgAdmin || isSuperAdmin)) {
      response.password = password;
    }

    res.json(response);
  } catch (error) {
    console.error('Şifre güncellenirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Şifre güncellenirken bir hata oluştu'
    });
  }
});

// ============================================
// DELETE /api/users/:id - Kullanıcı sil
// ============================================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    // Kendini silmeye çalışıyor mu?
    if (currentUser.id === parseInt(id)) {
      return res.status(400).json({
        success: false,
        message: 'Kendinizi silemezsiniz'
      });
    }

    // Hedef kullanıcıyı bul
    const userCheck = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    const targetUser = userCheck.rows[0];

    // Yetki kontrolü
    const isSuperAdmin = currentUser.role === 'super_admin';
    const isOrgAdmin = currentUser.role === 'org_admin';
    const isSameOrg = currentUser.organizationId === targetUser.organization_id;

    if (!isSuperAdmin && !(isOrgAdmin && isSameOrg)) {
      return res.status(403).json({
        success: false,
        message: 'Bu kullanıcıyı silme yetkiniz yok'
      });
    }

    // Org admin, super_admin veya başka org_admin'i silemez
    if (isOrgAdmin && !isSuperAdmin) {
      if (targetUser.role === 'super_admin' || targetUser.role === 'org_admin') {
        return res.status(403).json({
          success: false,
          message: 'Bu kullanıcıyı silme yetkiniz yok'
        });
      }
    }

    // Super admin son super admin ise silinmemeli
    if (targetUser.role === 'super_admin') {
      const superAdminCount = await pool.query(
        "SELECT COUNT(*) FROM users WHERE role = 'super_admin'"
      );
      if (parseInt(superAdminCount.rows[0].count) <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Son super admin silinemez'
        });
      }
    }

    await pool.query('DELETE FROM users WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Kullanıcı başarıyla silindi'
    });
  } catch (error) {
    console.error('Kullanıcı silinirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Kullanıcı silinirken bir hata oluştu'
    });
  }
});

module.exports = router;

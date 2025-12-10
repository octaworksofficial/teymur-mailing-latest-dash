/**
 * Auth Routes
 * Hem eski Ant Design Pro uyumluluğu hem de yeni JWT tabanlı auth
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { pool } = require('../db');
const {
  generateTokens,
  verifyToken,
  authMiddleware,
  optionalAuthMiddleware,
  requireSuperAdmin,
  requireAdmin,
} = require('../middleware/auth');

const SALT_ROUNDS = 10;

// =====================================================
// YENİ JWT TABANLI AUTH ENDPOINTS
// =====================================================

/**
 * POST /api/auth/login
 * Yeni JWT tabanlı login
 */
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email ve şifre gereklidir',
      });
    }

    // Kullanıcıyı bul
    const userResult = await pool.query(
      `SELECT u.*, o.name as organization_name, o.slug as organization_slug, o.status as organization_status
       FROM users u
       LEFT JOIN organizations o ON u.organization_id = o.id
       WHERE u.email = $1`,
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Geçersiz email veya şifre',
      });
    }

    const user = userResult.rows[0];

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'Hesabınız devre dışı bırakılmış',
      });
    }

    if (user.role !== 'super_admin' && user.organization_status !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'Organizasyonunuz askıya alınmış',
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Geçersiz email veya şifre',
      });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    // Refresh token'ı kaydet
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at, user_agent, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, refreshToken, expiresAt, req.headers['user-agent'] || null, req.ip]
    );

    await pool.query(
      `UPDATE users SET last_login_at = CURRENT_TIMESTAMP, login_count = login_count + 1 WHERE id = $1`,
      [user.id]
    );

    console.log(`✅ User logged in: ${user.email}`);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
          role: user.role,
          avatar: user.avatar_url,
          organizationId: user.organization_id,
          organizationName: user.organization_name,
          permissions: user.permissions || [],
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Auth login error:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
});

/**
 * POST /api/auth/register
 * Yeni kullanıcı kaydı
 */
router.post('/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, organizationName } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email ve şifre gereklidir',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Şifre en az 6 karakter olmalıdır',
      });
    }

    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Bu email adresi zaten kullanılıyor',
      });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    let organizationId = null;

    if (organizationName) {
      const slug = organizationName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      const existingOrg = await pool.query('SELECT id FROM organizations WHERE slug = $1', [slug]);

      if (existingOrg.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Bu organizasyon adı zaten kullanılıyor',
        });
      }

      const orgResult = await pool.query(
        `INSERT INTO organizations (name, slug, status) VALUES ($1, $2, 'active') RETURNING id`,
        [organizationName, slug]
      );

      organizationId = orgResult.rows[0].id;
    }

    const userResult = await pool.query(
      `INSERT INTO users (organization_id, email, password_hash, first_name, last_name, phone, role, status, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', true)
       RETURNING id, email, first_name, last_name, role, organization_id`,
      [organizationId, email.toLowerCase(), passwordHash, firstName, lastName, phone, organizationId ? 'org_admin' : 'user']
    );

    const newUser = userResult.rows[0];
    const { accessToken, refreshToken } = generateTokens(newUser);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
      [newUser.id, refreshToken, expiresAt]
    );

    console.log(`✅ New user registered: ${newUser.email}`);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          role: newUser.role,
          organizationId: newUser.organization_id,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
});

/**
 * POST /api/auth/refresh
 * Token yenileme
 */
router.post('/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ success: false, error: 'Refresh token gereklidir' });
    }

    const decoded = verifyToken(refreshToken);

    if (!decoded || decoded.type !== 'refresh') {
      return res.status(401).json({ success: false, error: 'Geçersiz refresh token' });
    }

    const tokenResult = await pool.query(
      `SELECT * FROM refresh_tokens WHERE token = $1 AND user_id = $2 AND is_revoked = false AND expires_at > NOW()`,
      [refreshToken, decoded.userId]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Refresh token geçersiz veya süresi dolmuş' });
    }

    const userResult = await pool.query(
      `SELECT u.*, o.name as organization_name FROM users u
       LEFT JOIN organizations o ON u.organization_id = o.id
       WHERE u.id = $1 AND u.status = 'active'`,
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Kullanıcı bulunamadı' });
    }

    const user = userResult.rows[0];

    await pool.query(`UPDATE refresh_tokens SET is_revoked = true, revoked_at = NOW() WHERE token = $1`, [refreshToken]);

    const newTokens = generateTokens(user);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at, user_agent, ip_address) VALUES ($1, $2, $3, $4, $5)`,
      [user.id, newTokens.refreshToken, expiresAt, req.headers['user-agent'] || null, req.ip]
    );

    res.json({
      success: true,
      data: { accessToken: newTokens.accessToken, refreshToken: newTokens.refreshToken },
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
});

/**
 * POST /api/auth/logout
 * Çıkış
 */
router.post('/auth/logout', authMiddleware, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await pool.query(
        `UPDATE refresh_tokens SET is_revoked = true, revoked_at = NOW() WHERE token = $1 AND user_id = $2`,
        [refreshToken, req.user.id]
      );
    }

    console.log(`✅ User logged out: ${req.user.email}`);

    res.json({ success: true, message: 'Başarıyla çıkış yapıldı' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
});

/**
 * GET /api/auth/me
 * Mevcut kullanıcı bilgileri
 */
router.get('/auth/me', authMiddleware, async (req, res) => {
  try {
    const userResult = await pool.query(
      `SELECT u.*, o.name as organization_name, o.slug as organization_slug, o.logo_url as organization_logo, o.plan as organization_plan
       FROM users u
       LEFT JOIN organizations o ON u.organization_id = o.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Kullanıcı bulunamadı' });
    }

    const user = userResult.rows[0];

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
        phone: user.phone,
        avatar: user.avatar_url,
        role: user.role,
        permissions: user.permissions || [],
        preferences: user.preferences || {},
        organization: user.organization_id ? {
          id: user.organization_id,
          name: user.organization_name,
          slug: user.organization_slug,
          logo: user.organization_logo,
          plan: user.organization_plan,
        } : null,
        lastLoginAt: user.last_login_at,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
});

/**
 * PUT /api/auth/me
 * Profil güncelleme
 */
router.put('/auth/me', authMiddleware, async (req, res) => {
  try {
    const { firstName, lastName, phone, avatar, preferences } = req.body;

    const userResult = await pool.query(
      `UPDATE users 
       SET first_name = COALESCE($1, first_name), last_name = COALESCE($2, last_name),
           phone = COALESCE($3, phone), avatar_url = COALESCE($4, avatar_url),
           preferences = COALESCE($5, preferences), updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING id, email, first_name, last_name, phone, avatar_url, role, preferences`,
      [firstName, lastName, phone, avatar, preferences ? JSON.stringify(preferences) : null, req.user.id]
    );

    const user = userResult.rows[0];

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        avatar: user.avatar_url,
        role: user.role,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
});

/**
 * PUT /api/auth/password
 * Şifre değiştirme
 */
router.put('/auth/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Mevcut şifre ve yeni şifre gereklidir' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'Yeni şifre en az 6 karakter olmalıdır' });
    }

    const userResult = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const isValidPassword = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);

    if (!isValidPassword) {
      return res.status(400).json({ success: false, error: 'Mevcut şifre yanlış' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await pool.query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newPasswordHash, req.user.id]);
    await pool.query(`UPDATE refresh_tokens SET is_revoked = true, revoked_at = NOW() WHERE user_id = $1 AND is_revoked = false`, [req.user.id]);

    res.json({ success: true, message: 'Şifreniz başarıyla değiştirildi. Lütfen tekrar giriş yapın.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
});

// =====================================================
// ADMIN ENDPOINTS - Kullanıcı Yönetimi
// =====================================================

/**
 * GET /api/auth/users
 * Kullanıcı listesi
 */
router.get('/auth/users', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, search, role, status, organizationId } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = '1=1';
    const params = [];
    let paramIndex = 1;

    if (req.user.role !== 'super_admin') {
      whereClause += ` AND u.organization_id = $${paramIndex}`;
      params.push(req.user.organizationId);
      paramIndex++;
    } else if (organizationId) {
      whereClause += ` AND u.organization_id = $${paramIndex}`;
      params.push(organizationId);
      paramIndex++;
    }

    if (search) {
      whereClause += ` AND (u.email ILIKE $${paramIndex} OR u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (role) {
      whereClause += ` AND u.role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }

    if (status) {
      whereClause += ` AND u.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    const countResult = await pool.query(`SELECT COUNT(*) FROM users u WHERE ${whereClause}`, params);

    const usersResult = await pool.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.avatar_url, u.role, u.status, u.last_login_at, u.created_at,
              o.name as organization_name, o.slug as organization_slug
       FROM users u
       LEFT JOIN organizations o ON u.organization_id = o.id
       WHERE ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, pageSize, offset]
    );

    res.json({
      success: true,
      data: usersResult.rows.map(u => ({
        id: u.id, email: u.email, firstName: u.first_name, lastName: u.last_name,
        phone: u.phone, avatar: u.avatar_url, role: u.role, status: u.status,
        organizationName: u.organization_name, lastLoginAt: u.last_login_at, createdAt: u.created_at,
      })),
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
});

/**
 * POST /api/auth/users
 * Yeni kullanıcı oluşturma (Admin)
 */
router.post('/auth/users', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, role, organizationId } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email ve şifre gereklidir' });
    }

    let targetOrgId = organizationId;
    if (req.user.role !== 'super_admin') {
      targetOrgId = req.user.organizationId;
    }

    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Bu email adresi zaten kullanılıyor' });
    }

    let userRole = role || 'user';
    if (userRole === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, error: 'Super admin oluşturamazsınız' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const userResult = await pool.query(
      `INSERT INTO users (organization_id, email, password_hash, first_name, last_name, phone, role, status, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', true)
       RETURNING id, email, first_name, last_name, role, organization_id`,
      [targetOrgId, email.toLowerCase(), passwordHash, firstName, lastName, phone, userRole]
    );

    res.status(201).json({ success: true, data: userResult.rows[0] });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
});

/**
 * PUT /api/auth/users/:id
 * Kullanıcı güncelleme
 */
router.put('/auth/users/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone, role, status, organizationId } = req.body;

    const existingUser = await pool.query('SELECT * FROM users WHERE id = $1', [id]);

    if (existingUser.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Kullanıcı bulunamadı' });
    }

    if (req.user.role !== 'super_admin' && existingUser.rows[0].organization_id !== req.user.organizationId) {
      return res.status(403).json({ success: false, error: 'Bu kullanıcıyı düzenleme yetkiniz yok' });
    }

    let updateOrgId = organizationId;
    if (req.user.role !== 'super_admin') {
      updateOrgId = undefined;
    }

    const userResult = await pool.query(
      `UPDATE users 
       SET first_name = COALESCE($1, first_name), last_name = COALESCE($2, last_name),
           phone = COALESCE($3, phone), role = COALESCE($4, role), status = COALESCE($5, status),
           organization_id = COALESCE($6, organization_id), updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING id, email, first_name, last_name, role, status, organization_id`,
      [firstName, lastName, phone, role, status, updateOrgId, id]
    );

    res.json({ success: true, data: userResult.rows[0] });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
});

/**
 * DELETE /api/auth/users/:id
 * Kullanıcı silme
 */
router.delete('/auth/users/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.id === parseInt(id)) {
      return res.status(400).json({ success: false, error: 'Kendinizi silemezsiniz' });
    }

    const existingUser = await pool.query('SELECT * FROM users WHERE id = $1', [id]);

    if (existingUser.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Kullanıcı bulunamadı' });
    }

    if (req.user.role !== 'super_admin' && existingUser.rows[0].organization_id !== req.user.organizationId) {
      return res.status(403).json({ success: false, error: 'Bu kullanıcıyı silme yetkiniz yok' });
    }

    if (existingUser.rows[0].role === 'super_admin') {
      return res.status(403).json({ success: false, error: 'Super admin silinemez' });
    }

    await pool.query('DELETE FROM users WHERE id = $1', [id]);

    res.json({ success: true, message: 'Kullanıcı silindi' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
});

// =====================================================
// SUPER ADMIN - Organizasyon Yönetimi
// =====================================================

/**
 * GET /api/auth/organizations
 */
router.get('/auth/organizations', authMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, search, status } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = '1=1';
    const params = [];
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND (name ILIKE $${paramIndex} OR slug ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (status) {
      whereClause += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    const countResult = await pool.query(`SELECT COUNT(*) FROM organizations WHERE ${whereClause}`, params);

    const orgsResult = await pool.query(
      `SELECT o.*, 
              (SELECT COUNT(*) FROM users WHERE organization_id = o.id) as user_count,
              (SELECT COUNT(*) FROM contacts WHERE organization_id = o.id) as contact_count
       FROM organizations o
       WHERE ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, pageSize, offset]
    );

    res.json({
      success: true,
      data: orgsResult.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    });
  } catch (error) {
    console.error('Get organizations error:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
});

/**
 * POST /api/auth/organizations
 */
router.post('/auth/organizations', authMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const { name, slug, description, email, phone, website, plan, maxUsers, maxContacts, maxEmailsPerMonth } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ success: false, error: 'Organizasyon adı ve slug gereklidir' });
    }

    const existingOrg = await pool.query('SELECT id FROM organizations WHERE slug = $1', [slug]);

    if (existingOrg.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Bu slug zaten kullanılıyor' });
    }

    const orgResult = await pool.query(
      `INSERT INTO organizations (name, slug, description, email, phone, website, plan, max_users, max_contacts, max_emails_per_month, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active')
       RETURNING *`,
      [name, slug, description, email, phone, website, plan || 'free', maxUsers || 5, maxContacts || 1000, maxEmailsPerMonth || 5000]
    );

    res.status(201).json({ success: true, data: orgResult.rows[0] });
  } catch (error) {
    console.error('Create organization error:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
});

/**
 * PUT /api/auth/organizations/:id
 */
router.put('/auth/organizations/:id', authMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, email, phone, website, plan, status, maxUsers, maxContacts, maxEmailsPerMonth } = req.body;

    const orgResult = await pool.query(
      `UPDATE organizations 
       SET name = COALESCE($1, name), description = COALESCE($2, description), email = COALESCE($3, email),
           phone = COALESCE($4, phone), website = COALESCE($5, website), plan = COALESCE($6, plan),
           status = COALESCE($7, status), max_users = COALESCE($8, max_users), max_contacts = COALESCE($9, max_contacts),
           max_emails_per_month = COALESCE($10, max_emails_per_month), updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING *`,
      [name, description, email, phone, website, plan, status, maxUsers, maxContacts, maxEmailsPerMonth, id]
    );

    if (orgResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Organizasyon bulunamadı' });
    }

    res.json({ success: true, data: orgResult.rows[0] });
  } catch (error) {
    console.error('Update organization error:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
});

/**
 * DELETE /api/auth/organizations/:id
 */
router.delete('/auth/organizations/:id', authMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const org = await pool.query('SELECT slug FROM organizations WHERE id = $1', [id]);

    if (org.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Organizasyon bulunamadı' });
    }

    if (org.rows[0].slug === 'system-admin') {
      return res.status(403).json({ success: false, error: 'System Admin organizasyonu silinemez' });
    }

    await pool.query('DELETE FROM organizations WHERE id = $1', [id]);

    res.json({ success: true, message: 'Organizasyon silindi' });
  } catch (error) {
    console.error('Delete organization error:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
});

// =====================================================
// ESKİ ANT DESIGN PRO UYUMLU ENDPOINTS
// (Geriye dönük uyumluluk için korunuyor)
// =====================================================

/**
 * POST /api/login/account
 * Eski Ant Design Pro login endpoint'i
 */
router.post('/login/account', async (req, res) => {
  const { password, username, type } = req.body;

  try {
    // Önce yeni users tablosunda ara
    const userResult = await pool.query(
      `SELECT u.*, o.name as organization_name FROM users u
       LEFT JOIN organizations o ON u.organization_id = o.id
       WHERE u.email = $1 AND u.status = 'active'`,
      [username.toLowerCase()]
    );

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (isValidPassword) {
        const { accessToken, refreshToken } = generateTokens(user);

        // Login güncelle
        await pool.query(
          `UPDATE users SET last_login_at = CURRENT_TIMESTAMP, login_count = login_count + 1 WHERE id = $1`,
          [user.id]
        );

        return res.json({
          status: 'ok',
          type,
          currentAuthority: user.role === 'super_admin' ? 'admin' : user.role === 'org_admin' ? 'admin' : 'user',
          success: true,
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            email: user.email,
            name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
            role: user.role,
            organizationId: user.organization_id,
            organizationName: user.organization_name,
          },
        });
      }
    }

    // Eski mock login (geliştirme için)
    if (process.env.NODE_ENV !== 'production') {
      if (password === 'admin' && username === 'admin') {
        return res.json({
          status: 'ok',
          type,
          currentAuthority: 'admin',
          success: true,
        });
      }

      if (password === 'ant.design' && username === 'user') {
        return res.json({
          status: 'ok',
          type,
          currentAuthority: 'user',
          success: true,
        });
      }
    }

    return res.json({
      status: 'error',
      type,
      currentAuthority: 'guest',
      success: false,
      errorMessage: 'Kullanıcı adı veya şifre hatalı',
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, errorMessage: 'Sunucu hatası' });
  }
});

/**
 * POST /api/login/outLogin
 * Eski Ant Design Pro logout endpoint'i
 */
router.post('/login/outLogin', async (req, res) => {
  try {
    res.json({ data: {}, success: true });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, errorMessage: 'Sunucu hatası' });
  }
});

/**
 * GET /api/currentUser
 * Eski Ant Design Pro current user endpoint'i
 */
router.get('/currentUser', optionalAuthMiddleware, async (req, res) => {
  try {
    // Eğer JWT ile giriş yapılmışsa
    if (req.user) {
      const userResult = await pool.query(
        `SELECT u.*, o.name as organization_name FROM users u
         LEFT JOIN organizations o ON u.organization_id = o.id
         WHERE u.id = $1`,
        [req.user.id]
      );

      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        return res.json({
          success: true,
          data: {
            name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
            avatar: user.avatar_url || 'https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png',
            userid: user.id.toString(),
            email: user.email,
            signature: user.organization_name || 'Teymur Mailing System',
            title: user.role === 'super_admin' ? 'Super Admin' : user.role === 'org_admin' ? 'Organizasyon Admin' : 'Kullanıcı',
            group: user.organization_name || 'Teymur',
            tags: [{ key: '0', label: user.role }],
            notifyCount: 0,
            unreadCount: 0,
            country: 'Turkey',
            access: user.role === 'super_admin' || user.role === 'org_admin' ? 'admin' : 'user',
            geographic: { province: { label: 'Istanbul', key: '34' }, city: { label: 'Istanbul', key: '34' } },
            address: 'Istanbul',
            phone: user.phone || '',
            // Yeni alanlar
            id: user.id,
            role: user.role,
            organizationId: user.organization_id,
            organizationName: user.organization_name,
          },
        });
      }
    }

    // Eski mock response (geliştirme için)
    if (process.env.NODE_ENV !== 'production') {
      return res.json({
        success: true,
        data: {
          name: 'Admin',
          avatar: 'https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png',
          userid: '00000001',
          email: 'admin@teymur.com',
          signature: 'Teymur Mailing System',
          title: 'System Administrator',
          group: 'Teymur Admin',
          tags: [{ key: '0', label: 'Admin' }],
          notifyCount: 0,
          unreadCount: 0,
          country: 'Turkey',
          access: 'admin',
          geographic: { province: { label: 'Istanbul', key: '34' }, city: { label: 'Istanbul', key: '34' } },
          address: 'Istanbul',
          phone: '0555-555-5555',
        },
      });
    }

    return res.status(401).json({ success: false, error: 'Unauthorized' });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ success: false, errorMessage: 'Sunucu hatası' });
  }
});

/**
 * GET /api/login/captcha
 * Eski Ant Design Pro captcha endpoint'i
 */
router.get('/login/captcha', async (req, res) => {
  try {
    res.json({ success: true, data: 'captcha-xxx' });
  } catch (error) {
    console.error('Get captcha error:', error);
    res.status(500).json({ success: false, errorMessage: 'Sunucu hatası' });
  }
});

module.exports = router;

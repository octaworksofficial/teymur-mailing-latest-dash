/**
 * Auth Middleware
 * JWT token doğrulama ve kullanıcı context yönetimi
 */

const jwt = require('jsonwebtoken');
const pool = require('../db');

// JWT Secret - .env'den alınacak, yoksa rastgele bir default
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Token oluştur
 */
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organization_id,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    {
      userId: user.id,
      type: 'refresh',
    },
    JWT_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );

  return { accessToken, refreshToken };
};

/**
 * Token'ı doğrula
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Auth Middleware - Token doğrulama
 * Request header'dan Bearer token alır ve doğrular
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Authorization header'ı kontrol et
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Yetkilendirme token\'ı bulunamadı',
        code: 'NO_TOKEN',
      });
    }

    // Token'ı al
    const token = authHeader.split(' ')[1];
    
    // Token'ı doğrula
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Geçersiz veya süresi dolmuş token',
        code: 'INVALID_TOKEN',
      });
    }

    // Kullanıcıyı veritabanından al
    const userResult = await pool.query(
      `SELECT u.*, o.name as organization_name, o.slug as organization_slug, o.status as organization_status
       FROM users u
       LEFT JOIN organizations o ON u.organization_id = o.id
       WHERE u.id = $1 AND u.status = 'active'`,
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Kullanıcı bulunamadı veya deaktif edilmiş',
        code: 'USER_NOT_FOUND',
      });
    }

    const user = userResult.rows[0];

    // Organizasyon kontrolü (super_admin hariç)
    if (user.role !== 'super_admin' && user.organization_status !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'Organizasyonunuz askıya alınmış',
        code: 'ORG_SUSPENDED',
      });
    }

    // Request'e kullanıcı bilgilerini ekle
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      organizationId: user.organization_id,
      organizationName: user.organization_name,
      organizationSlug: user.organization_slug,
      permissions: user.permissions || [],
    };

    // Son aktivite güncelle
    await pool.query(
      'UPDATE users SET last_activity_at = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Sunucu hatası',
      code: 'SERVER_ERROR',
    });
  }
};

/**
 * Optional Auth Middleware - Token varsa doğrula, yoksa devam et
 * Public endpoint'ler için kullanılır
 */
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded) {
      req.user = null;
      return next();
    }

    const userResult = await pool.query(
      `SELECT u.*, o.name as organization_name, o.slug as organization_slug
       FROM users u
       LEFT JOIN organizations o ON u.organization_id = o.id
       WHERE u.id = $1 AND u.status = 'active'`,
      [decoded.userId]
    );

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      req.user = {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        organizationId: user.organization_id,
        organizationName: user.organization_name,
        organizationSlug: user.organization_slug,
        permissions: user.permissions || [],
      };
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    req.user = null;
    next();
  }
};

/**
 * Role Check Middleware
 * Belirli rollere sahip kullanıcıları kontrol eder
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Oturum açmanız gerekiyor',
        code: 'NOT_AUTHENTICATED',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Bu işlem için yetkiniz yok',
        code: 'INSUFFICIENT_ROLE',
      });
    }

    next();
  };
};

/**
 * Super Admin Check Middleware
 */
const requireSuperAdmin = requireRole('super_admin');

/**
 * Admin Check Middleware (org_admin veya super_admin)
 */
const requireAdmin = requireRole('super_admin', 'org_admin');

/**
 * Permission Check Middleware
 * Belirli permission'a sahip kullanıcıları kontrol eder
 */
const requirePermission = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Oturum açmanız gerekiyor',
        code: 'NOT_AUTHENTICATED',
      });
    }

    // Super admin her şeye erişebilir
    if (req.user.role === 'super_admin') {
      return next();
    }

    // Org admin kendi organizasyonunda her şeye erişebilir
    if (req.user.role === 'org_admin') {
      return next();
    }

    // Normal kullanıcılar için permission kontrolü
    const userPermissions = req.user.permissions || [];
    const hasPermission = requiredPermissions.some(p => userPermissions.includes(p));

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: 'Bu işlem için yetkiniz yok',
        code: 'INSUFFICIENT_PERMISSION',
      });
    }

    next();
  };
};

/**
 * Organization Filter Helper
 * Query'ye organizasyon filtresi ekler
 */
const getOrganizationFilter = (user) => {
  if (!user) {
    return { where: '1=0', params: [] }; // Hiçbir şey döndürme
  }

  if (user.role === 'super_admin') {
    return { where: '1=1', params: [] }; // Her şeyi göster
  }

  return {
    where: 'organization_id = $1',
    params: [user.organizationId],
  };
};

/**
 * User Filter Helper
 * Query'ye kullanıcı filtresi ekler
 */
const getUserFilter = (user, includeOrgMembers = false) => {
  if (!user) {
    return { where: '1=0', params: [] };
  }

  if (user.role === 'super_admin') {
    return { where: '1=1', params: [] };
  }

  if (user.role === 'org_admin' && includeOrgMembers) {
    return {
      where: 'organization_id = $1',
      params: [user.organizationId],
    };
  }

  return {
    where: 'user_id = $1',
    params: [user.id],
  };
};

module.exports = {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
  generateTokens,
  verifyToken,
  authMiddleware,
  optionalAuthMiddleware,
  requireRole,
  requireSuperAdmin,
  requireAdmin,
  requirePermission,
  getOrganizationFilter,
  getUserFilter,
};

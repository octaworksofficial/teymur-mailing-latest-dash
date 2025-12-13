/**
 * Limit Check Middleware
 * Organizasyon limitlerini kontrol eder
 */

const { pool } = require('../db');

/**
 * Kişi limiti kontrolü
 * Contact oluşturmadan önce çağrılır
 */
const checkContactLimit = async (req, res, next) => {
  try {
    const user = req.user;
    
    if (!user || !user.organizationId) {
      return res.status(401).json({
        success: false,
        message: 'Kullanıcı bilgisi bulunamadı'
      });
    }

    const result = await pool.query(
      `SELECT 
        o.max_contacts,
        (SELECT COUNT(*) FROM contacts c 
         WHERE c.user_id IN (SELECT id FROM users WHERE organization_id = o.id)
        ) as current_contacts
      FROM organizations o 
      WHERE o.id = $1`,
      [user.organizationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Organizasyon bulunamadı'
      });
    }

    const { max_contacts, current_contacts } = result.rows[0];
    
    if (parseInt(current_contacts) >= max_contacts) {
      return res.status(403).json({
        success: false,
        message: `Kişi limiti doldu (${max_contacts}/${max_contacts}). Limit artışı için yöneticinize başvurun.`,
        code: 'CONTACT_LIMIT_REACHED',
        limit: max_contacts,
        current: parseInt(current_contacts)
      });
    }

    // Kalan limit bilgisini request'e ekle
    req.limits = {
      contacts: {
        max: max_contacts,
        current: parseInt(current_contacts),
        remaining: max_contacts - parseInt(current_contacts)
      }
    };

    next();
  } catch (error) {
    console.error('Limit kontrolünde hata:', error);
    res.status(500).json({
      success: false,
      message: 'Limit kontrolünde bir hata oluştu'
    });
  }
};

/**
 * Toplu kişi ekleme limiti kontrolü
 * Import işlemlerinden önce çağrılır
 */
const checkBulkContactLimit = async (req, res, next) => {
  try {
    const user = req.user;
    const { contacts } = req.body;
    
    if (!user || !user.organizationId) {
      return res.status(401).json({
        success: false,
        message: 'Kullanıcı bilgisi bulunamadı'
      });
    }

    const contactCount = Array.isArray(contacts) ? contacts.length : 0;

    const result = await pool.query(
      `SELECT 
        o.max_contacts,
        (SELECT COUNT(*) FROM contacts c 
         WHERE c.user_id IN (SELECT id FROM users WHERE organization_id = o.id)
        ) as current_contacts
      FROM organizations o 
      WHERE o.id = $1`,
      [user.organizationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Organizasyon bulunamadı'
      });
    }

    const { max_contacts, current_contacts } = result.rows[0];
    const remaining = max_contacts - parseInt(current_contacts);
    
    if (contactCount > remaining) {
      return res.status(403).json({
        success: false,
        message: `Kişi limiti aşılıyor. ${contactCount} kişi eklemek istiyorsunuz, ancak sadece ${remaining} kişilik kapasiteniz var.`,
        code: 'CONTACT_LIMIT_EXCEEDED',
        limit: max_contacts,
        current: parseInt(current_contacts),
        remaining: remaining,
        requested: contactCount
      });
    }

    req.limits = {
      contacts: {
        max: max_contacts,
        current: parseInt(current_contacts),
        remaining: remaining
      }
    };

    next();
  } catch (error) {
    console.error('Toplu limit kontrolünde hata:', error);
    res.status(500).json({
      success: false,
      message: 'Limit kontrolünde bir hata oluştu'
    });
  }
};

/**
 * Email kampanyası limiti kontrolü
 * Kampanya oluşturmadan/göndermeden önce çağrılır
 */
const checkEmailLimit = async (req, res, next) => {
  try {
    const user = req.user;
    const { recipient_count } = req.body;
    
    if (!user || !user.organizationId) {
      return res.status(401).json({
        success: false,
        message: 'Kullanıcı bilgisi bulunamadı'
      });
    }

    const result = await pool.query(
      `SELECT 
        o.max_emails_per_month,
        (SELECT COALESCE(SUM(ec.total_recipients), 0) FROM email_campaigns ec 
         WHERE ec.user_id IN (SELECT id FROM users WHERE organization_id = o.id)
         AND ec.created_at >= date_trunc('month', CURRENT_DATE)
        ) as emails_this_month
      FROM organizations o 
      WHERE o.id = $1`,
      [user.organizationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Organizasyon bulunamadı'
      });
    }

    const { max_emails_per_month, emails_this_month } = result.rows[0];
    const remaining = max_emails_per_month - parseInt(emails_this_month);
    const emailCount = recipient_count || 0;
    
    if (emailCount > remaining) {
      return res.status(403).json({
        success: false,
        message: `Aylık email limiti aşılıyor. ${emailCount} email göndermek istiyorsunuz, ancak bu ay sadece ${remaining} email gönderebilirsiniz.`,
        code: 'EMAIL_LIMIT_EXCEEDED',
        limit: max_emails_per_month,
        current: parseInt(emails_this_month),
        remaining: remaining,
        requested: emailCount
      });
    }

    req.limits = {
      ...req.limits,
      emails: {
        max: max_emails_per_month,
        current: parseInt(emails_this_month),
        remaining: remaining
      }
    };

    next();
  } catch (error) {
    console.error('Email limit kontrolünde hata:', error);
    res.status(500).json({
      success: false,
      message: 'Limit kontrolünde bir hata oluştu'
    });
  }
};

/**
 * Organizasyon limitlerini getir
 * Dashboard ve diğer yerler için kullanılır
 */
const getOrganizationLimits = async (organizationId) => {
  try {
    const result = await pool.query(
      `SELECT 
        o.max_users,
        o.max_contacts,
        o.max_emails_per_month,
        (SELECT COUNT(*) FROM users WHERE organization_id = o.id) as current_users,
        (SELECT COUNT(*) FROM contacts WHERE user_id IN (SELECT id FROM users WHERE organization_id = o.id)) as current_contacts,
        (SELECT COALESCE(SUM(total_recipients), 0) FROM email_campaigns 
         WHERE user_id IN (SELECT id FROM users WHERE organization_id = o.id)
         AND created_at >= date_trunc('month', CURRENT_DATE)) as emails_this_month
      FROM organizations o 
      WHERE o.id = $1`,
      [organizationId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    
    return {
      users: {
        max: row.max_users,
        current: parseInt(row.current_users),
        remaining: row.max_users - parseInt(row.current_users)
      },
      contacts: {
        max: row.max_contacts,
        current: parseInt(row.current_contacts),
        remaining: row.max_contacts - parseInt(row.current_contacts)
      },
      emails: {
        max: row.max_emails_per_month,
        current: parseInt(row.emails_this_month),
        remaining: row.max_emails_per_month - parseInt(row.emails_this_month)
      }
    };
  } catch (error) {
    console.error('Limit bilgisi alınırken hata:', error);
    return null;
  }
};

module.exports = {
  checkContactLimit,
  checkBulkContactLimit,
  checkEmailLimit,
  getOrganizationLimits
};

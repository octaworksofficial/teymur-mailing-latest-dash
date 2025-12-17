const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authMiddleware, requireSuperAdmin } = require('../middleware/auth');

/**
 * GET /api/admin/stats
 * Super admin için sistem geneli istatistikler
 */
router.get('/stats', authMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    // Toplam organizasyon sayısı
    const orgResult = await pool.query(
      'SELECT COUNT(*) as total FROM organizations'
    );
    const totalOrganizations = parseInt(orgResult.rows[0].total);

    // Toplam kullanıcı sayısı
    const userResult = await pool.query(
      'SELECT COUNT(*) as total FROM users'
    );
    const totalUsers = parseInt(userResult.rows[0].total);

    // Aktif kullanıcı sayısı (son 30 günde login olmuş)
    const activeUserResult = await pool.query(
      `SELECT COUNT(DISTINCT user_id) as total 
       FROM users 
       WHERE last_login_at >= NOW() - INTERVAL '30 days'`
    );
    const activeUsers = parseInt(activeUserResult.rows[0].total);

    // Super admin sayısı
    const superAdminResult = await pool.query(
      'SELECT COUNT(*) as total FROM users WHERE is_super_admin = true'
    );
    const totalSuperAdmins = parseInt(superAdminResult.rows[0].total);

    // Org admin sayısı
    const orgAdminResult = await pool.query(
      'SELECT COUNT(*) as total FROM users WHERE is_org_admin = true'
    );
    const totalOrgAdmins = parseInt(orgAdminResult.rows[0].total);

    // Toplam kişi sayısı (contacts)
    const contactResult = await pool.query(
      'SELECT COUNT(*) as total FROM contacts'
    );
    const totalContacts = parseInt(contactResult.rows[0].total);

    // Toplam email şablonu sayısı
    const templateResult = await pool.query(
      'SELECT COUNT(*) as total FROM email_templates'
    );
    const totalTemplates = parseInt(templateResult.rows[0].total);

    // Toplam kampanya sayısı
    const campaignResult = await pool.query(
      'SELECT COUNT(*) as total FROM email_campaigns'
    );
    const totalCampaigns = parseInt(campaignResult.rows[0].total);

    // Aktif kampanya sayısı
    const activeCampaignResult = await pool.query(
      `SELECT COUNT(*) as total 
       FROM email_campaigns 
       WHERE status IN ('active', 'running', 'scheduled')`
    );
    const activeCampaigns = parseInt(activeCampaignResult.rows[0].total);

    // Toplam gönderilen email sayısı (email_tracking tablosundan)
    let totalEmailsSent = 0;
    try {
      const emailResult = await pool.query(
        'SELECT COUNT(*) as total FROM email_tracking'
      );
      totalEmailsSent = parseInt(emailResult.rows[0].total);
    } catch (error) {
      console.log('email_tracking table not available:', error.message);
    }

    // Açılan email sayısı
    let openedEmails = 0;
    try {
      const openResult = await pool.query(
        'SELECT COUNT(*) as total FROM email_tracking WHERE opened_at IS NOT NULL'
      );
      openedEmails = parseInt(openResult.rows[0].total);
    } catch (error) {
      console.log('email_tracking opened data not available');
    }

    // Tıklanan email sayısı
    let clickedEmails = 0;
    try {
      const clickResult = await pool.query(
        'SELECT COUNT(*) as total FROM email_tracking WHERE clicked_at IS NOT NULL'
      );
      clickedEmails = parseInt(clickResult.rows[0].total);
    } catch (error) {
      console.log('email_tracking clicked data not available');
    }

    // Açılma ve tıklama oranları
    const openRate = totalEmailsSent > 0 ? ((openedEmails / totalEmailsSent) * 100).toFixed(2) : '0.00';
    const clickRate = totalEmailsSent > 0 ? ((clickedEmails / totalEmailsSent) * 100).toFixed(2) : '0.00';

    // Son kayıt olan 5 organizasyon
    const recentOrgsResult = await pool.query(
      `SELECT id, name, created_at 
       FROM organizations 
       ORDER BY created_at DESC 
       LIMIT 5`
    );

    // Son kayıt olan 5 kullanıcı
    const recentUsersResult = await pool.query(
      `SELECT u.id, u.name, u.email, u.created_at, o.name as organization_name
       FROM users u
       LEFT JOIN organizations o ON u.organization_id = o.id
       WHERE u.is_super_admin = false
       ORDER BY u.created_at DESC 
       LIMIT 5`
    );

    // En aktif 5 organizasyon (email gönderim sayısına göre)
    let topOrganizations = [];
    try {
      const topOrgsResult = await pool.query(
        `SELECT 
          o.id,
          o.name,
          COUNT(et.id) as email_count
         FROM organizations o
         LEFT JOIN users u ON u.organization_id = o.id
         LEFT JOIN email_campaigns ec ON ec.user_id = u.id
         LEFT JOIN email_tracking et ON et.campaign_id = ec.id
         GROUP BY o.id, o.name
         HAVING COUNT(et.id) > 0
         ORDER BY email_count DESC
         LIMIT 5`
      );
      topOrganizations = topOrgsResult.rows;
    } catch (error) {
      console.log('Top organizations query failed:', error.message);
    }

    // Haftalık email gönderim trendi (son 7 gün)
    let weeklyTrend = [];
    try {
      const trendResult = await pool.query(
        `SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
         FROM email_tracking
         WHERE created_at >= NOW() - INTERVAL '7 days'
         GROUP BY DATE(created_at)
         ORDER BY date ASC`
      );
      weeklyTrend = trendResult.rows;
    } catch (error) {
      console.log('Weekly trend query failed:', error.message);
    }

    res.json({
      success: true,
      data: {
        // Genel istatistikler
        stats: {
          totalOrganizations,
          totalUsers,
          activeUsers,
          totalSuperAdmins,
          totalOrgAdmins,
          totalContacts,
          totalTemplates,
          totalCampaigns,
          activeCampaigns,
          totalEmailsSent,
          openedEmails,
          clickedEmails,
          openRate,
          clickRate,
        },
        // Son kayıtlar
        recentOrganizations: recentOrgsResult.rows,
        recentUsers: recentUsersResult.rows,
        // En aktif organizasyonlar
        topOrganizations,
        // Haftalık trend
        weeklyTrend,
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'İstatistikler yüklenirken bir hata oluştu',
      error: error.message,
    });
  }
});

module.exports = router;

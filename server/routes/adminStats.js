const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authMiddleware, requireSuperAdmin } = require('../middleware/auth');

router.get('/stats', authMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const orgResult = await pool.query('SELECT COUNT(*) as total FROM organizations');
    const totalOrganizations = parseInt(orgResult.rows[0].total);

    const userResult = await pool.query('SELECT COUNT(*) as total FROM users');
    const totalUsers = parseInt(userResult.rows[0].total);

    const activeUserResult = await pool.query(
      "SELECT COUNT(*) as total FROM users WHERE last_login_at >= NOW() - INTERVAL '30 days'"
    );
    const activeUsers = parseInt(activeUserResult.rows[0].total);

    const superAdminResult = await pool.query(
      "SELECT COUNT(*) as total FROM users WHERE role = 'super_admin'"
    );
    const totalSuperAdmins = parseInt(superAdminResult.rows[0].total);

    const orgAdminResult = await pool.query(
      "SELECT COUNT(*) as total FROM users WHERE role = 'org_admin'"
    );
    const totalOrgAdmins = parseInt(orgAdminResult.rows[0].total);

    const contactResult = await pool.query('SELECT COUNT(*) as total FROM contacts');
    const totalContacts = parseInt(contactResult.rows[0].total);

    let totalTemplates = 0;
    try {
      const templateResult = await pool.query('SELECT COUNT(*) as total FROM email_templates');
      totalTemplates = parseInt(templateResult.rows[0].total);
    } catch (e) {}

    let totalCampaigns = 0;
    let activeCampaigns = 0;
    try {
      const campaignResult = await pool.query('SELECT COUNT(*) as total FROM email_campaigns');
      totalCampaigns = parseInt(campaignResult.rows[0].total);
      const activeCampaignResult = await pool.query(
        "SELECT COUNT(*) as total FROM email_campaigns WHERE status IN ('active', 'running', 'scheduled')"
      );
      activeCampaigns = parseInt(activeCampaignResult.rows[0].total);
    } catch (e) {}

    let totalEmailsSent = 0;
    let openedEmails = 0;
    let clickedEmails = 0;
    try {
      const emailResult = await pool.query('SELECT COUNT(*) as total FROM email_tracking');
      totalEmailsSent = parseInt(emailResult.rows[0].total);
      const openResult = await pool.query('SELECT COUNT(*) as total FROM email_tracking WHERE opened_at IS NOT NULL');
      openedEmails = parseInt(openResult.rows[0].total);
      const clickResult = await pool.query('SELECT COUNT(*) as total FROM email_tracking WHERE clicked_at IS NOT NULL');
      clickedEmails = parseInt(clickResult.rows[0].total);
    } catch (e) {}

    const openRate = totalEmailsSent > 0 ? ((openedEmails / totalEmailsSent) * 100).toFixed(2) : '0.00';
    const clickRate = totalEmailsSent > 0 ? ((clickedEmails / totalEmailsSent) * 100).toFixed(2) : '0.00';

    let recentOrganizations = [];
    try {
      const recentOrgsResult = await pool.query(
        'SELECT id, name, created_at FROM organizations ORDER BY created_at DESC LIMIT 5'
      );
      recentOrganizations = recentOrgsResult.rows;
    } catch (e) {}

    let recentUsers = [];
    try {
      const recentUsersResult = await pool.query(
        "SELECT u.id, COALESCE(CONCAT(u.first_name, ' ', u.last_name), u.email) as name, u.email, u.created_at, o.name as organization_name FROM users u LEFT JOIN organizations o ON u.organization_id = o.id WHERE u.role != 'super_admin' ORDER BY u.created_at DESC LIMIT 5"
      );
      recentUsers = recentUsersResult.rows;
    } catch (e) {}

    res.json({
      success: true,
      data: {
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
        recentOrganizations,
        recentUsers,
        topOrganizations: [],
        weeklyTrend: [],
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

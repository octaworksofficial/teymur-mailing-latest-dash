const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authMiddleware } = require('../middleware/auth');

// Tüm dashboard route'ları için auth gerekli
router.use(authMiddleware);

// GET /api/dashboard - Dashboard ana verileri
router.get('/', async (req, res) => {
  try {
    const user = req.user;
    const userId = user.id;
    const isSuperAdmin = user.role === 'super_admin';

    // Toplam kişi sayısı
    let totalContacts = 0;
    try {
      let query, params;
      if (isSuperAdmin) {
        query = "SELECT COUNT(*) as total FROM contacts";
        params = [];
      } else {
        query = "SELECT COUNT(*) as total FROM contacts WHERE user_id = $1";
        params = [userId];
      }
      const contactsResult = await pool.query(query, params);
      totalContacts = parseInt(contactsResult.rows[0].total || 0);
    } catch (error) {
      console.log('Contacts tablosu sorgusu başarısız:', error.message);
    }

    // Toplam kampanya sayısı
    let activeCampaigns = 0;
    try {
      let query, params;
      if (isSuperAdmin) {
        query = "SELECT COUNT(*) as total FROM email_campaigns";
        params = [];
      } else {
        query = "SELECT COUNT(*) as total FROM email_campaigns WHERE user_id = $1";
        params = [userId];
      }
      const campaignsResult = await pool.query(query, params);
      activeCampaigns = parseInt(campaignsResult.rows[0].total || 0);
    } catch (error) {
      console.log('Campaigns tablosu sorgusu başarısız:', error.message);
    }

    // Toplam şablon sayısı
    let totalTemplates = 0;
    try {
      let query, params;
      if (isSuperAdmin) {
        query = "SELECT COUNT(*) as total FROM email_templates";
        params = [];
      } else {
        query = "SELECT COUNT(*) as total FROM email_templates WHERE user_id = $1";
        params = [userId];
      }
      const templatesResult = await pool.query(query, params);
      totalTemplates = parseInt(templatesResult.rows[0].total || 0);
    } catch (error) {
      console.log('Templates tablosu sorgusu başarısız:', error.message);
    }

    // Email istatistikleri - Son 30 gün
    // campaign_sends tablosundan al
    let emailStats = {
      totalEmailsSent: 0,
      totalEmailsSentChange: 0,
      openRate: 0,
      openRateChange: 0,
      clickRate: 0,
      clickRateChange: 0,
      replyRate: 0,
      replyRateChange: 0,
    };

    try {
      // Son 30 gün email istatistikleri
      let emailStatsQuery, params;
      if (isSuperAdmin) {
        emailStatsQuery = `
          SELECT 
            COUNT(*) FILTER (WHERE is_sent = true) as total_sent,
            COUNT(*) FILTER (WHERE is_opened = true) as total_opened,
            COUNT(*) FILTER (WHERE is_clicked = true) as total_clicked,
            COUNT(*) FILTER (WHERE is_replied = true) as total_replied
          FROM campaign_sends 
          WHERE sent_date >= NOW() - INTERVAL '30 days'
        `;
        params = [];
      } else {
        emailStatsQuery = `
          SELECT 
            COUNT(*) FILTER (WHERE cs.is_sent = true) as total_sent,
            COUNT(*) FILTER (WHERE cs.is_opened = true) as total_opened,
            COUNT(*) FILTER (WHERE cs.is_clicked = true) as total_clicked,
            COUNT(*) FILTER (WHERE cs.is_replied = true) as total_replied
          FROM campaign_sends cs
          JOIN email_campaigns ec ON cs.campaign_id = ec.id
          WHERE cs.sent_date >= NOW() - INTERVAL '30 days'
            AND ec.user_id = $1
        `;
        params = [userId];
      }
      const statsResult = await pool.query(emailStatsQuery, params);
      
      if (statsResult.rows.length > 0) {
        const stats = statsResult.rows[0];
        const totalSent = parseInt(stats.total_sent) || 0;
        const totalOpened = parseInt(stats.total_opened) || 0;
        const totalClicked = parseInt(stats.total_clicked) || 0;
        const totalReplied = parseInt(stats.total_replied) || 0;

        emailStats.totalEmailsSent = totalSent;
        emailStats.openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
        emailStats.clickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;
        emailStats.replyRate = totalSent > 0 ? (totalReplied / totalSent) * 100 : 0;
      }
    } catch (emailError) {
      console.log('Email stats alınamadı:', emailError.message);
    }

    // Haftalık email verileri (son 7 gün)
    let weeklyEmails = [];
    try {
      let weeklyQuery, weeklyParams;
      if (isSuperAdmin) {
        weeklyQuery = `
          SELECT 
            TO_CHAR(DATE(sent_date), 'Dy') as day_name,
            DATE(sent_date) as send_date,
            COUNT(*) FILTER (WHERE is_sent = true) as count
          FROM campaign_sends
          WHERE sent_date >= NOW() - INTERVAL '7 days'
          GROUP BY DATE(sent_date)
          ORDER BY send_date ASC
        `;
        weeklyParams = [];
      } else {
        weeklyQuery = `
          SELECT 
            TO_CHAR(DATE(cs.sent_date), 'Dy') as day_name,
            DATE(cs.sent_date) as send_date,
            COUNT(*) FILTER (WHERE cs.is_sent = true) as count
          FROM campaign_sends cs
          JOIN email_campaigns ec ON cs.campaign_id = ec.id
          WHERE cs.sent_date >= NOW() - INTERVAL '7 days'
            AND ec.user_id = $1
          GROUP BY DATE(cs.sent_date)
          ORDER BY send_date ASC
        `;
        weeklyParams = [userId];
      }
      const weeklyResult = await pool.query(weeklyQuery, weeklyParams);
      
      // Türkçe gün isimleri
      const dayMap = {
        'Mon': 'Pzt', 'Tue': 'Sal', 'Wed': 'Çar', 
        'Thu': 'Per', 'Fri': 'Cum', 'Sat': 'Cmt', 'Sun': 'Paz'
      };
      
      weeklyEmails = weeklyResult.rows.map(row => ({
        date: dayMap[row.day_name] || row.day_name,
        value: parseInt(row.count),
      }));
      
      // Eksik günleri 0 ile doldur (son 7 gün)
      const today = new Date();
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dayIndex = date.getDay();
        const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
        const dayName = dayNames[dayIndex];
        
        const existingData = weeklyEmails.find(w => w.date === dayName);
        last7Days.push({
          date: dayName,
          value: existingData ? existingData.value : 0,
        });
      }
      weeklyEmails = last7Days;
    } catch (weeklyError) {
      console.log('Haftalık veri oluşturulamadı:', weeklyError.message);
      // Varsayılan boş haftalık veri
      weeklyEmails = [
        { date: 'Pzt', value: 0 },
        { date: 'Sal', value: 0 },
        { date: 'Çar', value: 0 },
        { date: 'Per', value: 0 },
        { date: 'Cum', value: 0 },
        { date: 'Cmt', value: 0 },
        { date: 'Paz', value: 0 },
      ];
    }

    // Aktif kampanyalar
    let activeCampaignsData = [];
    try {
      let campaignsQuery, campaignsParams;
      if (isSuperAdmin) {
        campaignsQuery = `
          SELECT 
            ec.id,
            ec.name,
            ec.status,
            ec.created_at,
            ec.first_send_date,
            ec.target_contact_ids,
            ec.total_sent,
            ec.total_opened,
            ec.total_clicked,
            ec.total_replied,
            COALESCE(array_length(ec.target_contact_ids, 1), 0) as recipient_count,
            t.name as template_name
          FROM email_campaigns ec
          LEFT JOIN LATERAL (
            SELECT et.name 
            FROM email_templates et 
            WHERE et.id = (ec.template_sequence->0->>'template_id')::integer
          ) t ON true
          WHERE ec.status IN ('active', 'running', 'scheduled', 'draft')
          ORDER BY ec.created_at DESC
          LIMIT 10
        `;
        campaignsParams = [];
      } else {
        campaignsQuery = `
          SELECT 
            ec.id,
            ec.name,
            ec.status,
            ec.created_at,
            ec.first_send_date,
            ec.target_contact_ids,
            ec.total_sent,
            ec.total_opened,
            ec.total_clicked,
            ec.total_replied,
            COALESCE(array_length(ec.target_contact_ids, 1), 0) as recipient_count,
            t.name as template_name
          FROM email_campaigns ec
          LEFT JOIN LATERAL (
            SELECT et.name 
            FROM email_templates et 
            WHERE et.id = (ec.template_sequence->0->>'template_id')::integer
          ) t ON true
          WHERE ec.status IN ('active', 'running', 'scheduled', 'draft')
            AND ec.user_id = $1
          ORDER BY ec.created_at DESC
          LIMIT 10
        `;
        campaignsParams = [userId];
      }
      const campaignsQueryResult = await pool.query(campaignsQuery, campaignsParams);
      
      activeCampaignsData = campaignsQueryResult.rows.map(campaign => {
        const recipientCount = parseInt(campaign.recipient_count) || 0;
        const totalSent = parseInt(campaign.total_sent) || 0;
        const totalOpened = parseInt(campaign.total_opened) || 0;
        const totalClicked = parseInt(campaign.total_clicked) || 0;
        const totalReplied = parseInt(campaign.total_replied) || 0;
        
        // Açılma ve tıklama oranları hesapla
        const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : '0.0';
        const clickRate = totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : '0.0';
        
        // İlerleme durumu
        let progress = 0;
        if (recipientCount > 0) {
          progress = Math.min(100, Math.round((totalSent / recipientCount) * 100));
        }
        
        // Sonraki gönderim zamanı
        const nextSendDate = campaign.first_send_date;
        
        return {
          id: campaign.id,
          key: campaign.id.toString(),
          name: campaign.name,
          templateName: campaign.template_name || '-',
          status: campaign.status,
          recipients: recipientCount,
          sent: totalSent,
          opened: totalOpened,
          clicked: totalClicked,
          replied: totalReplied,
          openRate: `${openRate}%`,
          clickRate: `${clickRate}%`,
          progress: progress,
          nextSendDate: nextSendDate,
          createdAt: campaign.created_at,
        };
      });
    } catch (campaignError) {
      console.log('Aktif kampanyalar getirilemedi:', campaignError.message);
      console.error('Campaign error stack:', campaignError.stack);
      activeCampaignsData = [];
    }

    res.json({
      success: true,
      data: {
        stats: {
          totalContacts,
          activeCampaigns,
          totalTemplates,
          ...emailStats,
        },
        weeklyEmails,
        activeCampaigns: activeCampaignsData,
      },
    });
  } catch (error) {
    console.error('Dashboard veri hatası:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Dashboard verileri alınırken hata oluştu',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

// GET /api/dashboard/stats - Sadece istatistikler
router.get('/stats', async (req, res) => {
  try {
    const user = req.user;
    const userId = user.id;
    const isSuperAdmin = user.role === 'super_admin';

    let totalContacts = 0;
    let activeCampaigns = 0;
    let totalTemplates = 0;

    try {
      let query, params;
      if (isSuperAdmin) {
        query = "SELECT COUNT(*) as total FROM contacts";
        params = [];
      } else {
        query = "SELECT COUNT(*) as total FROM contacts WHERE user_id = $1";
        params = [userId];
      }
      const contactsResult = await pool.query(query, params);
      totalContacts = parseInt(contactsResult.rows[0].total || 0);
    } catch (error) {
      console.log('Contacts count hatası:', error.message);
    }

    try {
      let query, params;
      if (isSuperAdmin) {
        query = "SELECT COUNT(*) as total FROM email_campaigns";
        params = [];
      } else {
        query = "SELECT COUNT(*) as total FROM email_campaigns WHERE user_id = $1";
        params = [userId];
      }
      const campaignsResult = await pool.query(query, params);
      activeCampaigns = parseInt(campaignsResult.rows[0].total || 0);
    } catch (error) {
      console.log('Campaigns count hatası:', error.message);
    }

    try {
      let query, params;
      if (isSuperAdmin) {
        query = "SELECT COUNT(*) as total FROM email_templates";
        params = [];
      } else {
        query = "SELECT COUNT(*) as total FROM email_templates WHERE user_id = $1";
        params = [userId];
      }
      const templatesResult = await pool.query(query, params);
      totalTemplates = parseInt(templatesResult.rows[0].total || 0);
    } catch (error) {
      console.log('Templates count hatası:', error.message);
    }

    res.json({
      success: true,
      data: {
        totalContacts,
        activeCampaigns,
        totalTemplates,
      },
    });
  } catch (error) {
    console.error('Stats veri hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İstatistikler alınırken hata oluştu',
      error: error.message,
    });
  }
});

module.exports = router;

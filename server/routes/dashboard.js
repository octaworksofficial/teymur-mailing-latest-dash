const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// GET /api/dashboard - Dashboard ana verileri
router.get('/', async (req, res) => {
  try {
    // Toplam kişi sayısı
    let totalContacts = 0;
    try {
      const contactsResult = await pool.query(
        "SELECT COUNT(*) as total FROM contacts"
      );
      totalContacts = parseInt(contactsResult.rows[0].total || 0);
    } catch (error) {
      console.log('Contacts tablosu sorgusu başarısız:', error.message);
    }

    // Toplam kampanya sayısı
    let activeCampaigns = 0;
    try {
      const campaignsResult = await pool.query(
        "SELECT COUNT(*) as total FROM email_campaigns"
      );
      activeCampaigns = parseInt(campaignsResult.rows[0].total || 0);
    } catch (error) {
      console.log('Campaigns tablosu sorgusu başarısız:', error.message);
    }

    // Toplam şablon sayısı
    let totalTemplates = 0;
    try {
      const templatesResult = await pool.query(
        "SELECT COUNT(*) as total FROM email_templates"
      );
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
      const emailStatsQuery = `
        SELECT 
          COUNT(*) FILTER (WHERE is_sent = true) as total_sent,
          COUNT(*) FILTER (WHERE is_opened = true) as total_opened,
          COUNT(*) FILTER (WHERE is_clicked = true) as total_clicked,
          COUNT(*) FILTER (WHERE is_replied = true) as total_replied
        FROM campaign_sends 
        WHERE sent_date >= NOW() - INTERVAL '30 days'
      `;
      const statsResult = await pool.query(emailStatsQuery);
      
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

        // Önceki 30 gün ile karşılaştırma
        const prevEmailStatsQuery = `
          SELECT 
            COUNT(*) FILTER (WHERE is_sent = true) as total_sent,
            COUNT(*) FILTER (WHERE is_opened = true) as total_opened,
            COUNT(*) FILTER (WHERE is_clicked = true) as total_clicked,
            COUNT(*) FILTER (WHERE is_replied = true) as total_replied
          FROM campaign_sends 
          WHERE sent_date >= NOW() - INTERVAL '60 days'
            AND sent_date < NOW() - INTERVAL '30 days'
        `;
        const prevStatsResult = await pool.query(prevEmailStatsQuery);
        
        if (prevStatsResult.rows.length > 0) {
          const prevStats = prevStatsResult.rows[0];
          const prevTotalSent = parseInt(prevStats.total_sent) || 1; // 0 bölme hatasını önle
          const prevOpenRate = (parseInt(prevStats.total_opened) || 0) / prevTotalSent * 100;
          const prevClickRate = (parseInt(prevStats.total_clicked) || 0) / prevTotalSent * 100;
          const prevReplyRate = (parseInt(prevStats.total_replied) || 0) / prevTotalSent * 100;

          // Değişim yüzdeleri
          emailStats.totalEmailsSentChange = prevTotalSent > 0 
            ? ((totalSent - prevTotalSent) / prevTotalSent) * 100 
            : 0;
          emailStats.openRateChange = prevOpenRate > 0 
            ? ((emailStats.openRate - prevOpenRate) / prevOpenRate) * 100 
            : 0;
          emailStats.clickRateChange = prevClickRate > 0 
            ? ((emailStats.clickRate - prevClickRate) / prevClickRate) * 100 
            : 0;
          emailStats.replyRateChange = prevReplyRate > 0 
            ? ((emailStats.replyRate - prevReplyRate) / prevReplyRate) * 100 
            : 0;
        }
      }
    } catch (emailError) {
      console.log('Email stats alınamadı:', emailError.message);
      // Varsayılan değerler kullanılacak
    }

    // Haftalık email verileri (son 7 gün)
    let weeklyEmails = [];
    try {
      const weeklyQuery = `
        SELECT 
          TO_CHAR(DATE(sent_date), 'Dy') as day_name,
          DATE(sent_date) as send_date,
          COUNT(*) FILTER (WHERE is_sent = true) as count
        FROM campaign_sends
        WHERE sent_date >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(sent_date)
        ORDER BY send_date ASC
      `;
      const weeklyResult = await pool.query(weeklyQuery);
      
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
      const campaignsQuery = `
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
          COALESCE(array_length(ec.target_contact_ids, 1), 0) as recipient_count,
          COALESCE(
            (SELECT COUNT(*) 
             FROM campaign_sends cs 
             WHERE cs.campaign_id = ec.id AND cs.is_sent = true), 
            0
          ) as emails_sent
        FROM email_campaigns ec
        WHERE ec.status IN ('active', 'running', 'scheduled', 'draft')
        ORDER BY ec.created_at DESC
        LIMIT 5
      `;
      const campaignsQueryResult = await pool.query(campaignsQuery);
      
      activeCampaignsData = await Promise.all(campaignsQueryResult.rows.map(async campaign => {
        const recipientCount = parseInt(campaign.recipient_count) || 0;
        const emailsSent = parseInt(campaign.emails_sent) || 0;
        const totalSent = parseInt(campaign.total_sent) || 0;
        
        // Progress hesapla: Kaç kişiye email gönderildiği / Toplam alıcı sayısı
        let progress = 0;
        if (recipientCount > 0) {
          progress = Math.min(100, Math.round((emailsSent / recipientCount) * 100));
        }
        
        return {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          recipients: recipientCount,
          emails: emailsSent,
          progress: progress,
        };
      }));
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
    let totalContacts = 0;
    let activeCampaigns = 0;
    let totalTemplates = 0;

    try {
      const contactsResult = await pool.query(
        "SELECT COUNT(*) as total FROM contacts"
      );
      totalContacts = parseInt(contactsResult.rows[0].total || 0);
    } catch (error) {
      console.log('Contacts count hatası:', error.message);
    }

    try {
      const campaignsResult = await pool.query(
        "SELECT COUNT(*) as total FROM email_campaigns"
      );
      activeCampaigns = parseInt(campaignsResult.rows[0].total || 0);
    } catch (error) {
      console.log('Campaigns count hatası:', error.message);
    }

    try {
      const templatesResult = await pool.query(
        "SELECT COUNT(*) as total FROM email_templates"
      );
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

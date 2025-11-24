const express = require('express');
const router = express.Router();
const { pool } = require('../db');

/**
 * Email Açılma Tracking Endpoint
 * 1x1 invisible pixel image döner
 * Email açıldığında bu resim yüklenir ve açılma kaydedilir
 */
router.get('/open/:trackingId', async (req, res) => {
  const { trackingId } = req.params;
  
  try {
    // IP ve User Agent bilgilerini al
    const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    const userAgent = req.headers['user-agent'];

    // tracking_id ile campaign_send kaydını bul
    const sendQuery = await pool.query(
      'SELECT id, is_opened FROM campaign_sends WHERE tracking_id = $1',
      [trackingId]
    );

    if (sendQuery.rows.length === 0) {
      console.log(`⚠️  Tracking ID bulunamadı: ${trackingId}`);
      // Yine de pixel döndür (email client'ı hata vermesin)
      return sendPixelImage(res);
    }

    const campaignSend = sendQuery.rows[0];

    // Tracking event kaydı oluştur
    await pool.query(
      `INSERT INTO email_tracking_events 
       (campaign_send_id, event_type, ip_address, user_agent) 
       VALUES ($1, 'open', $2, $3)`,
      [campaignSend.id, ipAddress, userAgent]
    );

    // İlk açılış ise campaign_sends'i güncelle
    if (!campaignSend.is_opened) {
      await pool.query(
        `UPDATE campaign_sends 
         SET is_opened = true, opened_at = NOW() 
         WHERE id = $1`,
        [campaignSend.id]
      );
      console.log(`✅ Email açıldı - Campaign Send ID: ${campaignSend.id}`);
    } else {
      console.log(`📧 Email tekrar açıldı - Campaign Send ID: ${campaignSend.id}`);
    }

    // 1x1 transparent pixel image döndür
    sendPixelImage(res);

  } catch (error) {
    console.error('❌ Email açılma tracking hatası:', error);
    // Hata olsa bile pixel döndür
    sendPixelImage(res);
  }
});

/**
 * Link Tıklama Tracking Endpoint
 * Tıklamayı kaydeder ve orijinal URL'e yönlendirir
 */
router.get('/click/:trackingId', async (req, res) => {
  const { trackingId } = req.params;
  const { url } = req.query; // Orijinal URL query string'de gelecek

  try {
    if (!url) {
      return res.status(400).json({ error: 'URL parametresi gerekli' });
    }

    // IP ve User Agent bilgilerini al
    const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    const userAgent = req.headers['user-agent'];

    // tracking_id ile campaign_send kaydını bul
    const sendQuery = await pool.query(
      'SELECT id, is_clicked FROM campaign_sends WHERE tracking_id = $1',
      [trackingId]
    );

    if (sendQuery.rows.length === 0) {
      console.log(`⚠️  Tracking ID bulunamadı: ${trackingId}`);
      // Yine de redirect yap (kullanıcı deneyimi bozulmasın)
      return res.redirect(decodeURIComponent(url));
    }

    const campaignSend = sendQuery.rows[0];

    // Tracking event kaydı oluştur
    await pool.query(
      `INSERT INTO email_tracking_events 
       (campaign_send_id, event_type, link_url, ip_address, user_agent) 
       VALUES ($1, 'click', $2, $3, $4)`,
      [campaignSend.id, decodeURIComponent(url), ipAddress, userAgent]
    );

    // İlk tıklama ise campaign_sends'i güncelle
    if (!campaignSend.is_clicked) {
      await pool.query(
        `UPDATE campaign_sends 
         SET is_clicked = true, clicked_at = NOW() 
         WHERE id = $1`,
        [campaignSend.id]
      );
      console.log(`✅ Link tıklandı - Campaign Send ID: ${campaignSend.id}`);
    } else {
      console.log(`🔗 Link tekrar tıklandı - Campaign Send ID: ${campaignSend.id}`);
    }

    // Orijinal URL'e yönlendir
    res.redirect(decodeURIComponent(url));

  } catch (error) {
    console.error('❌ Link tıklama tracking hatası:', error);
    // Hata olsa bile redirect yap
    if (url) {
      res.redirect(decodeURIComponent(url));
    } else {
      res.status(500).json({ error: 'Tracking hatası' });
    }
  }
});

/**
 * Tracking İstatistikleri Endpoint
 * Belirli bir campaign_send için tüm tracking olaylarını getirir
 */
router.get('/events/:campaignSendId', async (req, res) => {
  const { campaignSendId } = req.params;

  try {
    const events = await pool.query(
      `SELECT 
        id,
        event_type,
        link_url,
        ip_address,
        user_agent,
        created_at
       FROM email_tracking_events 
       WHERE campaign_send_id = $1 
       ORDER BY created_at DESC`,
      [campaignSendId]
    );

    res.json({
      success: true,
      data: events.rows,
      total: events.rows.length
    });

  } catch (error) {
    console.error('❌ Tracking events getirme hatası:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Tracking olayları getirilemedi' 
    });
  }
});

/**
 * 1x1 Transparent Pixel Image Gönder
 */
function sendPixelImage(res) {
  // 1x1 transparent GIF (base64)
  const pixel = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  );
  
  res.writeHead(200, {
    'Content-Type': 'image/gif',
    'Content-Length': pixel.length,
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  
  res.end(pixel);
}

module.exports = router;

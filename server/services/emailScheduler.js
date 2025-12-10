const cron = require('node-cron');
const axios = require('axios');
const { pool } = require('../db');
const logStream = require('./logStream');
const { addTrackingToEmail, personalizeEmail } = require('../utils/emailTracking');
const { getPendingSchedules, updateScheduleAfterSend } = require('../utils/scheduleUtils');
const { makeOutlookCompatible } = require('../utils/vmlFallback');

// n8n webhook URL - .env'den alınacak
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://n8n-production-14b9.up.railway.app/webhook/send-email';
const SENDER_NAME = process.env.EMAIL_SENDER_NAME || 'Teymur Tekstil';
const DEFAULT_CC = process.env.EMAIL_DEFAULT_CC || '';
const DEFAULT_BCC = process.env.EMAIL_DEFAULT_BCC || '';

/**
 * Template içindeki değişkenleri kişi verileriyle değiştir
 * Desteklenen formatlar: {field_name} veya {{field_name}}
 * 
 * Örnekler:
 * - "Merhaba {first_name}" -> "Merhaba Deniz"
 * - "Sayın {{full_name}}" -> "Sayın Deniz Can"
 * - "{{company}} şirketinden" -> "ABC Şirket şirketinden"
 * 
 * Tüm contact tablosu alanları kullanılabilir:
 * - first_name, last_name, email, phone, mobile_phone
 * - company, company_title, position
 * - customer_representative, country, state, district
 * - address_1, address_2, importance_level, notes
 * - full_name (otomatik: first_name + last_name)
 * 
 * Custom fields için: {custom_FieldName} veya {{custom_FieldName}}
 */
function replaceTemplateVariables(text, contact) {
  if (!text) return text;
  
  let result = text;
  
  // Tüm contact alanlarını dinamik olarak ekle
  const contactFields = {
    first_name: contact.first_name || '',
    last_name: contact.last_name || '',
    email: contact.email || '',
    company: contact.company || '',
    position: contact.position || '',
    phone: contact.phone || '',
    mobile_phone: contact.mobile_phone || '',
    full_name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
    customer_representative: contact.customer_representative || '',
    country: contact.country || '',
    state: contact.state || '',
    district: contact.district || '',
    address_1: contact.address_1 || '',
    address_2: contact.address_2 || '',
    company_title: contact.company_title || '',
    importance_level: contact.importance_level ? String(contact.importance_level) : '',
    notes: contact.notes || '',
    status: contact.status || '',
    subscription_status: contact.subscription_status || '',
    source: contact.source || '',
  };
  
  // Her alan için hem {field} hem {{field}} formatını destekle
  Object.entries(contactFields).forEach(([key, value]) => {
    // {{field}} formatı
    const doubleBracePattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(doubleBracePattern, value);
    
    // {field} formatı
    const singleBracePattern = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(singleBracePattern, value);
  });
  
  // Custom fields - Excel'den gelen özel alanlar
  if (contact.custom_fields && typeof contact.custom_fields === 'object') {
    Object.entries(contact.custom_fields).forEach(([key, value]) => {
      // {{FieldName}} formatı - Excel başlık adıyla birebir aynı
      const doubleBracePattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(doubleBracePattern, value || '');
      
      // {FieldName} formatı
      const singleBracePattern = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(singleBracePattern, value || '');
      
      // {{custom_FieldName}} formatı (geriye uyumluluk için)
      const customDoubleBracePattern = new RegExp(`\\{\\{custom_${key}\\}\\}`, 'g');
      result = result.replace(customDoubleBracePattern, value || '');
      
      // {custom_FieldName} formatı (geriye uyumluluk için)
      const customSingleBracePattern = new RegExp(`\\{custom_${key}\\}`, 'g');
      result = result.replace(customSingleBracePattern, value || '');
    });
  }
  
  return result;
}

/**
 * n8n webhook ile email gönder
 * HTML'e Outlook VML fallback eklenir
 */
async function sendEmail(to, subject, htmlBody, contact, trackingId = null, campaignId = null, contactId = null, attachments = null) {
  try {
    // Outlook uyumluluğu için VML fallback ekle
    const outlookCompatibleHtml = makeOutlookCompatible(htmlBody);
    
    const payload = {
      to,
      subject,
      html_body: outlookCompatibleHtml,
      sender_name: SENDER_NAME,
    };
    
    // CC ve BCC varsa ekle
    if (DEFAULT_CC) payload.cc = DEFAULT_CC;
    if (DEFAULT_BCC) payload.bcc = DEFAULT_BCC;
    
    // Tracking bilgilerini ekle (n8n'de email header'larına eklenecek)
    if (trackingId || campaignId || contactId) {
      payload.tracking_info = {
        tracking_id: trackingId,
        campaign_id: campaignId,
        contact_id: contactId
      };
    }
    
    // Attachments varsa ekle (Google Drive URL'leri)
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      payload.attachments = attachments.map(att => ({
        filename: att.name || att.filename,
        url: att.url, // Google Drive download URL (webContentLink)
        type: att.type || att.mimeType,
        driveId: att.driveId || att.id
      }));
      console.log(`📎 ${attachments.length} ek dosya eklendi`);
    }
    
    console.log(`📧 Email gönderiliyor: ${to} - ${subject}${trackingId ? ` [Tracking: ${trackingId}]` : ''}`);
    
    const response = await axios.post(N8N_WEBHOOK_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 saniye timeout
    });
    
    console.log(`✅ Email başarıyla gönderildi: ${to}`);
    return { success: true, response: response.data };
  } catch (error) {
    console.error(`❌ Email gönderme hatası (${to}):`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Kampanya istatistiklerini güncelle
 */
async function updateCampaignStats(campaignId, incrementTotalSent = true) {
  try {
    if (incrementTotalSent) {
      await pool.query(
        'UPDATE email_campaigns SET total_sent = COALESCE(total_sent, 0) + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [campaignId]
      );
    }
  } catch (error) {
    console.error('Kampanya istatistikleri güncellenirken hata:', error);
  }
}

/**
 * Kişinin engagement score'unu artır
 */
async function incrementEngagementScore(contactId) {
  try {
    await pool.query(
      'UPDATE contacts SET engagement_score = COALESCE(engagement_score, 0) + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [contactId]
    );
  } catch (error) {
    console.error('Engagement score güncellenirken hata:', error);
  }
}

/**
 * Campaign sent kaydı oluştur
 */
async function logEmailSent(campaignId, contactId, templateId, emailTo, subject, body, scheduledFor, sequenceIndex, status, errorMessage = null) {
  try {
    const isSent = status === 'sent';
    const isFailed = status === 'failed';
    
    // Campaign sends tablosuna kayıt ekle ve tracking_id'yi döndür
    const result = await pool.query(
      `INSERT INTO campaign_sends 
        (campaign_id, contact_id, template_id, sequence_index, scheduled_date, 
         sent_date, rendered_subject, rendered_body_html, 
         is_sent, is_failed, failure_reason, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id, tracking_id`,
      [
        campaignId, 
        contactId, 
        templateId, 
        sequenceIndex, 
        scheduledFor,
        isSent ? new Date() : null,
        subject, 
        body, 
        isSent, 
        isFailed, 
        errorMessage
      ]
    );
    
    // Eğer email başarıyla gönderildiyse, contacts tablosundaki total_email_sent değerini artır
    if (isSent) {
      await pool.query(
        'UPDATE contacts SET total_email_sent = COALESCE(total_email_sent, 0) + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [contactId]
      );
    }
    
    // tracking_id'yi döndür
    return result.rows[0];
  } catch (error) {
    console.error('❌ Campaign sent kaydı oluşturulurken hata:', {
      error: error.message,
      stack: error.stack,
      campaignId,
      contactId,
      templateId,
      sequenceIndex,
      status,
      errorDetails: {
        code: error.code,
        detail: error.detail,
        hint: error.hint,
        position: error.position,
        constraint: error.constraint
      }
    });
    return null;
  }
}

/**
 * Şu anda gönderilmesi gereken emailleri bul ve gönder
 */
async function processScheduledEmails() {
  try {
    console.log('🔍 Zamanlanmış emailler kontrol ediliyor...');
    logStream.info('🔍 Zamanlanmış emailler kontrol ediliyor...');
    
    // Aktif kampanyaları getir (status: active, scheduled, running)
    const campaignsResult = await pool.query(`
      SELECT id, name, target_contact_ids, template_sequence, status, stop_on_reply
      FROM email_campaigns
      WHERE status IN ('active', 'scheduled', 'running')
        AND template_sequence IS NOT NULL
        AND jsonb_array_length(template_sequence) > 0
    `);
    
    if (campaignsResult.rows.length === 0) {
      console.log('ℹ️  Aktif kampanya bulunamadı');
      logStream.warning('ℹ️  Aktif kampanya bulunamadı');
      return;
    }
    
    console.log(`📋 ${campaignsResult.rows.length} aktif kampanya bulundu`);
    logStream.info(`📋 ${campaignsResult.rows.length} aktif kampanya bulundu`, { 
      campaignCount: campaignsResult.rows.length 
    });
    
    let totalEmailsToSend = 0;
    let totalEmailsSent = 0;
    let totalEmailsFailed = 0;
    
    for (const campaign of campaignsResult.rows) {
      const { id: campaignId, name, target_contact_ids, template_sequence, stop_on_reply } = campaign;
      
      logStream.info(`🎯 Kampanya kontrol ediliyor: "${name}"`, { 
        campaignId, 
        recipientCount: target_contact_ids?.length || 0,
        templateCount: template_sequence?.length || 0
      });
      
      if (!target_contact_ids || target_contact_ids.length === 0) {
        console.log(`⚠️  Kampanya "${name}" için hedef kişi yok`);
        logStream.warning(`⚠️  Kampanya "${name}" için hedef kişi yok`, { campaignId, name });
        continue;
      }
      
      // Template sequence üzerinde döngü
      for (let sequenceIndex = 0; sequenceIndex < template_sequence.length; sequenceIndex++) {
        const sequenceItem = template_sequence[sequenceIndex];
        const { template_id, scheduled_date } = sequenceItem;
        
        if (!scheduled_date) {
          console.log(`⚠️  Kampanya "${name}" - ${sequenceIndex + 1}. email için tarih yok`);
          logStream.warning(`⚠️  Kampanya "${name}" - ${sequenceIndex + 1}. email için tarih yok`, { 
            campaignId, 
            campaignName: name, 
            sequenceIndex 
          });
          continue;
        }
        
        // Tarihi kontrol et - şu andan önceyse gönder
        const scheduledTime = new Date(scheduled_date);
        const now = new Date();
        
        // 3 dakikalık tolerans (cron her 3 dakikada çalıştığı için)
        const toleranceMs = 3 * 60 * 1000;
        const timeDiff = now - scheduledTime;
        
        // Tarih gelecekte mi? Henüz zamanı gelmedi
        if (timeDiff < -toleranceMs) {
          // Henüz zamanı gelmedi, atla
          continue;
        }
        
        // Tarih çok geçmişte mi? (3 dakikadan fazla)
        if (timeDiff > toleranceMs) {
          // Çok eski bir tarih - daha önce gönderilmiş mi kontrol et
          const sentCheck = await pool.query(
            'SELECT id FROM campaign_sends WHERE campaign_id = $1 AND sequence_index = $2 AND is_sent = true LIMIT 1',
            [campaignId, sequenceIndex]
          );
          
          if (sentCheck.rows.length > 0) {
            // Zaten gönderilmiş, atla
            continue;
          } else {
            // Gönderilmemiş ama tarih çok eski - kaçırılmış, logla ve atla
            logStream.warning(`⚠️ Kaçırılmış tarih (çok eski): ${scheduled_date}`, {
              campaignId,
              campaignName: name,
              sequenceIndex: sequenceIndex + 1,
              scheduledDate: scheduled_date,
              currentDate: now.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }),
              currentDateISO: now.toISOString(),
              daysMissed: Math.floor(timeDiff / (1000 * 60 * 60 * 24))
            });
            continue;
          }
        }
        
        // Tarih eşleşti! (±3 dakika tolerance içinde)
        logStream.success(`✅ Eşleşen tarih bulundu!`, { 
          campaignId, 
          campaignName: name,
          sequenceIndex: sequenceIndex + 1,
          scheduledDate: scheduled_date,
          templateId: template_id,
          currentDate: now.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }),
          currentDateISO: now.toISOString()
        });
        
        // Template'i getir
        const templateResult = await pool.query(
          'SELECT id, name, subject, body_html, body_text, category, attachments FROM email_templates WHERE id = $1',
          [template_id]
        );
        
        if (templateResult.rows.length === 0) {
          console.log(`⚠️  Template bulunamadı (ID: ${template_id})`);
          logStream.error(`⚠️  Template bulunamadı (ID: ${template_id})`, { 
            campaignId, 
            templateId: template_id 
          });
          continue;
        }
        
        const template = templateResult.rows[0];
        
        logStream.info(`📧 Kampanya "${name}" - ${target_contact_ids.length} kişiye email gönderiliyor`, {
          campaignId,
          campaignName: name,
          recipientCount: target_contact_ids.length,
          templateName: template.name,
          sequenceIndex: sequenceIndex + 1,
          contactIds: target_contact_ids
        });
        
        // Her hedef kişi için email gönder
        for (const contactId of target_contact_ids) {
          // Eğer stop_on_reply aktifse ve bu kişi daha önce yanıt verdiyse, atla
          if (stop_on_reply) {
            const replyCheck = await pool.query(
              'SELECT id FROM campaign_sends WHERE campaign_id = $1 AND contact_id = $2 AND is_replied = true LIMIT 1',
              [campaignId, contactId]
            );
            
            if (replyCheck.rows.length > 0) {
              console.log(`⏭️  Kişi ${contactId} yanıt vermiş, email atlandı`);
              continue;
            }
          }
          
          // Bu kişiye bu sequence index için daha önce email gönderilmiş mi?
          const alreadySentCheck = await pool.query(
            'SELECT id FROM campaign_sends WHERE campaign_id = $1 AND contact_id = $2 AND sequence_index = $3 AND is_sent = true LIMIT 1',
            [campaignId, contactId, sequenceIndex]
          );
          
          if (alreadySentCheck.rows.length > 0) {
            // Zaten gönderilmiş
            logStream.info(`⏭️  Kişi ${contactId} için zaten gönderilmiş, atlanıyor`, {
              campaignId,
              contactId,
              sequenceIndex
            });
            continue;
          }
          
          // Kişi bilgilerini getir
          const contactResult = await pool.query(
            'SELECT * FROM contacts WHERE id = $1 AND status = $2',
            [contactId, 'active']
          );
          
          if (contactResult.rows.length === 0) {
            console.log(`⚠️  Aktif kişi bulunamadı (ID: ${contactId})`);
            logStream.warning(`⚠️  Aktif kişi bulunamadı (ID: ${contactId})`, {
              campaignId,
              contactId,
              reason: 'Contact not found or not active'
            });
            continue;
          }
          
          const contact = contactResult.rows[0];
          
          // Email gönder
          totalEmailsToSend++;
          
          logStream.info(`📤 Email gönderiliyor: ${contact.email}`, {
            campaignId,
            campaignName: name,
            contactId,
            contactEmail: contact.email,
            contactName: `${contact.first_name} ${contact.last_name}`,
            templateName: template.name
          });
          
          // ÖNCE campaign_sends kaydı oluştur (tracking_id almak için)
          const sendRecord = await logEmailSent(
            campaignId,
            contactId,
            template_id,
            contact.email,
            template.subject,
            template.body_html,
            scheduled_date,
            sequenceIndex,
            'pending' // Önce pending olarak oluştur
          );
          
          if (!sendRecord || !sendRecord.tracking_id) {
            logStream.error(`❌ Campaign send kaydı oluşturulamadı: ${contact.email}`, {
              campaignId,
              contactId,
              contactEmail: contact.email
            });
            totalEmailsFailed++;
            continue;
          }
          
          // Email HTML'ine tracking ekle
          let trackedHtml = template.body_html;
          
          // 1. Personalization (değişken replacement)
          trackedHtml = replaceTemplateVariables(trackedHtml, contact);
          
          // 2. Tracking ekle (pixel + link tracking)
          trackedHtml = addTrackingToEmail(trackedHtml, sendRecord.tracking_id);
          
          // Subject'i de personalize et
          const personalizedSubject = replaceTemplateVariables(template.subject, contact);
          
          // Email'i gönder (tracking bilgileriyle birlikte + attachments)
          const result = await sendEmail(
            contact.email,
            personalizedSubject,
            trackedHtml,
            contact,
            sendRecord.tracking_id,  // tracking_id ekle
            campaignId,              // campaign_id ekle
            contactId,               // contact_id ekle
            template.attachments     // attachments ekle (Google Drive URL'leri)
          );
          
          if (result.success) {
            totalEmailsSent++;
            
            logStream.success(`✅ Email başarıyla gönderildi: ${contact.email}`, {
              campaignId,
              contactId,
              contactEmail: contact.email,
              templateName: template.name,
              trackingId: sendRecord.tracking_id
            });
            
            // Başarılı gönderim - kaydı güncelle
            await pool.query(
              `UPDATE campaign_sends 
               SET is_sent = true, 
                   sent_date = NOW(), 
                   rendered_subject = $1,
                   rendered_body_html = $2,
                   updated_at = CURRENT_TIMESTAMP 
               WHERE id = $3`,
              [personalizedSubject, trackedHtml, sendRecord.id]
            );
            
            // total_email_sent'i artır (logEmailSent'te zaten yapılıyor ama pending'di)
            await pool.query(
              'UPDATE contacts SET total_email_sent = COALESCE(total_email_sent, 0) + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
              [contactId]
            );
            
            await updateCampaignStats(campaignId, true);
            await incrementEngagementScore(contactId);
          } else {
            totalEmailsFailed++;
            
            logStream.error(`❌ Email gönderilemedi: ${contact.email}`, {
              campaignId,
              contactId,
              contactEmail: contact.email,
              error: result.error
            });
            
            // Hatalı gönderim - kaydı güncelle
            await pool.query(
              `UPDATE campaign_sends 
               SET is_failed = true, 
                   failure_reason = $1,
                   updated_at = CURRENT_TIMESTAMP 
               WHERE id = $2`,
              [result.error, sendRecord.id]
            );
          }
          
          // Rate limiting - her email arasında 500ms bekle
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }
    
    const summary = {
      totalToSend: totalEmailsToSend,
      totalSent: totalEmailsSent,
      totalFailed: totalEmailsFailed
    };
    
    console.log(`\n📊 Özet:`);
    console.log(`   Gönderilmesi gereken: ${totalEmailsToSend}`);
    console.log(`   ✅ Başarılı: ${totalEmailsSent}`);
    console.log(`   ❌ Başarısız: ${totalEmailsFailed}\n`);
    
    logStream.system(`📊 İşlem tamamlandı - Özet:`, summary);
    
  } catch (error) {
    console.error('❌ Email scheduler hatası:', error);
    logStream.error('❌ Email scheduler hatası', { error: error.message, stack: error.stack });
  }
}

/**
 * YENİ: Schedule tablosu tabanlı email işleme
 * Recurring ve Special Day zamanlamalarını destekler
 */
async function processScheduledEmailsV2() {
  try {
    console.log('🔍 [V2] Schedule tabanlı email kontrolü...');
    logStream.info('🔍 [V2] Schedule tabanlı email kontrolü başladı');
    
    // Gönderilmesi gereken schedule'ları al
    const pendingSchedules = await getPendingSchedules(5); // 5 dakika tolerans
    
    if (pendingSchedules.length === 0) {
      console.log('ℹ️  [V2] Gönderilecek schedule bulunamadı');
      return;
    }
    
    console.log(`📋 [V2] ${pendingSchedules.length} schedule bulundu`);
    logStream.info(`📋 [V2] ${pendingSchedules.length} schedule bulundu`);
    
    let totalEmailsToSend = 0;
    let totalEmailsSent = 0;
    let totalEmailsFailed = 0;
    
    for (const schedule of pendingSchedules) {
      const { 
        id: scheduleId,
        campaign_id: campaignId,
        template_id: templateId,
        sequence_index: sequenceIndex,
        campaign_name: campaignName,
        target_contact_ids: contactIds,
        stop_on_reply: stopOnReply,
        subject,
        body_html: bodyHtml,
        body_text: bodyText,
        from_name: fromName,
        from_email: fromEmail,
        cc_emails: ccEmails,
        bcc_emails: bccEmails,
        schedule_type: scheduleType,
        attachments
      } = schedule;
      
      console.log(`🎯 [V2] Kampanya "${campaignName}" - ${scheduleType} schedule işleniyor`);
      logStream.info(`🎯 [V2] Schedule işleniyor`, {
        scheduleId,
        campaignId,
        campaignName,
        scheduleType,
        recipientCount: contactIds?.length || 0
      });
      
      if (!contactIds || contactIds.length === 0) {
        console.log(`⚠️  [V2] Hedef kişi yok, atlanıyor`);
        continue;
      }
      
      // Her kişi için email gönder
      for (const contactId of contactIds) {
        // Stop on reply kontrolü
        if (stopOnReply) {
          const replyCheck = await pool.query(
            'SELECT id FROM campaign_sends WHERE campaign_id = $1 AND contact_id = $2 AND is_replied = true LIMIT 1',
            [campaignId, contactId]
          );
          
          if (replyCheck.rows.length > 0) {
            console.log(`⏭️  [V2] Kişi ${contactId} yanıt vermiş, atlanıyor`);
            continue;
          }
        }
        
        // Bu schedule için bu kişiye daha önce gönderilmiş mi?
        // Recurring için: aynı next_send_date için kontrol
        const alreadySentCheck = await pool.query(
          `SELECT id FROM campaign_sends 
           WHERE campaign_id = $1 AND contact_id = $2 AND sequence_index = $3 
           AND is_sent = true 
           AND DATE(sent_date) = DATE($4)
           LIMIT 1`,
          [campaignId, contactId, sequenceIndex, schedule.next_send_date]
        );
        
        if (alreadySentCheck.rows.length > 0) {
          continue; // Zaten gönderilmiş
        }
        
        // Kişi bilgilerini getir
        const contactResult = await pool.query(
          'SELECT * FROM contacts WHERE id = $1 AND status = $2',
          [contactId, 'active']
        );
        
        if (contactResult.rows.length === 0) {
          console.log(`⚠️  [V2] Aktif kişi bulunamadı (ID: ${contactId})`);
          continue;
        }
        
        const contact = contactResult.rows[0];
        totalEmailsToSend++;
        
        // Campaign sends kaydı oluştur
        const sendRecord = await logEmailSent(
          campaignId,
          contactId,
          templateId,
          contact.email,
          subject,
          bodyHtml,
          schedule.next_send_date,
          sequenceIndex,
          'pending'
        );
        
        if (!sendRecord || !sendRecord.tracking_id) {
          logStream.error(`❌ [V2] Send kaydı oluşturulamadı: ${contact.email}`);
          totalEmailsFailed++;
          continue;
        }
        
        // Template değişkenlerini uygula
        const personalizedSubject = replaceTemplateVariables(subject, contact);
        const personalizedHtml = personalizeEmail(bodyHtml, contact);
        const trackedHtml = addTrackingToEmail(
          personalizedHtml, 
          sendRecord.tracking_id, 
          campaignId, 
          contactId
        );
        
        // Email gönder
        const result = await sendEmail(
          contact.email,
          personalizedSubject,
          trackedHtml,
          contact,
          sendRecord.tracking_id,
          campaignId,
          contactId,
          attachments  // Google Drive URL'leri ile attachments
        );
        
        if (result.success) {
          totalEmailsSent++;
          await pool.query(
            `UPDATE campaign_sends 
             SET is_sent = true, sent_date = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $1`,
            [sendRecord.id]
          );
        } else {
          totalEmailsFailed++;
          await pool.query(
            `UPDATE campaign_sends 
             SET is_failed = true, failure_reason = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2`,
            [result.error, sendRecord.id]
          );
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Schedule'ı güncelle (bir sonraki tarihi hesapla)
      await updateScheduleAfterSend(scheduleId);
    }
    
    console.log(`\n📊 [V2] Özet:`);
    console.log(`   Gönderilmesi gereken: ${totalEmailsToSend}`);
    console.log(`   ✅ Başarılı: ${totalEmailsSent}`);
    console.log(`   ❌ Başarısız: ${totalEmailsFailed}\n`);
    
    logStream.system(`📊 [V2] İşlem tamamlandı`, {
      totalToSend: totalEmailsToSend,
      totalSent: totalEmailsSent,
      totalFailed: totalEmailsFailed
    });
    
  } catch (error) {
    console.error('❌ [V2] Email scheduler hatası:', error);
    logStream.error('❌ [V2] Email scheduler hatası', { error: error.message, stack: error.stack });
  }
}

/**
 * Scheduler'ı başlat
 * Hem eski yöntemi (template_sequence.scheduled_date) hem de yeni yöntemi (schedule tablosu) çalıştırır
 */
function startEmailScheduler() {
  console.log('🚀 Email Scheduler başlatıldı - Her 3 dakikada çalışacak');
  console.log('   📌 V1: template_sequence.scheduled_date tabanlı (geriye uyumluluk)');
  console.log('   📌 V2: email_campaign_schedules tabanlı (recurring/special_day)');
  logStream.system('🚀 Email Scheduler başlatıldı - Her 3 dakikada çalışacak');
  
  // Her 3 dakikada bir çalış
  cron.schedule('*/3 * * * *', async () => {
    const now = new Date();
    const trTime = now.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' });
    console.log(`\n⏰ [${trTime}] Scheduler çalışıyor...`);
    logStream.system(`⏰ Scheduler otomatik çalıştı`, { 
      time: trTime,
      timestamp: now.toISOString() 
    });
    
    // Önce eski yöntemi çalıştır (geriye uyumluluk)
    await processScheduledEmails();
    
    // Sonra yeni schedule tabanlı yöntemi çalıştır
    await processScheduledEmailsV2();
  });
  
  // İlk çalıştırmayı hemen yap
  console.log('🔄 İlk kontrol başlatılıyor...');
  processScheduledEmails();
  processScheduledEmailsV2();
}

module.exports = {
  startEmailScheduler,
  processScheduledEmails, // V1 - geriye uyumluluk
  processScheduledEmailsV2, // V2 - yeni schedule tabanlı
  sendEmail, // Test için
};

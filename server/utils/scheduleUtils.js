/**
 * Schedule Utility Functions
 * Recurring ve Special Day tarihlerini hesaplayan yardımcı fonksiyonlar
 */

const { pool } = require('../db');

/**
 * Özel gün tarihini veritabanından al
 * @param {string} dayType - Özel gün tipi (ramazan_bayrami_1, yilbasi, vb.)
 * @param {number} year - Yıl
 * @param {number} userId - Kullanıcı ID (özel günler kullanıcı bazlı)
 * @returns {Date|null} Tarih veya null
 */
async function getSpecialDayDate(dayType, year, userId = null) {
  try {
    let result;
    if (userId) {
      result = await pool.query(
        'SELECT actual_date FROM special_days_calendar WHERE day_type = $1 AND year = $2 AND user_id = $3',
        [dayType, year, userId]
      );
    } else {
      // userId yoksa fallback (geriye uyumluluk)
      result = await pool.query(
        'SELECT actual_date FROM special_days_calendar WHERE day_type = $1 AND year = $2 LIMIT 1',
        [dayType, year]
      );
    }
    
    if (result.rows.length > 0) {
      return new Date(result.rows[0].actual_date);
    }
    
    // Milli bayramlar için sabit tarihler (DB'de yoksa fallback)
    const fixedDates = {
      'yilbasi': `${year}-01-01`,
      'ulusal_egemenlik': `${year}-04-23`,
      'isci_bayrami': `${year}-05-01`,
      'genclik_bayrami': `${year}-05-19`,
      'demokrasi_bayrami': `${year}-07-15`,
      'zafer_bayrami': `${year}-08-30`,
      'cumhuriyet_bayrami': `${year}-10-29`,
      'sevgililer_gunu': `${year}-02-14`,
      'kadinlar_gunu': `${year}-03-08`,
      'ogretmenler_gunu': `${year}-11-24`,
    };
    
    if (fixedDates[dayType]) {
      return new Date(fixedDates[dayType]);
    }
    
    // Anneler günü: Mayıs'ın 2. Pazarı
    if (dayType === 'anneler_gunu') {
      return getNthWeekdayOfMonth(year, 4, 0, 2); // Mayıs, Pazar, 2. hafta
    }
    
    // Babalar günü: Haziran'ın 3. Pazarı
    if (dayType === 'babalar_gunu') {
      return getNthWeekdayOfMonth(year, 5, 0, 3); // Haziran, Pazar, 3. hafta
    }
    
    return null;
  } catch (error) {
    console.error('getSpecialDayDate error:', error);
    return null;
  }
}

/**
 * Ayın N. haftasının belirli gününü bul
 * @param {number} year - Yıl
 * @param {number} month - Ay (0-11)
 * @param {number} dayOfWeek - Haftanın günü (0=Pazar, 1=Pazartesi, ...)
 * @param {number} weekNumber - Hafta numarası (1, 2, 3, ...)
 */
function getNthWeekdayOfMonth(year, month, dayOfWeek, weekNumber) {
  const firstDay = new Date(year, month, 1);
  const firstDayOfWeek = firstDay.getDay();
  
  let dayOffset = dayOfWeek - firstDayOfWeek;
  if (dayOffset < 0) dayOffset += 7;
  
  const targetDay = 1 + dayOffset + (weekNumber - 1) * 7;
  return new Date(year, month, targetDay);
}

/**
 * Recurring schedule için bir sonraki gönderim tarihini hesapla
 * @param {Object} recurrenceConfig - Recurrence konfigürasyonu
 * @param {Date} lastSentDate - Son gönderim tarihi (null ise şu anki tarih kullanılır)
 * @param {Date} endDate - Bitiş tarihi (opsiyonel)
 * @returns {Date|null} Bir sonraki gönderim tarihi
 */
function calculateNextRecurringDate(recurrenceConfig, lastSentDate = null) {
  const { type, interval = 1, weekdays, day_of_month, time, end_date } = recurrenceConfig;
  
  const now = new Date();
  const baseDate = lastSentDate ? new Date(lastSentDate) : now;
  
  // Saat bilgisini parse et
  const [hours, minutes] = (time || '09:00').split(':').map(Number);
  
  let nextDate;
  
  switch (type) {
    case 'daily':
      nextDate = new Date(baseDate);
      nextDate.setDate(nextDate.getDate() + interval);
      nextDate.setHours(hours, minutes, 0, 0);
      
      // Eğer hesaplanan tarih geçmişte kaldıysa, bugünden itibaren hesapla
      while (nextDate <= now) {
        nextDate.setDate(nextDate.getDate() + interval);
      }
      break;
      
    case 'weekly':
      if (!weekdays || weekdays.length === 0) {
        return null;
      }
      
      nextDate = new Date(baseDate);
      nextDate.setHours(hours, minutes, 0, 0);
      
      // Bir sonraki uygun günü bul
      let found = false;
      for (let i = 0; i < 14; i++) { // Max 2 hafta ileriye bak
        nextDate.setDate(nextDate.getDate() + 1);
        if (weekdays.includes(nextDate.getDay()) && nextDate > now) {
          found = true;
          break;
        }
      }
      
      if (!found) return null;
      break;
      
    case 'monthly':
      nextDate = new Date(baseDate);
      nextDate.setMonth(nextDate.getMonth() + 1);
      
      if (day_of_month === 'last') {
        // Ayın son günü
        nextDate = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0);
      } else {
        const targetDay = Math.min(day_of_month, new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate());
        nextDate.setDate(targetDay);
      }
      
      nextDate.setHours(hours, minutes, 0, 0);
      
      // Eğer hesaplanan tarih geçmişte kaldıysa, bir sonraki aya geç
      while (nextDate <= now) {
        nextDate.setMonth(nextDate.getMonth() + 1);
        if (day_of_month === 'last') {
          nextDate = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0);
          nextDate.setHours(hours, minutes, 0, 0);
        }
      }
      break;
      
    default:
      return null;
  }
  
  // End date kontrolü
  if (end_date) {
    const endDateTime = new Date(end_date);
    if (nextDate > endDateTime) {
      return null;
    }
  }
  
  return nextDate;
}

/**
 * Special day schedule için bir sonraki gönderim tarihini hesapla
 * @param {Object} specialDayConfig - Special day konfigürasyonu
 * @param {number} userId - Kullanıcı ID (özel günler kullanıcı bazlı)
 * @returns {Date|null} Bir sonraki gönderim tarihi
 */
async function calculateNextSpecialDayDate(specialDayConfig, userId = null) {
  const { day_type, custom_date, day_offset = 0, time, yearly_repeat = true } = specialDayConfig;
  
  const now = new Date();
  const currentYear = now.getFullYear();
  
  // Saat bilgisini parse et
  const [hours, minutes] = (time || '09:00').split(':').map(Number);
  
  let targetDate;
  
  if (day_type === 'custom') {
    // Özel tarih
    if (!custom_date) return null;
    targetDate = new Date(custom_date);
  } else {
    // Önce bu yılın tarihini kontrol et
    targetDate = await getSpecialDayDate(day_type, currentYear, userId);
    
    if (!targetDate) {
      console.warn(`Special day not found: ${day_type} for year ${currentYear}, userId: ${userId}`);
      return null;
    }
    
    // day_offset uygula
    targetDate = new Date(targetDate);
    targetDate.setDate(targetDate.getDate() + day_offset);
    targetDate.setHours(hours, minutes, 0, 0);
    
    // Eğer tarih geçmişte kaldıysa ve yıllık tekrar aktifse, gelecek yıla bak
    if (targetDate <= now && yearly_repeat) {
      targetDate = await getSpecialDayDate(day_type, currentYear + 1, userId);
      if (targetDate) {
        targetDate = new Date(targetDate);
        targetDate.setDate(targetDate.getDate() + day_offset);
        targetDate.setHours(hours, minutes, 0, 0);
      }
    }
  }
  
  if (!targetDate || targetDate <= now) {
    return null;
  }
  
  return targetDate;
}

/**
 * Template sequence item'dan next_send_date hesapla
 * @param {Object} sequenceItem - Template sequence item
 * @param {Date} lastSentDate - Son gönderim tarihi (opsiyonel)
 * @param {number} userId - Kullanıcı ID (özel günler için)
 * @returns {Date|null} Bir sonraki gönderim tarihi
 */
async function calculateNextSendDate(sequenceItem, lastSentDate = null, userId = null) {
  const { schedule_type, scheduled_date, recurrence_config, special_day_config } = sequenceItem;
  
  switch (schedule_type) {
    case 'custom_date':
      // Tek seferlik tarih
      if (!scheduled_date) return null;
      const customDate = new Date(scheduled_date);
      return customDate > new Date() ? customDate : null;
      
    case 'recurring':
      if (!recurrence_config) return null;
      return calculateNextRecurringDate(recurrence_config, lastSentDate);
      
    case 'special_day':
      if (!special_day_config) return null;
      return await calculateNextSpecialDayDate(special_day_config, userId);
      
    default:
      // Varsayılan olarak scheduled_date kullan
      if (scheduled_date) {
        const date = new Date(scheduled_date);
        return date > new Date() ? date : null;
      }
      return null;
  }
}

/**
 * Kampanya için schedule kayıtlarını oluştur/güncelle
 * @param {number} campaignId - Kampanya ID
 * @param {Array} templateSequence - Template sequence array
 */
async function syncCampaignSchedules(campaignId, templateSequence) {
  try {
    if (!templateSequence || templateSequence.length === 0) {
      // Template sequence boşsa, mevcut schedule'ları sil
      await pool.query('DELETE FROM email_campaign_schedules WHERE campaign_id = $1', [campaignId]);
      return;
    }
    
    // Kampanya bilgisini al (user_id için)
    const campaignResult = await pool.query(
      'SELECT user_id FROM email_campaigns WHERE id = $1',
      [campaignId]
    );
    
    const userId = campaignResult.rows[0]?.user_id || null;
    
    // Mevcut schedule'ları al
    const existingSchedules = await pool.query(
      'SELECT id, sequence_index FROM email_campaign_schedules WHERE campaign_id = $1',
      [campaignId]
    );
    
    const existingIndexes = new Set(existingSchedules.rows.map(r => r.sequence_index));
    const newIndexes = new Set(templateSequence.map((_, i) => i));
    
    // Kaldırılan sequence'ları sil
    for (const row of existingSchedules.rows) {
      if (!newIndexes.has(row.sequence_index)) {
        await pool.query('DELETE FROM email_campaign_schedules WHERE id = $1', [row.id]);
      }
    }
    
    // Her template sequence item için schedule oluştur/güncelle
    for (let i = 0; i < templateSequence.length; i++) {
      const item = templateSequence[i];
      const nextSendDate = await calculateNextSendDate(item, null, userId);
      
      if (existingIndexes.has(i)) {
        // Güncelle
        await pool.query(`
          UPDATE email_campaign_schedules SET
            template_id = $1,
            schedule_type = $2,
            scheduled_date = $3,
            recurrence_config = $4,
            special_day_config = $5,
            next_send_date = $6,
            updated_at = CURRENT_TIMESTAMP
          WHERE campaign_id = $7 AND sequence_index = $8
        `, [
          item.template_id,
          item.schedule_type || 'custom_date',
          item.scheduled_date || null,
          item.recurrence_config ? JSON.stringify(item.recurrence_config) : null,
          item.special_day_config ? JSON.stringify(item.special_day_config) : null,
          nextSendDate,
          campaignId,
          i
        ]);
      } else {
        // Yeni oluştur
        await pool.query(`
          INSERT INTO email_campaign_schedules (
            campaign_id, template_id, sequence_index,
            schedule_type, scheduled_date, recurrence_config, special_day_config,
            next_send_date, user_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          campaignId,
          item.template_id,
          i,
          item.schedule_type || 'custom_date',
          item.scheduled_date || null,
          item.recurrence_config ? JSON.stringify(item.recurrence_config) : null,
          item.special_day_config ? JSON.stringify(item.special_day_config) : null,
          nextSendDate,
          userId
        ]);
      }
    }
    
    console.log(`✅ Campaign ${campaignId} schedules synced (${templateSequence.length} items)`);
  } catch (error) {
    console.error('syncCampaignSchedules error:', error);
    throw error;
  }
}

/**
 * Schedule gönderildikten sonra next_send_date'i güncelle
 * @param {number} scheduleId - Schedule ID
 */
async function updateScheduleAfterSend(scheduleId) {
  try {
    const result = await pool.query(
      'SELECT ecs.*, ec.user_id FROM email_campaign_schedules ecs LEFT JOIN email_campaigns ec ON ecs.campaign_id = ec.id WHERE ecs.id = $1',
      [scheduleId]
    );
    
    if (result.rows.length === 0) return;
    
    const schedule = result.rows[0];
    const userId = schedule.user_id;
    const now = new Date();
    
    let nextSendDate = null;
    
    if (schedule.schedule_type === 'recurring') {
      nextSendDate = calculateNextRecurringDate(schedule.recurrence_config, now);
    } else if (schedule.schedule_type === 'special_day' && schedule.special_day_config?.yearly_repeat) {
      nextSendDate = await calculateNextSpecialDayDate(schedule.special_day_config, userId);
    }
    // custom_date için next_send_date null kalır (tek seferlik)
    
    await pool.query(`
      UPDATE email_campaign_schedules SET
        last_sent_date = $1,
        send_count = send_count + 1,
        next_send_date = $2,
        is_active = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
    `, [
      now,
      nextSendDate,
      nextSendDate !== null, // Bir sonraki tarih yoksa deaktive et
      scheduleId
    ]);
    
    console.log(`✅ Schedule ${scheduleId} updated after send, next: ${nextSendDate || 'none'}`);
  } catch (error) {
    console.error('updateScheduleAfterSend error:', error);
  }
}

/**
 * Gönderilmesi gereken schedule'ları getir
 * @param {number} toleranceMinutes - Tolerans (dakika)
 * @returns {Array} Schedule listesi
 */
async function getPendingSchedules(toleranceMinutes = 5) {
  try {
    const result = await pool.query(`
      SELECT 
        s.*,
        c.name as campaign_name,
        c.target_contact_ids,
        c.status as campaign_status,
        c.stop_on_reply,
        t.name as template_name,
        t.subject,
        t.body_html,
        t.body_text,
        t.from_name,
        t.from_email,
        t.cc_emails,
        t.bcc_emails,
        t.attachments
      FROM email_campaign_schedules s
      JOIN email_campaigns c ON s.campaign_id = c.id
      JOIN email_templates t ON s.template_id = t.id
      WHERE s.is_active = true
        AND s.next_send_date IS NOT NULL
        AND s.next_send_date <= NOW() + INTERVAL '${toleranceMinutes} minutes'
        AND c.status IN ('active', 'scheduled', 'running')
    `);
    
    return result.rows;
  } catch (error) {
    console.error('getPendingSchedules error:', error);
    return [];
  }
}

module.exports = {
  getSpecialDayDate,
  getNthWeekdayOfMonth,
  calculateNextRecurringDate,
  calculateNextSpecialDayDate,
  calculateNextSendDate,
  syncCampaignSchedules,
  updateScheduleAfterSend,
  getPendingSchedules
};

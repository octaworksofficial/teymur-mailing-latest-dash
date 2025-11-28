# n8n Email Tracking ve Yanıt Kontrolü Kurulumu

## 📋 Genel Bakış

Backend artık her email gönderiminde **tracking bilgilerini** n8n'e gönderiyor:

```json
{
  "to": "deniz@example.com",
  "subject": "Kampanya Maili",
  "html_body": "<html>...</html>",
  "sender_name": "Teymur Tekstil",
  "tracking_info": {
    "tracking_id": "550e8400-e29b-41d4-a716-446655440000",
    "campaign_id": 123,
    "contact_id": 456
  }
}
```

---

## 🔧 n8n Workflow Kurulumu

### 1️⃣ EMAIL GÖNDERME WORKFLOW'U

#### A. Webhook Trigger Node
- **Method:** POST
- **Path:** `/webhook/send-email`
- **Response Mode:** When Last Node Finishes

#### B. Function Node - Tracking Bilgilerini Hazırla
```javascript
// Gelen veriyi al
const to = $json.to;
const subject = $json.subject;
const htmlBody = $json.html_body;
const senderName = $json.sender_name || 'Teymur Tekstil';
const trackingInfo = $json.tracking_info || {};

// Tracking ID'yi Message-ID formatında hazırla
const messageId = trackingInfo.tracking_id 
  ? `<${trackingInfo.tracking_id}@teymurtekstil.com>`
  : `<${Date.now()}@teymurtekstil.com>`;

return {
  to,
  subject,
  htmlBody,
  senderName,
  messageId,
  trackingId: trackingInfo.tracking_id,
  campaignId: trackingInfo.campaign_id,
  contactId: trackingInfo.contact_id,
  // CC ve BCC
  cc: $json.cc || '',
  bcc: $json.bcc || ''
};
```

#### C. Gmail Node / SMTP Node - Email Gönder

**Gmail kullanıyorsanız:**
- **To Email:** `={{$json.to}}`
- **Subject:** `={{$json.subject}}`
- **Message Type:** HTML
- **Message:** `={{$json.htmlBody}}`
- **From Name:** `={{$json.senderName}}`
- **Additional Fields > CC:** `={{$json.cc}}`
- **Additional Fields > BCC:** `={{$json.bcc}}`
- **Additional Fields > Custom Headers:**
  ```json
  {
    "Message-ID": "={{$json.messageId}}",
    "X-Campaign-Tracking-ID": "={{$json.trackingId}}",
    "X-Campaign-ID": "={{$json.campaignId}}",
    "X-Contact-ID": "={{$json.contactId}}"
  }
  ```

**SMTP kullanıyorsanız:**
```javascript
// Email Options
{
  "from": "info@teymurtekstil.com",
  "fromName": "={{$json.senderName}}",
  "to": "={{$json.to}}",
  "subject": "={{$json.subject}}",
  "html": "={{$json.htmlBody}}",
  "cc": "={{$json.cc}}",
  "bcc": "={{$json.bcc}}",
  "headers": {
    "Message-ID": "={{$json.messageId}}",
    "X-Campaign-Tracking-ID": "={{$json.trackingId}}",
    "X-Campaign-ID": "={{$json.campaignId}}",
    "X-Contact-ID": "={{$json.contactId}}"
  }
}
```

---

### 2️⃣ EMAIL YANIT KONTROLÜ WORKFLOW'U

#### A. Email Trigger Node (IMAP / Gmail)
- **Gmail Account:** Kendi hesabınız
- **Event:** Message Received
- **Options > Simple:** False (tüm header bilgilerini almak için)

#### B. Function Node - Tracking ID'yi Bul
```javascript
// Email header'larından tracking bilgilerini çıkar
const headers = $json.headers || {};
const from = $json.from?.value?.[0]?.address || $json.from;
const subject = $json.subject || '';
const body = $json.text || $json.html || '';
const receivedDate = $json.date || new Date();

let trackingId = null;
let campaignId = null;
let contactId = null;

// Method 1: In-Reply-To header'ından (en güvenilir)
const inReplyTo = headers['in-reply-to'];
if (inReplyTo) {
  const match = inReplyTo.match(/<([a-f0-9-]{36})@/);
  if (match) trackingId = match[1];
}

// Method 2: References header'ından
if (!trackingId) {
  const references = headers['references'];
  if (references) {
    const match = references.match(/([a-f0-9-]{36})@/);
    if (match) trackingId = match[1];
  }
}

// Method 3: Custom header'lardan (ilk email'de set ettiğimiz)
if (!trackingId && headers['x-campaign-tracking-id']) {
  trackingId = headers['x-campaign-tracking-id'];
}

if (headers['x-campaign-id']) {
  campaignId = parseInt(headers['x-campaign-id']);
}

if (headers['x-contact-id']) {
  contactId = parseInt(headers['x-contact-id']);
}

// Tracking ID bulunamadıysa bu email bizim kampanyamıza yanıt değil
if (!trackingId) {
  console.log('⚠️ Tracking ID bulunamadı, email atlanıyor');
  return null; // Bu email'i işleme
}

return {
  trackingId,
  campaignId,
  contactId,
  from,
  subject,
  body,
  receivedDate: new Date(receivedDate).toISOString()
};
```

#### C. IF Node - Tracking ID var mı?
- **Condition:** `={{$json.trackingId}} is not empty`

#### D. HTTP Request Node - Backend'e Yanıt Bildir
- **Method:** POST
- **URL:** `https://your-backend.com/api/campaigns/email-reply`
- **Authentication:** None (veya Bearer Token)
- **Body:**
```json
{
  "tracking_id": "={{$json.trackingId}}",
  "campaign_id": "={{$json.campaignId}}",
  "contact_id": "={{$json.contactId}}",
  "from": "={{$json.from}}",
  "subject": "={{$json.subject}}",
  "body": "={{$json.body}}",
  "replied_at": "={{$json.receivedDate}}"
}
```

---

## 🔧 Backend Endpoint (Zaten Mevcut Değilse Ekleyin)

`server/routes/campaigns.js` dosyasına ekleyin:

```javascript
// Email Yanıt Webhook - n8n'den çağrılır
router.post('/email-reply', async (req, res) => {
  const { tracking_id, campaign_id, contact_id, from, subject, body, replied_at } = req.body;
  
  try {
    console.log(`📬 Email yanıtı alındı - Tracking ID: ${tracking_id}`);
    
    // tracking_id ile campaign_sends kaydını bul ve güncelle
    const result = await pool.query(
      `UPDATE campaign_sends 
       SET is_replied = true, 
           replied_at = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE tracking_id = $2
       RETURNING id, campaign_id, contact_id, sequence_index`,
      [replied_at || new Date(), tracking_id]
    );
    
    if (result.rows.length === 0) {
      console.log(`⚠️ Tracking ID bulunamadı: ${tracking_id}`);
      return res.status(404).json({ 
        success: false, 
        message: 'Tracking ID bulunamadı' 
      });
    }
    
    const sendRecord = result.rows[0];
    
    console.log(`✅ Email yanıtı kaydedildi:`, {
      campaignId: sendRecord.campaign_id,
      contactId: sendRecord.contact_id,
      sequenceIndex: sendRecord.sequence_index,
      from
    });
    
    // Contact'ın engagement score'unu artır (yanıt = +5 puan)
    await pool.query(
      `UPDATE contacts 
       SET engagement_score = COALESCE(engagement_score, 0) + 5,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [sendRecord.contact_id]
    );
    
    // Kampanya istatistiklerini güncelle
    await pool.query(
      `UPDATE email_campaigns 
       SET total_replied = COALESCE(total_replied, 0) + 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [sendRecord.campaign_id]
    );
    
    res.json({ 
      success: true, 
      campaign_id: sendRecord.campaign_id, 
      contact_id: sendRecord.contact_id,
      message: 'Email yanıtı başarıyla kaydedildi' 
    });
    
  } catch (error) {
    console.error('❌ Email yanıt kaydetme hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});
```

---

## 📊 Test Senaryosu

### 1. Email Gönderme Testi
```bash
curl -X POST http://localhost:3001/api/campaigns/test-send \
  -H "Content-Type: application/json" \
  -d '{
    "contactId": 1,
    "templateId": 1,
    "campaignId": 1
  }'
```

### 2. Gönderilen Email'e Yanıt Verin
- Gmail/Outlook'tan yanıt verin
- n8n'deki email trigger otomatik yakalayacak

### 3. Database'de Kontrol
```sql
-- Yanıt kaydedildi mi?
SELECT * FROM campaign_sends 
WHERE is_replied = true 
ORDER BY replied_at DESC 
LIMIT 10;

-- Engagement score arttı mı?
SELECT id, email, first_name, last_name, engagement_score 
FROM contacts 
WHERE engagement_score > 0 
ORDER BY engagement_score DESC;

-- Kampanya istatistikleri
SELECT id, name, total_sent, total_replied 
FROM email_campaigns 
WHERE total_replied > 0;
```

---

## 🎯 Sonuç

✅ Her email **benzersiz tracking_id** ile gönderilir  
✅ Tracking bilgileri **email header'larına** eklenir  
✅ Yanıt geldiğinde **otomatik tespit** edilir  
✅ **Doğru kampanya ve contact** ile eşleştirilir  
✅ **Birden fazla kampanya** olsa bile karışıklık olmaz  
✅ **stop_on_reply** özelliği düzgün çalışır  

---

## 🔗 İlgili Dosyalar

- Backend Email Gönderme: `server/services/emailScheduler.js`
- Email Tracking Utils: `server/utils/emailTracking.js`
- Tracking Routes: `server/routes/tracking.js`
- Campaign Routes: `server/routes/campaigns.js`
- Database Schema: `create-email-campaigns-table.sql`

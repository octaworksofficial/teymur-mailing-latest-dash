# 📊 Email Tracking Sistemi

## Genel Bakış

Bu sistem, gönderilen her email için **açılma** ve **link tıklama** takibini otomatik olarak yapar. Her email gönderilirken:

1. ✅ Benzersiz bir `tracking_id` (UUID) oluşturulur
2. ✅ Email HTML'ine **1x1 invisible tracking pixel** eklenir
3. ✅ Tüm HTTP(S) linkler **tracking URL'leri** ile wrap edilir
4. ✅ Email açılınca ve linkler tıklanınca veritabanına kaydedilir

---

## 🎯 Özellikler

### 1. Email Açılma Takibi (Open Tracking)
- Email body'sine 1x1 invisible pixel eklenir
- Email açıldığında pixel yüklenir
- `campaign_sends.is_opened = true` olur
- `campaign_sends.opened_at` timestamp kaydedilir
- Her açılış `email_tracking_events` tablosuna kaydedilir

### 2. Link Tıklama Takibi (Click Tracking)
- Tüm `<a href="...">` linkleri otomatik wrap edilir
- Tıklama kaydedilir ve orijinal URL'e yönlendirme yapılır
- `campaign_sends.is_clicked = true` olur
- `campaign_sends.clicked_at` timestamp kaydedilir
- Her tıklama `email_tracking_events` tablosuna kaydedilir

### 3. Detaylı Event Logging
Her tracking event'i için kaydedilir:
- IP adresi
- User Agent (Browser/Email client)
- Timestamp
- Tıklanan link URL'i (click event'lerinde)

---

## 📁 Dosya Yapısı

```
server/
├── routes/
│   └── tracking.js              # Tracking endpoints
├── utils/
│   └── emailTracking.js         # HTML processing utilities
├── services/
│   └── emailScheduler.js        # Email gönderim (tracking entegrasyonu)
└── migrations/
    └── create_email_tracking.sql # Database schema
```

---

## 🔌 API Endpoints

### 1. Email Açılma Tracking
```
GET /api/tracking/open/:trackingId
```
- 1x1 transparent GIF döner
- Email açılmasını kaydeder
- `is_opened` ve `opened_at` güncellenir

**Örnek:**
```html
<img src="http://localhost:3001/api/tracking/open/a1b2c3d4-..." width="1" height="1" />
```

### 2. Link Tıklama Tracking
```
GET /api/tracking/click/:trackingId?url=https://example.com
```
- Tıklamayı kaydeder
- Orijinal URL'e redirect yapar
- `is_clicked` ve `clicked_at` güncellenir

**Örnek:**
```html
<a href="http://localhost:3001/api/tracking/click/a1b2c3d4-...?url=https%3A%2F%2Fexample.com">
  Click Here
</a>
```

### 3. Tracking Events Listesi
```
GET /api/tracking/events/:campaignSendId
```
- Belirli bir email için tüm tracking olaylarını getirir
- Açılma ve tıklama geçmişi

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "event_type": "open",
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "created_at": "2025-11-24T10:30:00Z"
    },
    {
      "id": 2,
      "event_type": "click",
      "link_url": "https://example.com",
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "created_at": "2025-11-24T10:31:00Z"
    }
  ],
  "total": 2
}
```

---

## 🗄️ Database Schema

### `email_tracking_events` Tablosu
```sql
CREATE TABLE email_tracking_events (
    id SERIAL PRIMARY KEY,
    campaign_send_id INTEGER NOT NULL REFERENCES campaign_sends(id),
    event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('open', 'click')),
    link_url TEXT,           -- Sadece click event'lerinde
    ip_address VARCHAR(45),  -- IPv4 veya IPv6
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### `campaign_sends` Tablosuna Eklenenler
```sql
ALTER TABLE campaign_sends 
ADD COLUMN tracking_id UUID DEFAULT gen_random_uuid() UNIQUE;
```

---

## 🔧 Nasıl Çalışır?

### Email Gönderim Akışı

```javascript
// 1. Campaign send kaydı oluştur (tracking_id al)
const sendRecord = await logEmailSent(...);
const trackingId = sendRecord.tracking_id;

// 2. HTML'i personalize et
let html = replaceTemplateVariables(template.body_html, contact);

// 3. Tracking ekle (pixel + link wrapping)
html = addTrackingToEmail(html, trackingId);

// 4. Email gönder
await sendEmail(contact.email, subject, html, contact);
```

### Tracking HTML Processing

```javascript
// emailTracking.js
function addTrackingToEmail(html, trackingId) {
  // 1. Tracking pixel ekle
  html = addTrackingPixel(html, trackingId);
  
  // 2. Linkleri wrap et
  html = addLinkTracking(html, trackingId);
  
  return html;
}
```

### Link Wrapping Mantığı

```javascript
// <a href="https://example.com">Link</a>
// ↓
// <a href="http://localhost:3001/api/tracking/click/{trackingId}?url=https%3A%2F%2Fexample.com">Link</a>

// ANCAK bu linkler wrap EDİLMEZ:
// - mailto:email@example.com
// - tel:+905551234567
// - #anchor-links
// - javascript:void(0)
```

---

## 🧪 Test

### Manuel Test

```bash
# Test script'i çalıştır
node server/test-tracking.js
```

Bu script:
- ✅ Tracking URL'lerini gösterir
- ✅ HTML processing'i test eder
- ✅ Örnek output gösterir

### Gerçek Email Testi

1. Bir kampanya oluştur ve zamanla
2. Email gönderildiğinde tracking_id oluşur
3. Email'i aç → `GET /api/tracking/open/{id}` çağrılır
4. Bir link tıkla → `GET /api/tracking/click/{id}?url=...` çağrılır
5. Database'de kontrol et:
   ```sql
   SELECT * FROM email_tracking_events WHERE campaign_send_id = 123;
   SELECT is_opened, opened_at, is_clicked, clicked_at 
   FROM campaign_sends WHERE id = 123;
   ```

---

## 📊 Dashboard'da Görüntüleme

### Contacts Sayfası
- "Gönderilen" sütunundaki sayıya tıkla
- Modal açılır ve email geçmişi gösterilir
- Her email için durum: Açıldı ✓, Tıklandı ✓, Yanıtlandı ✓

### Sent Emails Modal
```tsx
// Status rendering
{record.is_failed && <Tag color="red">Başarısız</Tag>}
{record.is_replied && <Tag color="purple">Cevaplandı</Tag>}
{record.is_clicked && <Tag color="orange">Tıklandı</Tag>}
{record.is_opened && <Tag color="blue">Açıldı</Tag>}
{record.is_sent && <Tag color="green">Gönderildi</Tag>}
```

---

## ⚙️ Konfigürasyon

### Environment Variables

```bash
# .env
BACKEND_URL=http://localhost:3001  # Production'da gerçek domain
```

### Production Deployment

1. `BACKEND_URL`'i production domain ile değiştir
2. HTTPS kullan (tracking linkleri için önemli)
3. Rate limiting ekle (abuse prevention)
4. IP logging için privacy policy güncelle

---

## 🔒 Güvenlik ve Privacy

### Yapılanlar
- ✅ UUID kullanımı (tahmin edilemez tracking ID'ler)
- ✅ Hatalı tracking ID'lerde yine de pixel/redirect (email client'ı hata vermesin)
- ✅ `mailto:` ve `tel:` linklerini koruma

### Öneriler
- [ ] GDPR compliance için privacy policy ekle
- [ ] Tracking opt-out mekanizması
- [ ] IP adresi hashing (privacy)
- [ ] Rate limiting (abuse prevention)
- [ ] Bot detection (gerçek açılma vs bot)

---

## 📈 Analytics ve Raporlama

### Mevcut Metrikler
- Total emails sent
- Total opened (unique opens)
- Total clicked (unique clicks)
- Open rate: `(opened / sent) * 100`
- Click rate: `(clicked / sent) * 100`
- Click-to-open rate: `(clicked / opened) * 100`

### Gelecek İyileştirmeler
- [ ] Multiple opens tracking (kaç kez açıldı)
- [ ] Multiple clicks per link
- [ ] Time-to-open analytics
- [ ] Device/client breakdown (mobile vs desktop)
- [ ] Geographic tracking (IP → location)
- [ ] Link popularity (hangi link daha çok tıklandı)

---

## 🐛 Troubleshooting

### Email açılma kaydedilmiyor
1. Email client'ı resimleri gösteriyor mu?
2. Tracking pixel HTML'de var mı?
3. Network tab'da `/api/tracking/open/...` isteği var mı?
4. Database'de `is_opened = false` mu?

### Link tıklama çalışmıyor
1. Link URL'si doğru wrap edilmiş mi?
2. Redirect çalışıyor mu?
3. Browser console'da hata var mı?
4. Database'de tracking event kaydı oluştu mu?

### Database hatası
```sql
-- tracking_id var mı?
SELECT tracking_id FROM campaign_sends LIMIT 1;

-- email_tracking_events tablosu var mı?
SELECT * FROM email_tracking_events LIMIT 1;
```

---

## 📝 Notlar

- **Email Client Desteği**: Bazı email client'ları (Outlook, Gmail) resimleri otomatik yüklemeyebilir
- **Bot Protection**: Email scanners ve preview'ler false positive oluşturabilir
- **Privacy**: Tracking pixel kullanımı privacy policy'de belirtilmeli
- **Performance**: Her tracking event INSERT işlemi → index'ler önemli

---

## 🎉 Özet

Email tracking sistemi artık tamamen otomatik çalışıyor:

1. ✅ Her email gönderiminde benzersiz tracking_id oluşur
2. ✅ HTML'e tracking pixel ve link wrapping otomatik eklenir
3. ✅ Email açılması ve link tıklamaları kaydedilir
4. ✅ Dashboard'da real-time tracking durumu gösterilir
5. ✅ Detaylı analytics için `email_tracking_events` tablosu

**Test için:** Bir kampanya oluştur, zamanla, gönder ve email'i aç! 📧✨

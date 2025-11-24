# Email Otomasyon - Backend API Kullanım Kılavuzu

## 🚀 Hızlı Başlangıç

### 1. Veritabanı Kurulumu

PostgreSQL veritabanınızda `contacts` tablosunu oluşturun:

```sql
-- Müşteriler/Kişiler tablosu
CREATE TABLE contacts (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  company VARCHAR(150),
  position VARCHAR(100),
  
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced', 'complained')),
  subscription_status VARCHAR(20) DEFAULT 'subscribed' CHECK (subscription_status IN ('subscribed', 'unsubscribed', 'pending')),
  source VARCHAR(50),
  
  tags TEXT[],
  custom_fields JSONB,
  
  total_emails_sent INTEGER DEFAULT 0,
  total_emails_opened INTEGER DEFAULT 0,
  total_emails_clicked INTEGER DEFAULT 0,
  total_emails_bounced INTEGER DEFAULT 0,
  last_email_sent_at TIMESTAMP,
  last_email_opened_at TIMESTAMP,
  last_email_clicked_at TIMESTAMP,
  
  engagement_score DECIMAL(5,2) DEFAULT 0.00,
  
  subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  unsubscribed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Environment Variables

`.env` dosyasını oluşturun (`.env.example` dosyasını kopyalayın):

```bash
cp .env.example .env
```

Veritabanı bilgilerinizi güncelleyin:

```env
DATABASE_URL=postgresql://postgres:password@host:port/database
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:8000,http://localhost:8002
```

### 3. Sunucuları Başlatın

```bash
# Backend API (Port 3001)
npm run server

# Frontend (Port 8000 veya 8002)
npm start
```

## 📡 API Endpoints

### Base URL
```
http://localhost:3001/api
```

### 1. Müşterileri Listele
```http
GET /api/contacts
```

**Query Parametreleri:**
- `page` (number): Sayfa numarası (default: 1)
- `pageSize` (number): Sayfa başına kayıt (default: 10)
- `email` (string): Email filtresi
- `status` (string): Durum filtresi (active, unsubscribed, bounced, complained)
- `subscription_status` (string): Abonelik durumu (subscribed, unsubscribed, pending)
- `tags` (array): Etiket filtresi
- `search` (string): Genel arama (email, ad, soyad, şirket)

**Örnek:**
```bash
curl "http://localhost:3001/api/contacts?page=1&pageSize=10&status=active"
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "total": 100,
  "page": 1,
  "pageSize": 10
}
```

### 2. Tek Müşteri Getir
```http
GET /api/contacts/:id
```

**Örnek:**
```bash
curl http://localhost:3001/api/contacts/1
```

### 3. Yeni Müşteri Ekle
```http
POST /api/contacts
```

**Body:**
```json
{
  "email": "ornek@email.com",
  "first_name": "Ahmet",
  "last_name": "Yılmaz",
  "company": "Tech Corp",
  "position": "CTO",
  "phone": "+90 555 123 45 67",
  "status": "active",
  "subscription_status": "subscribed",
  "source": "website",
  "tags": ["vip", "teknoloji"],
  "custom_fields": {
    "sehir": "Istanbul",
    "sektor": "Yazılım"
  }
}
```

**Örnek:**
```bash
curl -X POST http://localhost:3001/api/contacts \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","first_name":"Test","last_name":"User"}'
```

### 4. Müşteri Güncelle
```http
PUT /api/contacts/:id
```

**Body:** (Sadece güncellenecek alanlar gönderilir)
```json
{
  "status": "unsubscribed",
  "tags": ["eski", "pasif"]
}
```

**Örnek:**
```bash
curl -X PUT http://localhost:3001/api/contacts/1 \
  -H "Content-Type: application/json" \
  -d '{"status":"unsubscribed"}'
```

### 5. Müşteri Sil
```http
DELETE /api/contacts/:id
```

**Örnek:**
```bash
curl -X DELETE http://localhost:3001/api/contacts/1
```

### 6. Toplu Silme
```http
POST /api/contacts/bulk-delete
```

**Body:**
```json
{
  "ids": [1, 2, 3, 4, 5]
}
```

### 7. İstatistikler
```http
GET /api/contacts/stats/summary
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_contacts": 100,
    "active_contacts": 85,
    "subscribed_contacts": 90,
    "new_this_month": 15
  }
}
```

## 🎯 Frontend Kullanımı

### Contacts Sayfası

1. **Müşteri Listesi**: Tablo görünümünde tüm müşteriler
2. **Filtreleme**: Email, durum, abonelik durumu, arama
3. **Ekleme**: "Kişi Ekle" butonu ile modal form
4. **Düzenleme**: Her satırda "Düzenle" butonu
5. **Silme**: Her satırda "Sil" butonu (onay ile)
6. **Pagination**: Sayfalama ve sayfa başına kayıt sayısı

### Custom Fields Kullanımı

Custom fields JSONB formatında saklanır ve her müşteri için farklı alanlar içerebilir:

```javascript
// Frontend'de custom fields kullanımı
const customFields = {
  sehir: "Istanbul",
  sektor: "E-ticaret",
  son_siparis_tarihi: "2024-11-15",
  toplam_harcama: 15420
};

// API'ye gönderme
await createContact({
  email: "musteri@example.com",
  first_name: "Müşteri",
  custom_fields: customFields
});
```

### Tags Kullanımı

Tags string array olarak saklanır:

```javascript
// Virgülle ayrılmış string'den array'e
const tags = "VIP, Yeni, Aktif".split(',').map(t => t.trim());
// ["VIP", "Yeni", "Aktif"]

// API'ye gönderme
await createContact({
  email: "musteri@example.com",
  tags: tags
});
```

## 🔧 Geliştirme İpuçları

### Veritabanı Sorguları

**Custom fields ile arama:**
```sql
-- Belirli bir custom field'a göre arama
SELECT * FROM contacts 
WHERE custom_fields->>'sehir' = 'Istanbul';

-- Sayısal alanda koşul
SELECT * FROM contacts 
WHERE (custom_fields->>'toplam_harcama')::numeric > 10000;
```

**Tag ile arama:**
```sql
-- Belirli bir tag içeren kayıtlar
SELECT * FROM contacts 
WHERE tags @> ARRAY['vip'];

-- Birden fazla tag'den herhangi birini içerenler
SELECT * FROM contacts 
WHERE tags && ARRAY['vip', 'aktif'];
```

### Debug

Backend loglarını görmek için:
```bash
tail -f server.log
```

### Port Değiştirme

`.env` dosyasında:
```env
PORT=3002  # Backend için farklı port
```

## 🚨 Sorun Giderme

### CORS Hatası
`.env` dosyasında frontend URL'nizi ekleyin:
```env
CORS_ORIGIN=http://localhost:8000,http://localhost:8002,http://localhost:3000
```

### Veritabanı Bağlantı Hatası
- Railway veritabanınızın çalıştığından emin olun
- `.env` dosyasındaki `DATABASE_URL` doğru mu kontrol edin
- SSL bağlantısı için `ssl: { rejectUnauthorized: false }` ayarı yapılmış

### Frontend API Hatası
- Backend server'ın çalıştığından emin olun (`npm run server`)
- `src/services/contacts.ts` dosyasındaki `API_BASE_URL` doğru mu kontrol edin

## 📚 Sonraki Adımlar

1. **Email Templates**: Email şablonları tablosu ve CRUD işlemleri
2. **Campaigns**: Kampanya yönetimi tablosu ve API'ları
3. **n8n Entegrasyonu**: Workflow automation
4. **Email Sending**: SMTP veya email servis entegrasyonu
5. **Analytics**: Detaylı istatistikler ve raporlama
6. **Import/Export**: CSV import/export özellikleri

## 🎉 Tebrikler!

Email otomasyon sisteminizin backend API'si hazır! Artık:
- ✅ PostgreSQL veritabanına bağlı
- ✅ CRUD işlemleri çalışıyor
- ✅ Filtreleme ve arama aktif
- ✅ Frontend entegrasyonu tamamlandı
- ✅ Custom fields ve tags destekleniyor

# 📊 Dashboard API Endpoints Documentation

## Genel Bakış

Dashboard sayfası için gerekli API endpoint'leri ve beklenen response formatları.

## 📡 API Endpoints

### 1. Dashboard Tüm Veriler (Önerilen)
**Endpoint:** `GET /api/dashboard`

**Açıklama:** Tüm dashboard verilerini tek seferde döner. Performans için önerilir.

**Response:**
```json
{
  "data": {
    "stats": {
      "totalEmailsSent": 12458,
      "totalEmailsSentChange": 15.3,
      "openRate": 68.5,
      "openRateChange": 2.1,
      "clickRate": 24.7,
      "clickRateChange": -1.2,
      "replyRate": 8.3,
      "replyRateChange": -0.5,
      "activeCampaigns": 5,
      "totalContacts": 8456,
      "totalTemplates": 23
    },
    "weeklyEmails": [
      { "date": "Pzt", "value": 850 },
      { "date": "Sal", "value": 1200 },
      { "date": "Çar", "value": 950 },
      { "date": "Per", "value": 1400 },
      { "date": "Cum", "value": 1100 },
      { "date": "Cmt", "value": 600 },
      { "date": "Paz", "value": 450 }
    ],
    "activeCampaigns": [
      {
        "id": 1,
        "name": "Welcome Series",
        "status": "running",
        "sent": 1250,
        "opened": 875,
        "clicked": 234,
        "openRate": "70%"
      },
      {
        "id": 2,
        "name": "Product Launch",
        "status": "scheduled",
        "sent": 0,
        "opened": 0,
        "clicked": 0,
        "openRate": "-"
      }
    ]
  }
}
```

---

### 2. Dashboard İstatistikleri (Alternatif)
**Endpoint:** `GET /api/dashboard/stats`

**Response:**
```json
{
  "data": {
    "totalEmailsSent": 12458,
    "totalEmailsSentChange": 15.3,
    "openRate": 68.5,
    "openRateChange": 2.1,
    "clickRate": 24.7,
    "clickRateChange": -1.2,
    "replyRate": 8.3,
    "replyRateChange": -0.5,
    "activeCampaigns": 5,
    "totalContacts": 8456,
    "totalTemplates": 23
  }
}
```

**Alan Açıklamaları:**
- `totalEmailsSent`: Son 7 gündeki toplam gönderilen email sayısı
- `totalEmailsSentChange`: Bir önceki 7 günle karşılaştırıldığında değişim yüzdesi
- `openRate`: Açılma oranı (%)
- `openRateChange`: Açılma oranındaki değişim
- `clickRate`: Tıklama oranı (%)
- `clickRateChange`: Tıklama oranındaki değişim
- `replyRate`: Yanıt oranı (%)
- `replyRateChange`: Yanıt oranındaki değişim
- `activeCampaigns`: Aktif kampanya sayısı
- `totalContacts`: Toplam kişi sayısı
- `totalTemplates`: Toplam şablon sayısı

---

### 3. Haftalık Email Verileri (Alternatif)
**Endpoint:** `GET /api/dashboard/weekly-emails`

**Response:**
```json
{
  "data": [
    { "date": "Pzt", "value": 850 },
    { "date": "Sal", "value": 1200 },
    { "date": "Çar", "value": 950 },
    { "date": "Per", "value": 1400 },
    { "date": "Cum", "value": 1100 },
    { "date": "Cmt", "value": 600 },
    { "date": "Paz", "value": 450 }
  ]
}
```

**Alan Açıklamaları:**
- `date`: Gün adı (Pzt, Sal, Çar, Per, Cum, Cmt, Paz)
- `value`: O gün gönderilen email sayısı

---

### 4. Aktif Kampanyalar (Alternatif)
**Endpoint:** `GET /api/dashboard/active-campaigns`

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Welcome Series",
      "status": "running",
      "sent": 1250,
      "opened": 875,
      "clicked": 234,
      "openRate": "70%"
    },
    {
      "id": 2,
      "name": "Product Launch", 
      "status": "scheduled",
      "sent": 0,
      "opened": 0,
      "clicked": 0,
      "openRate": "-"
    },
    {
      "id": 3,
      "name": "Re-engagement",
      "status": "running",
      "sent": 2340,
      "opened": 1450,
      "clicked": 567,
      "openRate": "62%"
    }
  ]
}
```

**Alan Açıklamaları:**
- `id`: Kampanya ID'si
- `name`: Kampanya adı
- `status`: Kampanya durumu
  - `running`: Çalışıyor
  - `scheduled`: Zamanlanmış
  - `paused`: Duraklatılmış
  - `completed`: Tamamlanmış
- `sent`: Gönderilen email sayısı
- `opened`: Açılan email sayısı
- `clicked`: Tıklanan email sayısı
- `openRate`: Açılma oranı (%)

---

## 🔧 Mevcut Endpoint'lerle Entegrasyon

Frontend, aşağıdaki mevcut endpoint'leri de kullanabilir:

### Kişi İstatistikleri
**Endpoint:** `GET /api/contacts/stats/summary`

**Kullanılan Alanlar:**
```typescript
{
  data: {
    total_contacts: number  // Toplam kişi sayısı için
  }
}
```

### Kampanya İstatistikleri
**Endpoint:** `GET /api/campaigns/stats/summary`

**Kullanılan Alanlar:**
```typescript
{
  data: {
    summary: {
      total_campaigns: number  // Toplam kampanya sayısı için
    }
  }
}
```

### Şablon İstatistikleri
**Endpoint:** `GET /api/templates/stats/summary`

**Kullanılan Alanlar:**
```typescript
{
  data: {
    summary: {
      total_templates: number  // Toplam şablon sayısı için
    }
  }
}
```

---

## 💡 Öneriler

### Performans
1. **Tek Endpoint Kullanın**: `/api/dashboard` endpoint'ini kullanmak, 3-4 ayrı request yerine tek request ile tüm verileri getirir.
2. **Cache**: Dashboard verilerini 5-10 dakika cache'leyin.
3. **Pagination**: Aktif kampanyalar tablosu için sayfalama ekleyin (şu an ilk 10 kampanya gösteriliyor).

### Veri Kalitesi
1. **Gerçek Zamanlı**: İstatistikler mümkün olduğunca gerçek zamanlı olmalı.
2. **Tarihi Karşılaştırma**: Değişim yüzdeleri için son 7 gün vs önceki 7 gün karşılaştırması yapın.
3. **Null Kontrolü**: Veri yoksa `0` veya `"-"` döndürün.

### Hata Yönetimi
```typescript
// Frontend otomatik olarak şu durumları yönetir:
// 1. API hatası: Kullanıcıya hata mesajı gösterir
// 2. Veri yoksa: Fallback olarak 0 değerleri gösterir
// 3. Loading: Spin komponenti ile yükleme animasyonu
```

---

## 🧪 Test İçin Mock Data

Backend hazır değilse, mock server'da şu response'u kullanabilirsiniz:

```javascript
// mock/dashboard.ts
export default {
  'GET /api/dashboard': {
    data: {
      stats: {
        totalEmailsSent: 12458,
        totalEmailsSentChange: 15.3,
        openRate: 68.5,
        openRateChange: 2.1,
        clickRate: 24.7,
        clickRateChange: -1.2,
        replyRate: 8.3,
        replyRateChange: -0.5,
        activeCampaigns: 5,
        totalContacts: 8456,
        totalTemplates: 23
      },
      weeklyEmails: [
        { date: 'Pzt', value: 850 },
        { date: 'Sal', value: 1200 },
        { date: 'Çar', value: 950 },
        { date: 'Per', value: 1400 },
        { date: 'Cum', value: 1100 },
        { date: 'Cmt', value: 600 },
        { date: 'Paz', value: 450 }
      ],
      activeCampaigns: [
        {
          id: 1,
          name: 'Welcome Series',
          status: 'running',
          sent: 1250,
          opened: 875,
          clicked: 234,
          openRate: '70%'
        },
        {
          id: 2,
          name: 'Product Launch',
          status: 'scheduled',
          sent: 0,
          opened: 0,
          clicked: 0,
          openRate: '-'
        },
        {
          id: 3,
          name: 'Re-engagement',
          status: 'running',
          sent: 2340,
          opened: 1450,
          clicked: 567,
          openRate: '62%'
        }
      ]
    }
  }
};
```

---

## 📝 TypeScript Interface'ler

Frontend'de kullanılan interface'ler:

```typescript
export interface DashboardStats {
  totalEmailsSent: number;
  totalEmailsSentChange: number;
  openRate: number;
  openRateChange: number;
  clickRate: number;
  clickRateChange: number;
  replyRate: number;
  replyRateChange: number;
  activeCampaigns: number;
  totalContacts: number;
  totalTemplates: number;
}

export interface WeeklyEmailData {
  date: string;  // 'Pzt', 'Sal', 'Çar', ...
  value: number;
}

export interface ActiveCampaign {
  id: number;
  name: string;
  status: string;  // 'running', 'scheduled', 'paused', 'completed'
  sent: number;
  opened: number;
  clicked: number;
  openRate: string;  // '70%' veya '-'
}

export interface DashboardData {
  stats: DashboardStats;
  weeklyEmails: WeeklyEmailData[];
  activeCampaigns: ActiveCampaign[];
}
```

---

## 🚀 Frontend Kullanımı

Dashboard sayfası otomatik olarak:
1. Sayfa yüklendiğinde verileri çeker
2. Loading state gösterir
3. Hata durumunda kullanıcıya bildirim verir
4. Veri yoksa 0 değerleri gösterir
5. Mevcut endpoint'ler yoksa fallback data kullanır

**Yenileme:** Kullanıcı sayfayı yenilediğinde veriler tekrar çekilir.

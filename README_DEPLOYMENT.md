# 🚀 Railway Deployment Rehberi

## Railway'e Deploy Adımları

### 1. Railway Hesabı ve GitHub Bağlantısı
- Railway.app'de hesap açın
- GitHub hesabınızı Railway ile bağlayın
- Bu repository'i Railway'de yeni proje olarak seçin

### 2. Environment Variables (Ortam Değişkenleri)

Railway dashboard'da aşağıdaki environment variables'ları ekleyin:

```env
# Database (PostgreSQL)
DATABASE_URL=postgresql://username:password@host:port/database
DB_HOST=your_postgres_host
DB_USER=your_postgres_user  
DB_PASSWORD=your_postgres_password
DB_NAME=teymur_mailing
DB_PORT=5432

# Server Configuration
NODE_ENV=production
PORT=3001

# n8n Webhook Configuration
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/email-send
N8N_WEBHOOK_SECRET=your_webhook_secret_key

# CORS Configuration
CORS_ORIGIN=https://your-frontend-domain.com

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 3. Database Setup

Railway PostgreSQL addon ekleyin ve migrations'ları çalıştırın:

```bash
# Railway terminal'inde
cd server
node -e "
const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const migrations = [
  'migrations/create-email-campaigns-table.sql',
  'migrations/create-email-templates-table.sql', 
  'migrations/add-contact-fields.sql',
  'migrations/add-contact-stats-fields.sql',
  'migrations/create_email_tracking.sql',
  'migrations/insert_basic_templates.sql'
];

async function runMigrations() {
  for(const migration of migrations) {
    if(fs.existsSync(migration)) {
      const sql = fs.readFileSync(migration, 'utf8');
      await pool.query(sql);
      console.log('✅', migration);
    }
  }
  process.exit(0);
}

runMigrations().catch(console.error);
"
```

### 4. Build ve Deploy Ayarları

Railway otomatik olarak aşağıdaki komutları çalıştıracak:
- `npm install` - Dependencies yükleme
- `npm run build` - Frontend build
- `npm start` - Production server başlatma

### 5. Custom Start Script

Railway'de start command'i override etmek için:
```
cd server && node production.js
```

### 6. Port Configuration

Railway otomatik PORT atayacak. Backend'imiz `process.env.PORT || 3001` kullanıyor.

### 7. Frontend Build

Ant Design Pro otomatik build olacak:
```bash
npm run build
# dist/ klasörü oluşacak
```

### 8. Database Migrations Kontrol

Deploy sonrası database tablolarını kontrol edin:
- `contacts` - 16 sütun (yeni alanlar dahil)
- `email_campaigns` - Kampanya verileri
- `email_templates` - Email şablonları
- `email_tracking` - Email takip verileri

### 9. n8n Webhook Integration

Deploy sonrası n8n webhook URL'ini güncelleyin:
```
POST https://your-railway-app.railway.app/api/campaigns/send
```

### 10. Domain Configuration

Railway'de custom domain ayarlayabilirsiniz:
- Railway dashboard > Settings > Domains
- CNAME kaydı ekleyin

## 🔍 Deploy Sonrası Kontroller

1. **Health Check**: `https://your-app.railway.app/`
2. **API Test**: `https://your-app.railway.app/api/contacts`  
3. **Database**: Railway PostgreSQL panel'den bağlantı kontrol
4. **Logs**: Railway dashboard'da runtime logs kontrol

## 🚨 Troubleshooting

### Common Issues:

**1. Database Connection Error**
- `DATABASE_URL` doğru format: `postgresql://user:pass@host:port/db`
- Railway PostgreSQL addon aktif mi?

**2. Build Errors**
- Node.js version: 18+ gerekli
- `npm install` başarılı mı?

**3. Frontend 404**
- `/dist` klasörü build edildi mi?
- `package.json` build script doğru mu?

**4. API Endpoints**
- Backend port 3001'de çalışıyor mu?
- CORS ayarları doğru mu?

## 📞 Support

Deploy sırasında sorun yaşarsanız Railway logs'u kontrol edin:
```bash
railway logs
```

## 🎯 Production Ready Features

✅ **Database**: PostgreSQL with migrations
✅ **Backend**: Node.js + Express production ready  
✅ **Frontend**: React build optimization
✅ **Email**: n8n webhook integration
✅ **Security**: CORS, environment variables
✅ **Monitoring**: Comprehensive logging
✅ **Scaling**: Railway auto-scaling support

Deploy başarılı! 🎉
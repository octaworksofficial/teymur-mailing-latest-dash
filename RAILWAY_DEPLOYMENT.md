# 🚂 Railway Deployment Kılavuzu

## Railway'de Deployment Mimarisi

```
┌─────────────────────────────────────────────┐
│          Railway Domain (örn: xyz.up.railway.app)         │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐      ┌─────────────┐    │
│  │   Frontend   │◄─────┤   Backend   │    │
│  │   (Port 8080)│      │  (Port 3001)│    │
│  │              │      │             │    │
│  │  /          │      │  /api/*     │    │
│  │  /dashboard │      │             │    │
│  │  /contacts  │      │             │    │
│  └──────────────┘      └─────────────┘    │
│         │                      │           │
│         │                      │           │
│         └──────────┬───────────┘           │
│                    ▼                       │
│         ┌────────────────────┐            │
│         │  PostgreSQL DB     │            │
│         │  (Railway Service) │            │
│         └────────────────────┘            │
└─────────────────────────────────────────────┘
```

## 🎯 Deployment Stratejisi

### Opsiyon 1: Tek Railway Service (Önerilen - Basit)

**Avantajlar:**
- ✅ Tek deployment
- ✅ CORS sorunu yok
- ✅ Aynı domain'de çalışır
- ✅ Daha ucuz (tek container)

**Yapılandırma:**

1. **Railway Project Oluştur**
   - Railway.app'e giriş yap
   - "New Project" → "Deploy from GitHub"
   - Repository'nizi seçin

2. **Environment Variables Ayarla**
   ```env
   NODE_ENV=production
   DATABASE_URL=postgresql://... (Railway otomatik ekler)
   PORT=8080
   API_PORT=3001
   ```

3. **Build & Start Commands**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start:prod`

4. **Deploy!**
   - Railway otomatik deploy eder
   - Domain: `https://your-app.up.railway.app`

### Opsiyon 2: Ayrı Services (Gelişmiş - Scalable)

**Avantajlar:**
- ✅ Bağımsız scaling
- ✅ Ayrı monitoring
- ✅ Mikroservis mimarisi

**Yapılandırma:**

1. **Frontend Service**
   - Build: `npm run build`
   - Start: `npm run serve`
   - Port: 8080
   - Environment: 
     ```env
     NODE_ENV=production
     API_URL=https://api.your-app.railway.app
     ```

2. **Backend Service**
   - Start: `npm run server`
   - Port: 3001
   - Environment:
     ```env
     NODE_ENV=production
     DATABASE_URL=${{Postgres.DATABASE_URL}}
     CORS_ORIGIN=https://your-app.railway.app
     ```

3. **Database Service**
   - Railway Postgres plugin kullan
   - Otomatik DATABASE_URL inject edilir

## 📋 Adım Adım Deployment

### 1. GitHub Repository Hazırlığı

```bash
# .env dosyasını commit'lemeyin
echo ".env" >> .gitignore

# Commit ve push
git add .
git commit -m "Production deployment hazırlığı"
git push origin master
```

### 2. Railway'de Proje Oluşturma

1. **Railway Dashboard**: https://railway.app/dashboard
2. **New Project** butonuna tıkla
3. **Deploy from GitHub repo** seç
4. Repository'nizi seçin
5. **Deploy Now** tıkla

### 3. PostgreSQL Database Ekleme

1. Projenizde **New** butonuna tıkla
2. **Database** → **Add PostgreSQL**
3. Railway otomatik `DATABASE_URL` environment variable'ı ekler

### 4. Environment Variables Ayarlama

**Variables** sekmesine git:

```env
NODE_ENV=production
PORT=8080
API_PORT=3001
CORS_ORIGIN=https://your-app.up.railway.app
```

### 5. Build & Deploy Settings

**Settings** → **Deploy**:

- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start:prod`
- **Root Directory**: `/`

### 6. Domain Yapılandırması

**Settings** → **Domains**:

- **Generate Domain** tıkla
- Örnek: `https://email-automation.up.railway.app`
- Veya custom domain ekle

## 🔧 Production Server Detayları

### server/production.js Nasıl Çalışır?

```javascript
// Port 8080'de dinler
app.listen(8080)

// Static files (frontend build)
app.use(express.static('dist'))

// API proxy
app.use('/api', proxy('http://localhost:3001'))

// SPA routing
app.get('*', (req, res) => res.sendFile('dist/index.html'))
```

### İstek Akışı:

```
1. Kullanıcı: https://app.railway.app/dashboard
   → Production Server (8080) → dist/index.html

2. Frontend API çağrısı: /api/contacts
   → Production Server (8080) → Proxy → Backend (3001) → PostgreSQL

3. Backend response:
   PostgreSQL → Backend (3001) → Proxy → Frontend
```

## 🧪 Deployment Test

### Local Production Test

```bash
# Build
npm run build

# Backend'i başlat (terminal 1)
npm run server

# Production server'ı başlat (terminal 2)
npm run production

# Test
curl http://localhost:8080
curl http://localhost:8080/api/contacts
```

### Railway Production Test

```bash
# Railway domain'inizi kullanın
curl https://your-app.up.railway.app/api/contacts

# Health check
curl https://your-app.up.railway.app/api/health
```

## 🚨 Troubleshooting

### Build Hatası

```bash
# Railway logs kontrol et
railway logs

# Local build test
npm run build
```

### Database Connection Hatası

```env
# DATABASE_URL format kontrol
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require
```

### CORS Hatası

```env
# Backend .env dosyasında
CORS_ORIGIN=https://your-frontend-domain.railway.app

# Virgülle ayrılmış birden fazla domain
CORS_ORIGIN=https://app1.railway.app,https://app2.railway.app
```

### Port Hatası

Railway otomatik PORT assign eder:
```javascript
const PORT = process.env.PORT || 8080;
```

## 📊 Monitoring

### Railway Dashboard

- **Metrics**: CPU, Memory, Network kullanımı
- **Logs**: Real-time uygulama logları
- **Deployments**: Deployment history

### Custom Logging

Backend'de:
```javascript
console.log('[INFO]', 'User created:', email);
console.error('[ERROR]', 'Database connection failed');
```

Railway logs'da görünür.

## 💰 Maliyet Optimizasyonu

### Railway Pricing (2024)

- **Hobby Plan**: $5/ay - 500 saat
- **Pro Plan**: $20/ay - Unlimited

### Tek Service vs Ayrı Services

**Tek Service (Önerilen):**
- Frontend + Backend = 1 service
- PostgreSQL = 1 service
- **Toplam: 2 service** ✅

**Ayrı Services:**
- Frontend = 1 service
- Backend = 1 service
- PostgreSQL = 1 service
- **Toplam: 3 service** ❌ Daha pahalı

## ✅ Production Checklist

- [ ] `.env` dosyası `.gitignore`'da
- [ ] Environment variables Railway'de ayarlandı
- [ ] Database bağlantısı test edildi
- [ ] Build başarılı (local test)
- [ ] CORS ayarları doğru
- [ ] Custom domain ayarlandı (opsiyonel)
- [ ] SSL sertifikası aktif (Railway otomatik)
- [ ] Health check endpoint çalışıyor
- [ ] Logs monitoring aktif

## 🎉 Deployment Tamamlandı!

Şimdi uygulamanız canlı:

```
Frontend: https://your-app.up.railway.app
API: https://your-app.up.railway.app/api
Dashboard: https://your-app.up.railway.app/dashboard
Contacts: https://your-app.up.railway.app/contacts
```

## 📚 Sonraki Adımlar

1. **Custom Domain**: `app.yourcompany.com`
2. **CI/CD**: GitHub Actions entegrasyonu
3. **Monitoring**: Sentry, LogRocket
4. **Analytics**: Google Analytics, Mixpanel
5. **Email Service**: SendGrid, AWS SES entegrasyonu

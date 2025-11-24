# 🚀 Teymur Mailing System

Modern email marketing ve müşteri yönetimi platformu. React, TypeScript, Node.js ve PostgreSQL ile geliştirilmiştir.

## ✨ Özellikler

### 📧 Email Marketing
- **Kampanya Yönetimi**: Email kampanyaları oluşturma ve gönderme
- **Template Sistemi**: Özelleştirilebilir email şablonları
- **Hedef Kitle**: Gelişmiş filtreleme ve segmentasyon
- **Zamanlama**: n8n entegrasyonu ile otomatik gönderim
- **Takip**: Email açılma, tıklanma ve etkileşim raporları

### 👥 Müşteri Yönetimi
- **Gelişmiş Profiller**: 16 detaylı müşteri alanı
- **Smart Filtering**: Çoklu kriterlere göre filtreleme
- **Excel Import/Export**: Toplu veri yönetimi
- **Engagement Scoring**: Müşteri etkileşim puanları
- **Location Management**: Ülke, il, ilçe bazında organize etme

### 📊 Dashboard & Analytics
- **Real-time Metrics**: Anlık kampanya performansı
- **Engagement Analytics**: Detaylı etkileşim analizi
- **Revenue Tracking**: Gelir takibi ve ROI hesaplaması
- **Activity Logs**: Sistem aktivite kayıtları

## 🛠️ Teknoloji Stack

### Frontend
- **React 18** + **TypeScript**
- **Ant Design Pro** - Enterprise UI framework
- **ProTable** - Advanced data tables
- **Umi.js** - React application framework

### Backend
- **Node.js** + **Express**
- **PostgreSQL** - Primary database
- **n8n Integration** - Workflow automation
- **JWT Authentication** - Secure API access

### DevOps & Deployment
- **Railway** - Cloud platform
- **Git Workflows** - Version control
- **Environment Management** - Multi-stage deployment

## 🚀 Quick Start

### Development Environment

```bash
# Clone repository
git clone https://github.com/octaworksofficial/teymur-mailing-latest-dash.git
cd teymur-mailing-latest-dash

# Install dependencies
npm install

# Start development servers
./start-dev.sh

# Frontend: http://localhost:8000
# Backend: http://localhost:3001
```

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/teymur_mailing
DB_HOST=localhost
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=teymur_mailing

# n8n Integration  
N8N_WEBHOOK_URL=http://localhost:5678/webhook/email-send
N8N_WEBHOOK_SECRET=your_secret

# Server
NODE_ENV=development
PORT=3001
```

### Database Setup

```bash
# Create database
createdb teymur_mailing

# Run migrations
cd server
node -e "
const fs = require('fs');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
// Migrations will run automatically
"
```

## 📖 Documentation

- **[Deployment Guide](./README_DEPLOYMENT.md)** - Railway deployment
- **[API Documentation](./API_KULLANIM.md)** - Backend API reference
- **[Excel Import Guide](./EXCEL_IMPORT_GUIDE.md)** - Bulk data import
- **[Email Variables](./EMAIL_TEMPLATE_VARIABLES.md)** - Template variables

## 🏗️ Project Structure

```
├── src/                    # Frontend React app
│   ├── pages/
│   │   ├── Dashboard/      # Analytics dashboard
│   │   ├── Contacts/       # Customer management
│   │   ├── Campaigns/      # Email campaigns
│   │   └── Templates/      # Email templates
│   ├── services/          # API services
│   └── types/             # TypeScript types
│
├── server/                # Backend Node.js app
│   ├── routes/           # API endpoints
│   ├── services/         # Business logic
│   ├── migrations/       # Database migrations
│   └── utils/            # Utility functions
│
└── docs/                 # Documentation
```

## 🚀 Production Deployment

### Railway Platform

1. **Repository Setup**
   ```bash
   git push origin master
   ```

2. **Railway Configuration**
   - Connect GitHub repository
   - Add PostgreSQL addon
   - Configure environment variables

3. **Auto Deploy**
   - Automatic builds on push
   - Zero-downtime deployments
   - SSL certificates included

[Detaylı deployment rehberi için tıklayın](./README_DEPLOYMENT.md)

## 📊 Features Overview

### Contact Management
- 16 detailed fields per contact
- Advanced filtering and search
- Excel import/export
- Engagement scoring
- Location hierarchy (Country → State → District)

### Email Campaigns  
- Visual campaign builder
- Template personalization (20+ variables)
- Target audience selection
- Scheduled sending via n8n
- Real-time delivery tracking

### Analytics Dashboard
- Campaign performance metrics
- Revenue and ROI tracking
- Engagement analytics
- Activity monitoring
- Export capabilities

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Support

For support, email support@octaworks.com or create an issue on GitHub.

---

Built with ❤️ by [Octaworks](https://octaworks.com)
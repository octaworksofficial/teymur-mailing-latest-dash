-- =====================================================
-- AUTH SİSTEMİ MİGRATİONU
-- Multi-tenant kullanıcı yönetimi için gerekli tablolar
-- =====================================================

-- 1. ORGANIZATIONS (Organizasyonlar) Tablosu
-- Her organizasyon birden fazla kullanıcıya sahip olabilir
CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  
  -- Temel Bilgiler
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL, -- URL-friendly identifier (örn: "acme-corp")
  description TEXT,
  
  -- İletişim Bilgileri
  email VARCHAR(255), -- Organizasyon iletişim email'i
  phone VARCHAR(50),
  website VARCHAR(255),
  
  -- Adres
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Türkiye',
  
  -- Logo ve Branding
  logo_url VARCHAR(500),
  
  -- Ayarlar
  settings JSONB DEFAULT '{}'::jsonb,
  -- Örnek: {"email_signature": "...", "default_from_name": "...", "timezone": "Europe/Istanbul"}
  
  -- Plan ve Limitler (ileride kullanılabilir)
  plan VARCHAR(50) DEFAULT 'free', -- 'free', 'starter', 'professional', 'enterprise'
  max_users INTEGER DEFAULT 5,
  max_contacts INTEGER DEFAULT 1000,
  max_emails_per_month INTEGER DEFAULT 5000,
  
  -- Durum
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'suspended', 'cancelled'
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_org_status CHECK (status IN ('active', 'suspended', 'cancelled')),
  CONSTRAINT valid_plan CHECK (plan IN ('free', 'starter', 'professional', 'enterprise'))
);

-- 2. USERS (Kullanıcılar) Tablosu
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  
  -- Organizasyon İlişkisi
  organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Kimlik Bilgileri
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL, -- bcrypt ile hashlenmiş şifre
  
  -- Kişisel Bilgiler
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(50),
  avatar_url VARCHAR(500),
  
  -- Rol ve Yetkiler
  role VARCHAR(50) DEFAULT 'user', -- 'super_admin', 'org_admin', 'user'
  permissions JSONB DEFAULT '[]'::jsonb, -- Özel yetkiler
  -- Örnek: ["contacts:read", "contacts:write", "campaigns:read", "campaigns:write", "templates:read", "templates:write"]
  
  -- Durum
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'suspended'
  is_verified BOOLEAN DEFAULT true, -- Email onayı yok dediğin için default true
  
  -- Son Aktivite
  last_login_at TIMESTAMP,
  last_activity_at TIMESTAMP,
  login_count INTEGER DEFAULT 0,
  
  -- Tercihler
  preferences JSONB DEFAULT '{}'::jsonb,
  -- Örnek: {"language": "tr", "theme": "light", "notifications": true}
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_user_role CHECK (role IN ('super_admin', 'org_admin', 'user')),
  CONSTRAINT valid_user_status CHECK (status IN ('active', 'inactive', 'suspended'))
);

-- 3. REFRESH TOKENS Tablosu (JWT refresh token'ları saklamak için)
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMP,
  
  -- Cihaz bilgisi (opsiyonel)
  user_agent TEXT,
  ip_address VARCHAR(50)
);

-- 4. USER SESSIONS Tablosu (Aktif oturumları takip etmek için)
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Cihaz bilgisi
  user_agent TEXT,
  ip_address VARCHAR(50),
  device_type VARCHAR(50), -- 'desktop', 'mobile', 'tablet'
  
  is_active BOOLEAN DEFAULT true
);

-- =====================================================
-- MEVCUT TABLOLARA user_id EKLEMELERİ
-- =====================================================

-- 5. contacts tablosuna user_id ve organization_id ekle
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL;

-- 6. email_templates tablosuna user_id ve organization_id ekle
ALTER TABLE email_templates 
ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL;

-- 7. email_campaigns tablosuna user_id ve organization_id ekle
ALTER TABLE email_campaigns 
ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL;

-- 8. campaign_sends tablosuna user_id ekle (opsiyonel, campaign üzerinden erişilebilir)
ALTER TABLE campaign_sends 
ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- =====================================================
-- İNDEKSLER
-- =====================================================

-- Organizations indeksleri
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);

-- Users indeksleri
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Refresh tokens indeksleri
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- User sessions indeksleri
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);

-- Mevcut tablolardaki yeni kolonlar için indeksler
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_organization_id ON contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON email_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_organization_id ON email_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON email_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_organization_id ON email_campaigns(organization_id);

-- =====================================================
-- TRIGGER'LAR
-- =====================================================

-- Organizations updated_at trigger
CREATE OR REPLACE FUNCTION update_organizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_organizations_updated_at ON organizations;
CREATE TRIGGER trigger_update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_organizations_updated_at();

-- Users updated_at trigger
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_users_updated_at ON users;
CREATE TRIGGER trigger_update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_users_updated_at();

-- =====================================================
-- BAŞLANGIÇ VERİLERİ
-- Super Admin organizasyonu ve kullanıcısı
-- =====================================================

-- Varsayılan organizasyon oluştur
INSERT INTO organizations (name, slug, description, status, plan, max_users, max_contacts, max_emails_per_month)
VALUES (
  'System Admin',
  'system-admin',
  'Sistem yönetici organizasyonu',
  'active',
  'enterprise',
  999,
  999999,
  999999
) ON CONFLICT (slug) DO NOTHING;

-- Super Admin kullanıcısı oluştur
-- Şifre: admin123 (bcrypt hash)
-- ÖNEMLİ: Production'da bu şifreyi mutlaka değiştirin!
-- Şifre güncellemek için: node server/scripts/setup-admin.js
INSERT INTO users (
  organization_id,
  email,
  password_hash,
  first_name,
  last_name,
  role,
  status,
  is_verified
)
SELECT 
  o.id,
  'admin@cerilas.com',
  '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', -- admin123
  'Super',
  'Admin',
  'super_admin',
  'active',
  true
FROM organizations o
WHERE o.slug = 'system-admin'
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- MEVCUT VERİLERİ SUPER ADMIN'E ATA
-- =====================================================

-- Mevcut contacts'ları super admin'e ata
UPDATE contacts 
SET 
  user_id = (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1),
  organization_id = (SELECT id FROM organizations WHERE slug = 'system-admin' LIMIT 1)
WHERE user_id IS NULL;

-- Mevcut email_templates'i super admin'e ata
UPDATE email_templates 
SET 
  user_id = (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1),
  organization_id = (SELECT id FROM organizations WHERE slug = 'system-admin' LIMIT 1)
WHERE user_id IS NULL;

-- Mevcut email_campaigns'i super admin'e ata
UPDATE email_campaigns 
SET 
  user_id = (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1),
  organization_id = (SELECT id FROM organizations WHERE slug = 'system-admin' LIMIT 1)
WHERE user_id IS NULL;

-- Mevcut campaign_sends'i super admin'e ata
UPDATE campaign_sends 
SET 
  user_id = (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)
WHERE user_id IS NULL;

-- =====================================================
-- DOĞRULAMA SORGUSU
-- =====================================================

-- Migration'dan sonra bu sorguyu çalıştırarak kontrol edin:
-- SELECT 
--   (SELECT COUNT(*) FROM organizations) as org_count,
--   (SELECT COUNT(*) FROM users) as user_count,
--   (SELECT COUNT(*) FROM users WHERE role = 'super_admin') as super_admin_count,
--   (SELECT COUNT(*) FROM contacts WHERE user_id IS NOT NULL) as contacts_with_user,
--   (SELECT COUNT(*) FROM email_templates WHERE user_id IS NOT NULL) as templates_with_user,
--   (SELECT COUNT(*) FROM email_campaigns WHERE user_id IS NOT NULL) as campaigns_with_user;

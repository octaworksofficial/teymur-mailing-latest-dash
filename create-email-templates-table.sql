-- Email Templates (Şablonlar) Tablosu
-- Email kampanyalarında kullanılacak şablonları saklar

CREATE TABLE IF NOT EXISTS email_templates (
  id SERIAL PRIMARY KEY,
  
  -- Temel Bilgiler
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(100), -- 'newsletter', 'promotional', 'transactional', 'welcome', 'announcement'
  
  -- Email İçeriği
  subject VARCHAR(500) NOT NULL,
  preheader TEXT, -- Email önizleme metni (inbox'ta subject altında görünen kısa açıklama)
  
  -- Body içeriği (HTML ve Plain Text)
  body_html TEXT NOT NULL, -- HTML email içeriği
  body_text TEXT, -- Plain text alternatifi (HTML desteklemeyen email istemcileri için)
  
  -- Alıcı Ayarları
  from_name VARCHAR(255) DEFAULT 'Email Otomasyon Platformu',
  from_email VARCHAR(255) DEFAULT 'noreply@example.com',
  reply_to VARCHAR(255), -- Yanıt alınacak email
  
  -- CC ve BCC
  cc_emails TEXT[], -- Carbon Copy - Bilgi için gönderilecek emailler
  bcc_emails TEXT[], -- Blind Carbon Copy - Gizli kopya alacak emailler
  
  -- Öncelik ve Ayarlar
  priority VARCHAR(20) DEFAULT 'normal', -- 'high', 'normal', 'low'
  track_opens BOOLEAN DEFAULT true, -- Email açılmalarını takip et
  track_clicks BOOLEAN DEFAULT true, -- Link tıklamalarını takip et
  
  -- Şablon Değişkenleri (Placeholders)
  -- Örnek: {{first_name}}, {{company}}, {{custom_field.sehir}}
  available_variables JSONB DEFAULT '[]'::jsonb, -- Kullanılabilir değişkenlerin listesi
  -- Örnek: [{"name": "first_name", "description": "Kişinin adı", "example": "Ahmet"}]
  
  -- Attachments (Ekler)
  attachments JSONB DEFAULT '[]'::jsonb,
  -- Örnek: [{"filename": "katalog.pdf", "url": "https://...", "size": 1024000}]
  
  -- Design ve Stil
  design_json JSONB, -- Email builder'dan gelen tasarım JSON'u (unlayer, grapesjs vb.)
  thumbnail_url VARCHAR(500), -- Şablon önizleme görseli
  
  -- Metadata
  tags TEXT[], -- Şablon etiketleri ['black-friday', 'indirim', 'yeni-urun']
  language VARCHAR(10) DEFAULT 'tr', -- 'tr', 'en', 'de', vb.
  
  -- İstatistikler
  usage_count INTEGER DEFAULT 0, -- Bu şablonun kaç kez kullanıldığı
  last_used_at TIMESTAMP,
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'active', 'archived'
  is_default BOOLEAN DEFAULT false, -- Varsayılan şablon mu?
  
  -- Audit
  created_by INTEGER, -- Hangi kullanıcı oluşturdu (gelecekte users tablosu ile ilişkilendirilecek)
  updated_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_priority CHECK (priority IN ('high', 'normal', 'low')),
  CONSTRAINT valid_status CHECK (status IN ('draft', 'active', 'archived')),
  CONSTRAINT valid_category CHECK (category IN ('newsletter', 'promotional', 'transactional', 'welcome', 'announcement', 'follow-up', 'reminder', 'other'))
);

-- İndeksler
CREATE INDEX idx_templates_name ON email_templates(name);
CREATE INDEX idx_templates_category ON email_templates(category);
CREATE INDEX idx_templates_status ON email_templates(status);
CREATE INDEX idx_templates_tags ON email_templates USING GIN(tags);
CREATE INDEX idx_templates_created_at ON email_templates(created_at DESC);

-- Updated_at otomatik güncelleme trigger'ı
CREATE OR REPLACE FUNCTION update_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_email_templates_updated_at();

-- Örnek şablonlar ekle
INSERT INTO email_templates (
  name, description, category, subject, preheader,
  body_html, body_text, from_name, from_email, reply_to,
  track_opens, track_clicks, available_variables, tags, status
) VALUES
(
  'Hoş Geldiniz Email',
  'Yeni kayıt olan kullanıcılara gönderilen karşılama emaili',
  'welcome',
  'Hoş Geldiniz {{first_name}}! 🎉',
  'Email listemize katıldığınız için teşekkür ederiz',
  '<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; }
    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { background: #333; color: #999; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Hoş Geldiniz {{first_name}}!</h1>
      <p>Email listemize katıldığınız için teşekkür ederiz</p>
    </div>
    <div class="content">
      <p>Merhaba <strong>{{first_name}}</strong>,</p>
      <p>{{company}} ailesine hoş geldiniz! Sizinle iletişimde olmaktan mutluluk duyuyoruz.</p>
      <p>Bundan sonra size özel içerikler, kampanyalar ve yeniliklerden haberdar olacaksınız.</p>
      <center>
        <a href="{{confirm_link}}" class="button">Email Adresimi Onayla</a>
      </center>
      <p>Eğer bu emaili siz istemediyseniz, güvenle görmezden gelebilirsiniz.</p>
    </div>
    <div class="footer">
      <p>&copy; 2025 Email Otomasyon Platformu. Tüm hakları saklıdır.</p>
      <p><a href="{{unsubscribe_link}}" style="color: #667eea;">Abonelikten Çık</a></p>
    </div>
  </div>
</body>
</html>',
  'Hoş Geldiniz {{first_name}}!

Merhaba {{first_name}},

{{company}} ailesine hoş geldiniz! Sizinle iletişimde olmaktan mutluluk duyuyoruz.

Email adresinizi onaylamak için: {{confirm_link}}

Eğer bu emaili siz istemediyseniz, güvenle görmezden gelebilirsiniz.

---
Email Otomasyon Platformu
Abonelikten çıkmak için: {{unsubscribe_link}}',
  'Email Otomasyon Platformu',
  'noreply@platform.com',
  'destek@platform.com',
  true,
  true,
  '[
    {"name": "first_name", "description": "Kişinin adı", "example": "Ahmet"},
    {"name": "last_name", "description": "Kişinin soyadı", "example": "Yılmaz"},
    {"name": "email", "description": "Email adresi", "example": "ahmet@example.com"},
    {"name": "company", "description": "Şirket adı", "example": "TechCorp"},
    {"name": "confirm_link", "description": "Email onaylama linki", "example": "https://..."},
    {"name": "unsubscribe_link", "description": "Abonelikten çıkma linki", "example": "https://..."}
  ]'::jsonb,
  ARRAY['welcome', 'onboarding', 'yeni-uye'],
  'active'
),
(
  'Aylık Bülten',
  'Aylık haber bülteni şablonu',
  'newsletter',
  '📰 {{month}} Ayı Bülteni - Öne Çıkan Haberler',
  'Bu ayki en önemli gelişmeler ve haberler',
  '<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; }
    .container { max-width: 600px; margin: 20px auto; background: white; }
    .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
    .article { padding: 20px; border-bottom: 1px solid #eee; }
    .article h2 { color: #2c3e50; margin-top: 0; }
    .article img { max-width: 100%; height: auto; border-radius: 5px; }
    .cta { text-align: center; padding: 30px; background: #ecf0f1; }
    .cta a { background: #3498db; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📰 {{month}} Ayı Bülteni</h1>
      <p>Merhaba {{first_name}}, bu ayki öne çıkan haberler</p>
    </div>
    <div class="article">
      <h2>{{article_1_title}}</h2>
      <p>{{article_1_summary}}</p>
      <a href="{{article_1_link}}">Devamını Oku →</a>
    </div>
    <div class="article">
      <h2>{{article_2_title}}</h2>
      <p>{{article_2_summary}}</p>
      <a href="{{article_2_link}}">Devamını Oku →</a>
    </div>
    <div class="cta">
      <p>Daha fazla içerik için websitemizi ziyaret edin</p>
      <a href="{{website_link}}">Websiteye Git</a>
    </div>
  </div>
</body>
</html>',
  'Bu ayki bültenimizde yer alan haberler...
  
{{article_1_title}}
{{article_1_summary}}
{{article_1_link}}

{{article_2_title}}
{{article_2_summary}}
{{article_2_link}}

Abonelikten çıkmak için: {{unsubscribe_link}}',
  'Email Otomasyon Platformu',
  'bulten@platform.com',
  'bulten@platform.com',
  true,
  true,
  '[
    {"name": "first_name", "description": "Kişinin adı", "example": "Ahmet"},
    {"name": "month", "description": "Ay adı", "example": "Kasım"},
    {"name": "article_1_title", "description": "1. makale başlığı", "example": "Yeni Özellikler"},
    {"name": "article_1_summary", "description": "1. makale özeti", "example": "..."},
    {"name": "article_1_link", "description": "1. makale linki", "example": "https://..."}
  ]'::jsonb,
  ARRAY['newsletter', 'bulten', 'aylik'],
  'active'
),
(
  'Kampanya Duyurusu',
  'Özel indirim ve kampanya duyuruları için',
  'promotional',
  '🔥 {{discount}}% İndirim - Sadece {{days}} Gün!',
  'Kaçırılmayacak fırsatlar sizi bekliyor',
  '<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
    .banner { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 50px 20px; text-align: center; }
    .banner h1 { font-size: 48px; margin: 0; }
    .banner .discount { font-size: 72px; font-weight: bold; }
    .content { padding: 40px 20px; max-width: 600px; margin: 0 auto; }
    .products { display: flex; flex-wrap: wrap; gap: 20px; }
    .product { flex: 1; min-width: 250px; border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
    .cta-button { background: #f5576c; color: white; padding: 20px 50px; text-decoration: none; border-radius: 50px; font-size: 18px; font-weight: bold; display: inline-block; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="banner">
    <div class="discount">{{discount}}%</div>
    <h1>SÜPER İNDİRİM!</h1>
    <p style="font-size: 24px;">Sadece {{days}} gün geçerli</p>
  </div>
  <div class="content">
    <p>Merhaba {{first_name}},</p>
    <p>Size özel hazırladığımız bu kampanyayı kaçırmayın!</p>
    <center>
      <a href="{{campaign_link}}" class="cta-button">Hemen Al</a>
    </center>
    <p style="text-align: center; color: #999; font-size: 14px;">
      * Kampanya {{end_date}} tarihine kadar geçerlidir.
    </p>
  </div>
</body>
</html>',
  '{{discount}}% İNDİRİM - Sadece {{days}} gün!

Merhaba {{first_name}},

Size özel kampanyamız: %{{discount}} indirim

Kampanya linki: {{campaign_link}}
Son tarih: {{end_date}}

Abonelikten çıkmak için: {{unsubscribe_link}}',
  'Email Otomasyon Platformu',
  'kampanya@platform.com',
  'kampanya@platform.com',
  true,
  true,
  '[
    {"name": "first_name", "description": "Kişinin adı", "example": "Ayşe"},
    {"name": "discount", "description": "İndirim yüzdesi", "example": "50"},
    {"name": "days", "description": "Kalan gün sayısı", "example": "3"},
    {"name": "end_date", "description": "Bitiş tarihi", "example": "30 Kasım"},
    {"name": "campaign_link", "description": "Kampanya sayfası", "example": "https://..."}
  ]'::jsonb,
  ARRAY['kampanya', 'indirim', 'promotional'],
  'active'
);

-- Tablo bilgilerini göster
SELECT 
  table_name,
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'email_templates'
ORDER BY ordinal_position;

-- Eklenen şablon sayısını göster
SELECT COUNT(*) as sablon_sayisi, category, status 
FROM email_templates 
GROUP BY category, status;

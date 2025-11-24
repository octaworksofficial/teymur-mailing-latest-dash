-- Email Campaigns (Email Programlama) Tablosu
-- Planlanmış email gönderim programlarını saklar

CREATE TABLE IF NOT EXISTS email_campaigns (
  id SERIAL PRIMARY KEY,
  
  -- Temel Bilgiler
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Hedef Kitle (Recipient Selection)
  target_contact_ids INTEGER[], -- Seçilen kişilerin ID'leri
  target_filters JSONB, -- Filtreleme kriterleri (status, tags, custom_fields vb.)
  -- Örnek: {"status": "active", "tags": ["customer"], "subscription_status": "subscribed"}
  total_recipients INTEGER DEFAULT 0, -- Toplam alıcı sayısı
  
  -- Şablon ve Tekrar Ayarları
  is_recurring BOOLEAN DEFAULT false, -- Tekrarlayan email mi?
  template_sequence JSONB NOT NULL, -- Şablon dizisi
  -- Örnek: [
  --   {"template_id": 1, "send_delay_days": 0, "scheduled_date": "2025-11-22"},
  --   {"template_id": 2, "send_delay_days": 3, "scheduled_date": "2025-11-25"},
  --   {"template_id": 3, "send_delay_days": 7, "scheduled_date": "2025-11-29"}
  -- ]
  
  -- Zamanlama
  first_send_date TIMESTAMP, -- İlk gönderim tarihi
  recurrence_interval_days INTEGER, -- Tekrar aralığı (gün)
  -- Eğer recurring=true ise, her şablon bu aralıkla tekrarlanır
  
  -- Gönderim Ayarları
  stop_on_reply BOOLEAN DEFAULT false, -- Yanıt gelirse gönderim durdurulsun mu?
  reply_notification_email VARCHAR(255), -- Yanıt bildirim email adresi
  
  -- İstatistikler
  total_sent INTEGER DEFAULT 0, -- Toplam gönderilen email sayısı
  total_opened INTEGER DEFAULT 0, -- Açılan email sayısı
  total_clicked INTEGER DEFAULT 0, -- Link tıklanan email sayısı
  total_replied INTEGER DEFAULT 0, -- Yanıtlanan email sayısı
  total_failed INTEGER DEFAULT 0, -- Başarısız email sayısı
  
  -- Durum
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled'
  
  -- Audit
  created_by INTEGER,
  updated_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP, -- İlk gönderim başlangıç zamanı
  completed_at TIMESTAMP, -- Kampanya tamamlanma zamanı
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled'))
);

-- Email Campaign Sends (Her bir alıcıya gönderilen emailler)
CREATE TABLE IF NOT EXISTS campaign_sends (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES email_campaigns(id) ON DELETE CASCADE,
  contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
  template_id INTEGER REFERENCES email_templates(id) ON DELETE SET NULL,
  
  -- Gönderim Bilgileri
  sequence_index INTEGER NOT NULL, -- Şablon dizisindeki sıra (0, 1, 2, ...)
  scheduled_date TIMESTAMP NOT NULL, -- Planlanmış gönderim tarihi
  sent_date TIMESTAMP, -- Gerçek gönderim tarihi
  
  -- Email İçeriği (rendered - değişkenler yerine konmuş)
  rendered_subject VARCHAR(500),
  rendered_body_html TEXT,
  rendered_body_text TEXT,
  
  -- Takip Bilgileri
  is_sent BOOLEAN DEFAULT false,
  is_opened BOOLEAN DEFAULT false,
  is_clicked BOOLEAN DEFAULT false,
  is_replied BOOLEAN DEFAULT false,
  is_failed BOOLEAN DEFAULT false,
  is_cancelled BOOLEAN DEFAULT false, -- Yanıt geldiği için iptal edildi mi?
  
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  replied_at TIMESTAMP,
  failed_at TIMESTAMP,
  
  failure_reason TEXT,
  
  -- Email Tracking
  tracking_pixel_url VARCHAR(500), -- Açılma takip URL'i
  unsubscribe_url VARCHAR(500), -- Abonelikten çıkma URL'i
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(campaign_id, contact_id, sequence_index)
);

-- İndeksler
CREATE INDEX idx_campaigns_status ON email_campaigns(status);
CREATE INDEX idx_campaigns_first_send_date ON email_campaigns(first_send_date);
CREATE INDEX idx_campaigns_created_at ON email_campaigns(created_at DESC);

CREATE INDEX idx_campaign_sends_campaign_id ON campaign_sends(campaign_id);
CREATE INDEX idx_campaign_sends_contact_id ON campaign_sends(contact_id);
CREATE INDEX idx_campaign_sends_scheduled_date ON campaign_sends(scheduled_date);
CREATE INDEX idx_campaign_sends_is_sent ON campaign_sends(is_sent);
CREATE INDEX idx_campaign_sends_is_opened ON campaign_sends(is_opened);

-- Updated_at otomatik güncelleme trigger'ları
CREATE OR REPLACE FUNCTION update_email_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_email_campaigns_updated_at
  BEFORE UPDATE ON email_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_email_campaigns_updated_at();

CREATE OR REPLACE FUNCTION update_campaign_sends_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_campaign_sends_updated_at
  BEFORE UPDATE ON campaign_sends
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_sends_updated_at();

-- Örnek kampanya
INSERT INTO email_campaigns (
  name, description, is_recurring, template_sequence,
  first_send_date, recurrence_interval_days,
  stop_on_reply, reply_notification_email, status
) VALUES (
  'Hoş Geldiniz Serisi',
  'Yeni müşteriler için 3 aşamalı hoş geldiniz email serisi',
  true,
  '[
    {"template_id": 2, "send_delay_days": 0, "scheduled_date": "2025-11-22T09:00:00Z"},
    {"template_id": 3, "send_delay_days": 3, "scheduled_date": "2025-11-25T09:00:00Z"},
    {"template_id": 5, "send_delay_days": 7, "scheduled_date": "2025-11-29T09:00:00Z"}
  ]'::jsonb,
  '2025-11-22 09:00:00',
  NULL,
  true,
  'bildirim@platform.com',
  'draft'
);

-- Tablo bilgilerini göster
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('email_campaigns', 'campaign_sends')
ORDER BY table_name, ordinal_position;

-- Kampanya sayısını göster
SELECT COUNT(*) as kampanya_sayisi, status 
FROM email_campaigns 
GROUP BY status;

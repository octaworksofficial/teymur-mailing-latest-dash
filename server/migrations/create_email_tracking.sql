-- Email Tracking Events Tablosu
-- Her email açılması ve link tıklaması için detaylı kayıt tutar

CREATE TABLE IF NOT EXISTS email_tracking_events (
    id SERIAL PRIMARY KEY,
    campaign_send_id INTEGER NOT NULL REFERENCES campaign_sends(id) ON DELETE CASCADE,
    event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('open', 'click')),
    link_url TEXT, -- Tıklanan link (click event'lerinde dolu)
    ip_address VARCHAR(45), -- IPv4 veya IPv6
    user_agent TEXT, -- Browser/Email client bilgisi
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tracking_campaign_send ON email_tracking_events(campaign_send_id);
CREATE INDEX IF NOT EXISTS idx_tracking_event_type ON email_tracking_events(event_type);
CREATE INDEX IF NOT EXISTS idx_tracking_created_at ON email_tracking_events(created_at);

-- campaign_sends tablosuna tracking ID ekle
ALTER TABLE campaign_sends 
ADD COLUMN IF NOT EXISTS tracking_id UUID DEFAULT gen_random_uuid() UNIQUE;

-- Mevcut kayıtlar için tracking ID oluştur
UPDATE campaign_sends SET tracking_id = gen_random_uuid() WHERE tracking_id IS NULL;

-- tracking_id için index
CREATE INDEX IF NOT EXISTS idx_campaign_sends_tracking_id ON campaign_sends(tracking_id);

COMMENT ON TABLE email_tracking_events IS 'Email açılma ve link tıklama olaylarını detaylı olarak kaydeder';
COMMENT ON COLUMN email_tracking_events.campaign_send_id IS 'Hangi email gönderiminin takip edildiği';
COMMENT ON COLUMN email_tracking_events.event_type IS 'Olay tipi: open (email açıldı) veya click (link tıklandı)';
COMMENT ON COLUMN email_tracking_events.link_url IS 'Tıklanan linkin URL''i (sadece click olaylarında)';
COMMENT ON COLUMN email_tracking_events.ip_address IS 'İsteği yapan kullanıcının IP adresi';
COMMENT ON COLUMN email_tracking_events.user_agent IS 'Kullanıcının tarayıcı/email client bilgisi';
COMMENT ON COLUMN campaign_sends.tracking_id IS 'Email açılma/tıklama takibi için benzersiz UUID';

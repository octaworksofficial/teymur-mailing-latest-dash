-- Migration: Müşteri tablosuna istatistik alanları ekleme
-- Tarih: 2025-11-24
-- Açıklama: Email scheduler için gerekli istatistik kolonları ekleniyor

-- İstatistik sütunları ekle
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS total_email_sent INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS engagement_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_email_sent_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS last_opened_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS last_clicked_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS last_replied_at TIMESTAMP;

-- İndeksler ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_contacts_total_email_sent ON contacts(total_email_sent);
CREATE INDEX IF NOT EXISTS idx_contacts_engagement_score ON contacts(engagement_score);
CREATE INDEX IF NOT EXISTS idx_contacts_last_email_sent_at ON contacts(last_email_sent_at);

-- Yorumlar ekle
COMMENT ON COLUMN contacts.total_email_sent IS 'Toplam gönderilen email sayısı';
COMMENT ON COLUMN contacts.engagement_score IS 'Müşteri etkileşim skoru';
COMMENT ON COLUMN contacts.last_email_sent_at IS 'Son email gönderim tarihi';
COMMENT ON COLUMN contacts.last_opened_at IS 'Son email açılma tarihi';
COMMENT ON COLUMN contacts.last_clicked_at IS 'Son link tıklama tarihi';
COMMENT ON COLUMN contacts.last_replied_at IS 'Son yanıt verme tarihi';

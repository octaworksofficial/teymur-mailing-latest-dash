-- Migration: Müşteri tablosuna yeni alanlar ekleme
-- Tarih: 2025-11-24
-- Açıklama: Müşteri yönetimi için ek alanlar ekleniyor

-- Yeni sütunları ekle
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS customer_representative VARCHAR(255),
ADD COLUMN IF NOT EXISTS country VARCHAR(100),
ADD COLUMN IF NOT EXISTS state VARCHAR(100), -- İl
ADD COLUMN IF NOT EXISTS district VARCHAR(100), -- İlçe
ADD COLUMN IF NOT EXISTS address_1 TEXT,
ADD COLUMN IF NOT EXISTS address_2 TEXT,
ADD COLUMN IF NOT EXISTS company_title VARCHAR(255), -- Firma Ünvanı
ADD COLUMN IF NOT EXISTS importance_level INTEGER CHECK (importance_level >= 1 AND importance_level <= 10), -- Önem Derecesi (1-10)
ADD COLUMN IF NOT EXISTS notes TEXT, -- Not
ADD COLUMN IF NOT EXISTS mobile_phone VARCHAR(50); -- Mobil Telefon

-- İndeksler ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_contacts_customer_representative ON contacts(customer_representative);
CREATE INDEX IF NOT EXISTS idx_contacts_country ON contacts(country);
CREATE INDEX IF NOT EXISTS idx_contacts_state ON contacts(state);
CREATE INDEX IF NOT EXISTS idx_contacts_district ON contacts(district);
CREATE INDEX IF NOT EXISTS idx_contacts_importance_level ON contacts(importance_level);

-- Yorum ekle
COMMENT ON COLUMN contacts.customer_representative IS 'Müşteri temsilcisi adı';
COMMENT ON COLUMN contacts.country IS 'Ülke';
COMMENT ON COLUMN contacts.state IS 'İl';
COMMENT ON COLUMN contacts.district IS 'İlçe';
COMMENT ON COLUMN contacts.address_1 IS 'Adres 1';
COMMENT ON COLUMN contacts.address_2 IS 'Adres 2';
COMMENT ON COLUMN contacts.company_title IS 'Firma Ünvanı';
COMMENT ON COLUMN contacts.importance_level IS 'Önem Derecesi (1-10)';
COMMENT ON COLUMN contacts.notes IS 'Müşteri hakkında notlar';
COMMENT ON COLUMN contacts.mobile_phone IS 'Mobil telefon numarası';

-- special_days_calendar tablosuna organization_id kolonu ekle
-- Bu migration özel günleri organizasyon bazlı yapar

-- organization_id kolonu ekle
ALTER TABLE special_days_calendar 
ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE;

-- Mevcut unique constraint'i kaldır ve yenisini ekle
-- Önce eski index'i kaldır (varsa)
DROP INDEX IF EXISTS special_days_calendar_year_day_type_key;

-- Yeni unique constraint ekle (organization_id dahil)
CREATE UNIQUE INDEX IF NOT EXISTS special_days_calendar_org_year_day_type_key 
ON special_days_calendar(organization_id, year, day_type);

-- Index ekle performans için
CREATE INDEX IF NOT EXISTS idx_special_days_organization 
ON special_days_calendar(organization_id);

-- Mevcut kayıtları temizle (organization_id olmayan)
-- Üretimde dikkatli olun, bu mevcut verileri siler!
DELETE FROM special_days_calendar WHERE organization_id IS NULL;

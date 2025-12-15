-- special_days_calendar tablosuna user_id kolonu ekle
-- Bu migration özel günleri kullanıcı bazlı yapar

-- user_id kolonu ekle
ALTER TABLE special_days_calendar 
ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

-- Mevcut unique constraint'i kaldır ve yenisini ekle
DROP INDEX IF EXISTS special_days_calendar_org_year_day_type_key;
DROP INDEX IF EXISTS special_days_calendar_year_day_type_key;

-- Yeni unique constraint ekle (user_id dahil)
CREATE UNIQUE INDEX IF NOT EXISTS special_days_calendar_user_year_day_type_key 
ON special_days_calendar(user_id, year, day_type);

-- Index ekle performans için
CREATE INDEX IF NOT EXISTS idx_special_days_user 
ON special_days_calendar(user_id);

-- Mevcut kayıtları temizle (user_id olmayan)
-- Üretimde dikkatli olun, bu mevcut verileri siler!
DELETE FROM special_days_calendar WHERE user_id IS NULL;

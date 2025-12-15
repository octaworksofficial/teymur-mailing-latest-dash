-- Kampanya tablolarına user_id ekle
-- Bu migration kampanyaları kullanıcı bazlı yapar

-- email_campaigns tablosuna user_id ekle
ALTER TABLE email_campaigns 
ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

-- email_campaign_schedules tablosuna user_id ekle (eğer yoksa)
ALTER TABLE email_campaign_schedules 
ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

-- Index ekle performans için
CREATE INDEX IF NOT EXISTS idx_email_campaigns_user 
ON email_campaigns(user_id);

CREATE INDEX IF NOT EXISTS idx_email_campaign_schedules_user 
ON email_campaign_schedules(user_id);

-- Mevcut kampanyalara created_by'dan user_id ata
UPDATE email_campaigns 
SET user_id = created_by 
WHERE user_id IS NULL AND created_by IS NOT NULL;

-- Mevcut schedule'lara kampanyadan user_id ata
UPDATE email_campaign_schedules ecs
SET user_id = ec.user_id
FROM email_campaigns ec
WHERE ecs.campaign_id = ec.id 
  AND ecs.user_id IS NULL 
  AND ec.user_id IS NOT NULL;

-- Hala NULL olan kayıtları sil (orphan kayıtlar)
DELETE FROM email_campaigns WHERE user_id IS NULL;
DELETE FROM email_campaign_schedules WHERE user_id IS NULL;

-- NOT NULL constraint ekle
ALTER TABLE email_campaigns 
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE email_campaign_schedules 
ALTER COLUMN user_id SET NOT NULL;

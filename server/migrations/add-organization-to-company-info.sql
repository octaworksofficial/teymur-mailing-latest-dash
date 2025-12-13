-- company_info tablosuna organization_id sütunu ekle
-- Her organizasyonun kendi kurumsal bilgileri olacak

-- organization_id sütunu ekle
ALTER TABLE company_info 
ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE;

-- Mevcut id=1 kaydını kaldır (artık organization_id bazlı çalışacak)
-- Yeni kayıtlar her organizasyon için ayrı oluşturulacak

-- Unique constraint ekle - her organizasyonun tek bir company_info kaydı olabilir
CREATE UNIQUE INDEX IF NOT EXISTS idx_company_info_organization 
ON company_info(organization_id) 
WHERE organization_id IS NOT NULL;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_company_info_org_id ON company_info(organization_id);

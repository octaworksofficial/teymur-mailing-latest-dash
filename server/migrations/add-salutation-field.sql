-- Hitap (Salutation) alanı ekleme migration
-- Bay, Bayan, Mr., Mrs., Ms., Dr. vb. için

-- contacts tablosuna salutation kolonu ekle
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS salutation VARCHAR(20);

-- Örnek değerler için comment
COMMENT ON COLUMN contacts.salutation IS 'Hitap: Bay, Bayan, Mr., Mrs., Ms., Dr., Prof. vb.';

-- Index ekle (filtreleme için)
CREATE INDEX IF NOT EXISTS idx_contacts_salutation ON contacts(salutation);

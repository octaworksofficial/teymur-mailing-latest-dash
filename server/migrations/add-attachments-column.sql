-- email_templates tablosuna attachments kolonu ekle (eğer yoksa)
-- Bu migration, attachments kolonunu JSONB tipinde ekler

DO $$
BEGIN
    -- attachments kolonu yoksa ekle
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'email_templates' 
        AND column_name = 'attachments'
    ) THEN
        ALTER TABLE email_templates 
        ADD COLUMN attachments JSONB DEFAULT '[]'::jsonb;
        
        RAISE NOTICE 'attachments kolonu başarıyla eklendi';
    ELSE
        RAISE NOTICE 'attachments kolonu zaten mevcut';
    END IF;
END $$;

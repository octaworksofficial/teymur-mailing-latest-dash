-- Email Campaign Schedules Tablosu
-- Her template için hesaplanmış gönderim tarihlerini ve zamanlama ayarlarını tutar
-- Bu tablo sayesinde recurring ve special_day zamanlamaları düzgün çalışır

-- Ana schedule tablosu
CREATE TABLE IF NOT EXISTS email_campaign_schedules (
    id SERIAL PRIMARY KEY,
    
    -- İlişkiler
    campaign_id INTEGER NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
    template_id INTEGER NOT NULL REFERENCES email_templates(id) ON DELETE CASCADE,
    sequence_index INTEGER NOT NULL DEFAULT 0,
    
    -- Zamanlama tipi
    schedule_type VARCHAR(20) NOT NULL DEFAULT 'custom_date',
    -- 'custom_date': Tek seferlik belirli tarih
    -- 'recurring': Tekrarlayan (günlük, haftalık, aylık)
    -- 'special_day': Özel gün (bayramlar, kandiller, yılbaşı vs.)
    
    -- Custom date için
    scheduled_date TIMESTAMP WITH TIME ZONE,
    
    -- Recurring config (JSONB)
    recurrence_config JSONB,
    -- Örnek: {
    --   "type": "weekly",
    --   "interval": 1,
    --   "weekdays": [1, 3, 5],  -- Pazartesi, Çarşamba, Cuma
    --   "time": "09:00",
    --   "end_date": "2025-12-31"
    -- }
    -- Örnek: {
    --   "type": "monthly",
    --   "day_of_month": 15,  -- veya "last" ayın son günü için
    --   "time": "10:00"
    -- }
    
    -- Special day config (JSONB)
    special_day_config JSONB,
    -- Örnek: {
    --   "day_type": "ramazan_bayrami_1",
    --   "day_offset": -1,  -- 1 gün önceden
    --   "time": "09:00",
    --   "yearly_repeat": true
    -- }
    
    -- Bir sonraki gönderim tarihi (scheduler bu alanı kullanır)
    next_send_date TIMESTAMP WITH TIME ZONE,
    
    -- Son gönderim tarihi
    last_sent_date TIMESTAMP WITH TIME ZONE,
    
    -- Kaç kez gönderildi (recurring için)
    send_count INTEGER DEFAULT 0,
    
    -- Aktif mi?
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_schedules_campaign ON email_campaign_schedules(campaign_id);
CREATE INDEX IF NOT EXISTS idx_schedules_template ON email_campaign_schedules(template_id);
CREATE INDEX IF NOT EXISTS idx_schedules_next_send ON email_campaign_schedules(next_send_date) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_schedules_type ON email_campaign_schedules(schedule_type);

-- Benzersiz constraint: Aynı kampanya ve sequence_index için tek kayıt
CREATE UNIQUE INDEX IF NOT EXISTS idx_schedules_unique ON email_campaign_schedules(campaign_id, sequence_index);

-- Özel Günler Referans Tablosu (Hicri takvim hesaplamaları için)
-- Bu tablo her yıl için özel günlerin tarihlerini tutar
CREATE TABLE IF NOT EXISTS special_days_calendar (
    id SERIAL PRIMARY KEY,
    year INTEGER NOT NULL,
    day_type VARCHAR(50) NOT NULL,
    day_name VARCHAR(100) NOT NULL,
    actual_date DATE NOT NULL,
    category VARCHAR(50),
    
    UNIQUE(year, day_type)
);

-- 2025 yılı için örnek veriler
INSERT INTO special_days_calendar (year, day_type, day_name, actual_date, category) VALUES
-- Dini Bayramlar (2025 Hicri takvime göre)
(2025, 'ramazan_bayrami_1', 'Ramazan Bayramı 1. Gün', '2025-03-30', 'dini'),
(2025, 'ramazan_bayrami_2', 'Ramazan Bayramı 2. Gün', '2025-03-31', 'dini'),
(2025, 'ramazan_bayrami_3', 'Ramazan Bayramı 3. Gün', '2025-04-01', 'dini'),
(2025, 'kurban_bayrami_1', 'Kurban Bayramı 1. Gün', '2025-06-06', 'dini'),
(2025, 'kurban_bayrami_2', 'Kurban Bayramı 2. Gün', '2025-06-07', 'dini'),
(2025, 'kurban_bayrami_3', 'Kurban Bayramı 3. Gün', '2025-06-08', 'dini'),
(2025, 'kurban_bayrami_4', 'Kurban Bayramı 4. Gün', '2025-06-09', 'dini'),
(2025, 'kandil_mevlid', 'Mevlid Kandili', '2025-09-04', 'dini'),
(2025, 'kandil_regaip', 'Regaip Kandili', '2025-01-16', 'dini'),
(2025, 'kandil_mirac', 'Miraç Kandili', '2025-02-27', 'dini'),
(2025, 'kandil_berat', 'Berat Kandili', '2025-03-13', 'dini'),
(2025, 'kandil_kadir', 'Kadir Gecesi', '2025-03-26', 'dini'),

-- Milli Bayramlar (Sabit tarihler)
(2025, 'yilbasi', 'Yılbaşı', '2025-01-01', 'milli'),
(2025, 'ulusal_egemenlik', '23 Nisan Ulusal Egemenlik', '2025-04-23', 'milli'),
(2025, 'isci_bayrami', '1 Mayıs İşçi Bayramı', '2025-05-01', 'milli'),
(2025, 'genclik_bayrami', '19 Mayıs Gençlik Bayramı', '2025-05-19', 'milli'),
(2025, 'demokrasi_bayrami', '15 Temmuz Demokrasi Bayramı', '2025-07-15', 'milli'),
(2025, 'zafer_bayrami', '30 Ağustos Zafer Bayramı', '2025-08-30', 'milli'),
(2025, 'cumhuriyet_bayrami', '29 Ekim Cumhuriyet Bayramı', '2025-10-29', 'milli'),

-- Özel Günler
(2025, 'sevgililer_gunu', 'Sevgililer Günü', '2025-02-14', 'ozel'),
(2025, 'kadinlar_gunu', 'Kadınlar Günü', '2025-03-08', 'ozel'),
(2025, 'anneler_gunu', 'Anneler Günü', '2025-05-11', 'ozel'),
(2025, 'babalar_gunu', 'Babalar Günü', '2025-06-15', 'ozel'),
(2025, 'ogretmenler_gunu', 'Öğretmenler Günü', '2025-11-24', 'ozel')
ON CONFLICT (year, day_type) DO NOTHING;

-- 2026 yılı için örnek veriler
INSERT INTO special_days_calendar (year, day_type, day_name, actual_date, category) VALUES
-- Dini Bayramlar (2026 Hicri takvime göre - yaklaşık)
(2026, 'ramazan_bayrami_1', 'Ramazan Bayramı 1. Gün', '2026-03-20', 'dini'),
(2026, 'ramazan_bayrami_2', 'Ramazan Bayramı 2. Gün', '2026-03-21', 'dini'),
(2026, 'ramazan_bayrami_3', 'Ramazan Bayramı 3. Gün', '2026-03-22', 'dini'),
(2026, 'kurban_bayrami_1', 'Kurban Bayramı 1. Gün', '2026-05-27', 'dini'),
(2026, 'kurban_bayrami_2', 'Kurban Bayramı 2. Gün', '2026-05-28', 'dini'),
(2026, 'kurban_bayrami_3', 'Kurban Bayramı 3. Gün', '2026-05-29', 'dini'),
(2026, 'kurban_bayrami_4', 'Kurban Bayramı 4. Gün', '2026-05-30', 'dini'),

-- Milli Bayramlar (Sabit tarihler)
(2026, 'yilbasi', 'Yılbaşı', '2026-01-01', 'milli'),
(2026, 'ulusal_egemenlik', '23 Nisan Ulusal Egemenlik', '2026-04-23', 'milli'),
(2026, 'isci_bayrami', '1 Mayıs İşçi Bayramı', '2026-05-01', 'milli'),
(2026, 'genclik_bayrami', '19 Mayıs Gençlik Bayramı', '2026-05-19', 'milli'),
(2026, 'demokrasi_bayrami', '15 Temmuz Demokrasi Bayramı', '2026-07-15', 'milli'),
(2026, 'zafer_bayrami', '30 Ağustos Zafer Bayramı', '2026-08-30', 'milli'),
(2026, 'cumhuriyet_bayrami', '29 Ekim Cumhuriyet Bayramı', '2026-10-29', 'milli'),

-- Özel Günler
(2026, 'sevgililer_gunu', 'Sevgililer Günü', '2026-02-14', 'ozel'),
(2026, 'kadinlar_gunu', 'Kadınlar Günü', '2026-03-08', 'ozel'),
(2026, 'anneler_gunu', 'Anneler Günü', '2026-05-10', 'ozel'),
(2026, 'babalar_gunu', 'Babalar Günü', '2026-06-21', 'ozel'),
(2026, 'ogretmenler_gunu', 'Öğretmenler Günü', '2026-11-24', 'ozel')
ON CONFLICT (year, day_type) DO NOTHING;

-- Yorum: Mevcut yapıyla uyumluluk için template_sequence JSONB'si hala kullanılacak
-- Ancak scheduler artık email_campaign_schedules tablosundan next_send_date'e bakacak
-- Kampanya oluşturulduğunda/güncellendiğinde template_sequence'den schedule kayıtları oluşturulacak

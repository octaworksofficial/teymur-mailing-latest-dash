-- 30 Kişilik Dummy Contact Verisi
-- Mevcut verileri silmek isterseniz: TRUNCATE TABLE contacts RESTART IDENTITY CASCADE;

INSERT INTO contacts (
  email, first_name, last_name, phone, company, position, 
  status, subscription_status, source, tags, custom_fields,
  total_emails_sent, total_emails_opened, total_emails_clicked, total_emails_bounced,
  engagement_score, subscribed_at
) VALUES
-- 1-10: Teknoloji Sektörü
(
  'ahmet.yilmaz@techcorp.com', 'Ahmet', 'Yılmaz', '+90 532 111 22 33',
  'TechCorp Türkiye', 'CTO', 'active', 'subscribed', 'Website Form',
  ARRAY['teknoloji', 'vip', 'kurumsal'],
  '{"sehir": "İstanbul", "sektor": "Yazılım", "butce": "500000", "calisan_sayisi": 150}'::jsonb,
  45, 32, 18, 0, 42.5, NOW() - INTERVAL '6 months'
),
(
  'zeynep.kaya@innovate.io', 'Zeynep', 'Kaya', '+90 533 222 33 44',
  'Innovate Labs', 'Ürün Müdürü', 'active', 'subscribed', 'LinkedIn',
  ARRAY['startup', 'ai', 'vip'],
  '{"sehir": "İstanbul", "sektor": "Yapay Zeka", "butce": "300000"}'::jsonb,
  38, 29, 15, 0, 38.2, NOW() - INTERVAL '4 months'
),
(
  'mehmet.demir@cloudsys.com', 'Mehmet', 'Demir', '+90 534 333 44 55',
  'CloudSys', 'Sistem Mimarı', 'active', 'subscribed', 'Konferans',
  ARRAY['cloud', 'devops', 'teknoloji'],
  '{"sehir": "Ankara", "sektor": "Cloud Computing", "calisan_sayisi": 80}'::jsonb,
  52, 41, 22, 1, 45.8, NOW() - INTERVAL '8 months'
),
(
  'ayse.sahin@datatech.com', 'Ayşe', 'Şahin', '+90 535 444 55 66',
  'DataTech Analytics', 'Veri Bilimci', 'active', 'subscribed', 'Webinar',
  ARRAY['data-science', 'analytics', 'teknoloji'],
  '{"sehir": "İzmir", "sektor": "Veri Analizi", "butce": "200000"}'::jsonb,
  28, 22, 12, 0, 35.7, NOW() - INTERVAL '3 months'
),
(
  'can.ozturk@mobilapp.com', 'Can', 'Öztürk', '+90 536 555 66 77',
  'MobilApp Studio', 'Mobil Geliştirici', 'active', 'subscribed', 'Referans',
  ARRAY['mobile', 'ios', 'android'],
  '{"sehir": "İstanbul", "sektor": "Mobil Uygulama", "calisan_sayisi": 25}'::jsonb,
  19, 15, 8, 0, 28.4, NOW() - INTERVAL '2 months'
),
(
  'elif.arslan@securetech.com', 'Elif', 'Arslan', '+90 537 666 77 88',
  'SecureTech Solutions', 'Güvenlik Uzmanı', 'active', 'subscribed', 'Email Kampanyası',
  ARRAY['security', 'cybersecurity', 'vip'],
  '{"sehir": "Ankara", "sektor": "Siber Güvenlik", "butce": "400000"}'::jsonb,
  34, 27, 14, 0, 37.1, NOW() - INTERVAL '5 months'
),
(
  'burak.celik@gamedev.com', 'Burak', 'Çelik', '+90 538 777 88 99',
  'GameDev Turkey', 'Oyun Tasarımcısı', 'active', 'subscribed', 'Gaming Event',
  ARRAY['gaming', 'unity', 'unreal'],
  '{"sehir": "İstanbul", "sektor": "Oyun Geliştirme", "calisan_sayisi": 40}'::jsonb,
  15, 12, 6, 0, 24.3, NOW() - INTERVAL '1 month'
),
(
  'selin.yildiz@iotsmart.com', 'Selin', 'Yıldız', '+90 539 888 99 00',
  'IoTSmart Solutions', 'IoT Mühendisi', 'active', 'subscribed', 'Trade Show',
  ARRAY['iot', 'hardware', 'teknoloji'],
  '{"sehir": "İzmir", "sektor": "IoT", "butce": "250000"}'::jsonb,
  22, 18, 9, 0, 30.5, NOW() - INTERVAL '3 months'
),
(
  'emre.koc@blockchain.tech', 'Emre', 'Koç', '+90 540 999 00 11',
  'BlockChain Tech', 'Blockchain Developer', 'active', 'subscribed', 'Crypto Summit',
  ARRAY['blockchain', 'crypto', 'web3'],
  '{"sehir": "İstanbul", "sektor": "Blockchain", "calisan_sayisi": 15}'::jsonb,
  11, 8, 4, 0, 18.7, NOW() - INTERVAL '1 month'
),
(
  'deniz.polat@arvrlab.com', 'Deniz', 'Polat', '+90 541 000 11 22',
  'AR/VR Lab Turkey', 'XR Developer', 'active', 'subscribed', 'VR Conference',
  ARRAY['ar', 'vr', 'metaverse'],
  '{"sehir": "Ankara", "sektor": "AR/VR", "butce": "180000"}'::jsonb,
  8, 6, 3, 0, 15.2, NOW() - INTERVAL '2 weeks'
),

-- 11-20: E-ticaret ve Pazarlama
(
  'fatma.akin@ecommerce.com', 'Fatma', 'Akın', '+90 542 111 22 33',
  'E-Commerce Pro', 'E-ticaret Müdürü', 'active', 'subscribed', 'Online Reklam',
  ARRAY['ecommerce', 'retail', 'vip'],
  '{"sehir": "İstanbul", "sektor": "E-ticaret", "butce": "600000", "aylik_siparis": 5000}'::jsonb,
  67, 54, 32, 2, 52.3, NOW() - INTERVAL '1 year'
),
(
  'ali.yilmaz@digitalagency.com', 'Ali', 'Yılmaz', '+90 543 222 33 44',
  'Digital Marketing Agency', 'Dijital Pazarlama Uzmanı', 'active', 'subscribed', 'Google Ads',
  ARRAY['marketing', 'digital', 'seo'],
  '{"sehir": "İstanbul", "sektor": "Pazarlama", "calisan_sayisi": 35}'::jsonb,
  43, 35, 19, 1, 41.2, NOW() - INTERVAL '7 months'
),
(
  'gizem.bulut@socialmed.com', 'Gizem', 'Bulut', '+90 544 333 44 55',
  'Social Media Pro', 'Social Media Manager', 'active', 'subscribed', 'Instagram',
  ARRAY['social-media', 'influencer', 'content'],
  '{"sehir": "İzmir", "sektor": "Sosyal Medya", "takipci_sayisi": 150000}'::jsonb,
  31, 26, 14, 0, 36.8, NOW() - INTERVAL '4 months'
),
(
  'hakan.erdogan@seoexpert.com', 'Hakan', 'Erdoğan', '+90 545 444 55 66',
  'SEO Expert Turkey', 'SEO Uzmanı', 'active', 'subscribed', 'SEO Workshop',
  ARRAY['seo', 'content', 'analytics'],
  '{"sehir": "Ankara", "sektor": "SEO", "butce": "120000"}'::jsonb,
  26, 21, 11, 0, 32.4, NOW() - INTERVAL '5 months'
),
(
  'irem.kurt@marketplace.com', 'İrem', 'Kurt', '+90 546 555 66 77',
  'Marketplace Turkey', 'Satış Müdürü', 'active', 'subscribed', 'B2B Platform',
  ARRAY['sales', 'b2b', 'vip'],
  '{"sehir": "İstanbul", "sektor": "B2B", "yillik_ciro": "2000000"}'::jsonb,
  58, 46, 28, 1, 48.9, NOW() - INTERVAL '9 months'
),
(
  'kerem.ozkan@crmagency.com', 'Kerem', 'Özkan', '+90 547 666 77 88',
  'CRM Solutions', 'CRM Danışmanı', 'active', 'subscribed', 'CRM Semineri',
  ARRAY['crm', 'sales', 'automation'],
  '{"sehir": "İzmir", "sektor": "CRM", "calisan_sayisi": 20}'::jsonb,
  35, 28, 16, 0, 38.5, NOW() - INTERVAL '6 months'
),
(
  'leyla.aktas@contentking.com', 'Leyla', 'Aktaş', '+90 548 777 88 99',
  'Content King', 'İçerik Stratejisti', 'active', 'subscribed', 'Content Summit',
  ARRAY['content', 'copywriting', 'marketing'],
  '{"sehir": "İstanbul", "sektor": "İçerik Pazarlama", "butce": "95000"}'::jsonb,
  18, 14, 7, 0, 25.6, NOW() - INTERVAL '2 months'
),
(
  'murat.guler@emailpro.com', 'Murat', 'Güler', '+90 549 888 99 00',
  'Email Marketing Pro', 'Email Uzmanı', 'active', 'subscribed', 'Email Conference',
  ARRAY['email-marketing', 'automation', 'analytics'],
  '{"sehir": "Ankara", "sektor": "Email Pazarlama", "liste_boyutu": 500000}'::jsonb,
  29, 23, 12, 0, 33.7, NOW() - INTERVAL '3 months'
),
(
  'naz.coskun@influencer.com', 'Naz', 'Coşkun', '+90 550 999 00 11',
  'Influencer Hub', 'Influencer Relations', 'active', 'subscribed', 'Influencer Event',
  ARRAY['influencer', 'brand', 'collaboration'],
  '{"sehir": "İstanbul", "sektor": "Influencer Marketing", "kampanya_sayisi": 45}'::jsonb,
  14, 11, 5, 0, 21.8, NOW() - INTERVAL '1 month'
),
(
  'onur.sahin@adnetwork.com', 'Onur', 'Şahin', '+90 551 000 11 22',
  'Ad Network Turkey', 'Reklam Yöneticisi', 'bounced', 'unsubscribed', 'Paid Ads',
  ARRAY['advertising', 'ppc', 'display'],
  '{"sehir": "İzmir", "sektor": "Dijital Reklam", "butce": "850000"}'::jsonb,
  72, 58, 34, 5, 48.2, NOW() - INTERVAL '1 year'
),

-- 21-30: Çeşitli Sektörler
(
  'pelin.yilmaz@fintech.com', 'Pelin', 'Yılmaz', '+90 552 111 22 33',
  'FinTech Solutions', 'Finans Teknolojileri', 'active', 'subscribed', 'Banking Summit',
  ARRAY['fintech', 'banking', 'vip'],
  '{"sehir": "İstanbul", "sektor": "Fintech", "butce": "700000", "lisans": "Merkez Bankası"}'::jsonb,
  41, 33, 19, 0, 40.1, NOW() - INTERVAL '6 months'
),
(
  'riza.cetin@edutech.com', 'Rıza', 'Çetin', '+90 553 222 33 44',
  'EduTech Platform', 'Eğitim Teknolojileri', 'active', 'subscribed', 'Education Fair',
  ARRAY['education', 'edtech', 'online-learning'],
  '{"sehir": "Ankara", "sektor": "Eğitim Teknolojisi", "ogrenci_sayisi": 25000}'::jsonb,
  36, 29, 16, 0, 37.8, NOW() - INTERVAL '5 months'
),
(
  'seda.aydin@healthtech.com', 'Seda', 'Aydın', '+90 554 333 44 55',
  'HealthTech Turkey', 'Sağlık Teknolojileri', 'active', 'subscribed', 'Health Expo',
  ARRAY['healthtech', 'medical', 'telemedicine'],
  '{"sehir": "İstanbul", "sektor": "Sağlık Teknolojisi", "hasta_sayisi": 10000}'::jsonb,
  27, 22, 11, 0, 32.9, NOW() - INTERVAL '4 months'
),
(
  'taner.ozdemir@proptech.com', 'Taner', 'Özdemir', '+90 555 444 55 66',
  'PropTech Innovations', 'Gayrimenkul Teknolojileri', 'active', 'subscribed', 'Real Estate Summit',
  ARRAY['proptech', 'realestate', 'vip'],
  '{"sehir": "İstanbul", "sektor": "Gayrimenkul Teknolojisi", "portfoy_degeri": "50000000"}'::jsonb,
  33, 26, 15, 0, 35.4, NOW() - INTERVAL '7 months'
),
(
  'umut.kaplan@logistics.com', 'Umut', 'Kaplan', '+90 556 555 66 77',
  'Smart Logistics', 'Lojistik Müdürü', 'active', 'subscribed', 'Logistics Conference',
  ARRAY['logistics', 'supply-chain', 'automation'],
  '{"sehir": "İzmir", "sektor": "Lojistik", "filo_buyuklugu": 120}'::jsonb,
  44, 35, 20, 1, 42.7, NOW() - INTERVAL '8 months'
),
(
  'vildan.kaya@restaurant.com', 'Vildan', 'Kaya', '+90 557 666 77 88',
  'Restaurant Chain', 'Restoran Yöneticisi', 'active', 'subscribed', 'Food Festival',
  ARRAY['food', 'restaurant', 'hospitality'],
  '{"sehir": "İstanbul", "sektor": "Restoran", "sube_sayisi": 15}'::jsonb,
  21, 17, 9, 0, 29.3, NOW() - INTERVAL '3 months'
),
(
  'yigit.demirci@fashion.com', 'Yiğit', 'Demirci', '+90 558 777 88 99',
  'Fashion Retail', 'Moda Perakende', 'complained', 'subscribed', 'Fashion Week',
  ARRAY['fashion', 'retail', 'ecommerce'],
  '{"sehir": "İstanbul", "sektor": "Moda", "magaza_sayisi": 8}'::jsonb,
  38, 30, 18, 2, 36.5, NOW() - INTERVAL '6 months'
),
(
  'zehra.yildirim@travel.com', 'Zehra', 'Yıldırım', '+90 559 888 99 00',
  'Travel Agency Plus', 'Turizm Danışmanı', 'active', 'subscribed', 'Travel Expo',
  ARRAY['travel', 'tourism', 'booking'],
  '{"sehir": "Antalya", "sektor": "Turizm", "yillik_musteri": 5000}'::jsonb,
  52, 42, 24, 1, 46.3, NOW() - INTERVAL '9 months'
),
(
  'baris.sen@automotive.com', 'Barış', 'Şen', '+90 560 999 00 11',
  'Auto Parts Turkey', 'Otomotiv Sektörü', 'active', 'subscribed', 'Auto Show',
  ARRAY['automotive', 'parts', 'b2b'],
  '{"sehir": "Bursa", "sektor": "Otomotiv", "urun_sayisi": 2500}'::jsonb,
  39, 31, 17, 0, 38.9, NOW() - INTERVAL '7 months'
),
(
  'canan.turkmen@energy.com', 'Canan', 'Türkmen', '+90 561 000 11 22',
  'Green Energy Solutions', 'Enerji Uzmanı', 'active', 'pending', 'Energy Summit',
  ARRAY['energy', 'solar', 'sustainability'],
  '{"sehir": "Ankara", "sektor": "Yenilenebilir Enerji", "kurulu_guc": "50MW"}'::jsonb,
  12, 9, 4, 0, 19.4, NOW() - INTERVAL '1 month'
);

-- Toplam kayıt sayısını kontrol et
SELECT COUNT(*) as toplam_kisi FROM contacts;

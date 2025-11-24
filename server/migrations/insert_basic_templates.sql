-- Temel Email Şablonları
-- Düz metin ve basit HTML formatında hazır şablonlar

-- 1. Hoş Geldiniz Emaili
INSERT INTO email_templates (
  name, 
  description, 
  category, 
  subject, 
  preheader,
  body_html, 
  body_text,
  status,
  language
) VALUES (
  'Hoş Geldiniz - Basit',
  'Yeni üyelere gönderilen hoş geldiniz mesajı',
  'welcome',
  'Hoş Geldiniz, {first_name}!',
  'Aramıza katıldığınız için teşekkür ederiz',
  '<h2>Merhaba {first_name},</h2>
<p>Aramıza hoş geldiniz! Bizi tercih ettiğiniz için teşekkür ederiz.</p>

<p>Size en iyi hizmeti sunmak için buradayız. Herhangi bir sorunuz olursa lütfen bizimle iletişime geçmekten çekinmeyin.</p>

<p>Saygılarımızla,<br>
Ekibimiz</p>',
  'Merhaba {first_name},

Aramıza hoş geldiniz! Bizi tercih ettiğiniz için teşekkür ederiz.

Size en iyi hizmeti sunmak için buradayız. Herhangi bir sorunuz olursa lütfen bizimle iletişime geçmekten çekinmeyin.

Saygılarımızla,
Ekibimiz',
  'active',
  'tr'
);

-- 2. Promosyon/İndirim Emaili
INSERT INTO email_templates (
  name, 
  description, 
  category, 
  subject, 
  preheader,
  body_html, 
  body_text,
  status,
  language
) VALUES (
  'İndirim Kampanyası - Basit',
  'İndirim ve kampanya duyurusu için şablon',
  'promotion',
  '🎉 Özel İndirim: %50''ye Varan Fırsatlar!',
  'Kaçırmayın! Bugün başlıyor',
  '<h2>Merhaba {first_name},</h2>

<h3>🎉 Özel İndirim Kampanyası Başladı!</h3>

<p>Sadece sizin için özel <strong>%50''ye varan indirimler</strong> hazırladık!</p>

<p><strong>Kampanya Detayları:</strong></p>
<ul>
  <li>Tüm ürünlerde geçerli</li>
  <li>Sınırlı süre için</li>
  <li>Hemen alışverişe başlayın</li>
</ul>

<p>Bu fırsatı kaçırmayın!</p>

<p>İyi alışverişler,<br>
{company} Ekibi</p>',
  'Merhaba {first_name},

🎉 Özel İndirim Kampanyası Başladı!

Sadece sizin için özel %50''ye varan indirimler hazırladık!

Kampanya Detayları:
- Tüm ürünlerde geçerli
- Sınırlı süre için
- Hemen alışverişe başlayın

Bu fırsatı kaçırmayın!

İyi alışverişler,
{company} Ekibi',
  'active',
  'tr'
);

-- 3. Bülten/Newsletter
INSERT INTO email_templates (
  name, 
  description, 
  category, 
  subject, 
  preheader,
  body_html, 
  body_text,
  status,
  language
) VALUES (
  'Aylık Bülten - Basit',
  'Düzenli gönderilen haber bülteni',
  'newsletter',
  '📬 Aylık Bültenimiz - {first_name}',
  'Bu ayki haberler ve gelişmeler',
  '<h2>Merhaba {first_name},</h2>

<p>Bu ayki bültenimizde sizler için hazırladığımız haberleri paylaşıyoruz.</p>

<h3>📰 Bu Ayın Başlıkları</h3>

<p><strong>1. Yeni Ürünlerimiz</strong><br>
Size daha iyi hizmet vermek için yeni ürünler ekledik.</p>

<p><strong>2. Özel Fırsatlar</strong><br>
Sadece bülten abonelerimize özel indirimler.</p>

<p><strong>3. Haberler</strong><br>
Sektördeki son gelişmeler ve duyurular.</p>

<p>Görüşmek üzere,<br>
{company}</p>',
  'Merhaba {first_name},

Bu ayki bültenimizde sizler için hazırladığımız haberleri paylaşıyoruz.

📰 Bu Ayın Başlıkları

1. Yeni Ürünlerimiz
Size daha iyi hizmet vermek için yeni ürünler ekledik.

2. Özel Fırsatlar
Sadece bülten abonelerimize özel indirimler.

3. Haberler
Sektördeki son gelişmeler ve duyurular.

Görüşmek üzere,
{company}',
  'active',
  'tr'
);

-- 4. Hatırlatma Emaili
INSERT INTO email_templates (
  name, 
  description, 
  category, 
  subject, 
  preheader,
  body_html, 
  body_text,
  status,
  language
) VALUES (
  'Hatırlatma - Basit',
  'Randevu, ödeme vb. hatırlatmalar için',
  'transactional',
  '⏰ Hatırlatma: {first_name}',
  'Önemli bir hatırlatma',
  '<h2>Merhaba {first_name},</h2>

<p>Size önemli bir hatırlatma yapmak istiyoruz.</p>

<p><strong>Hatırlatma Detayları:</strong></p>
<ul>
  <li>Konu: [Konu buraya gelecek]</li>
  <li>Tarih: [Tarih buraya gelecek]</li>
  <li>Saat: [Saat buraya gelecek]</li>
</ul>

<p>Bu hatırlatmayı dikkate almanız önemlidir.</p>

<p>Herhangi bir sorunuz varsa lütfen bizimle iletişime geçin.</p>

<p>Saygılarımızla,<br>
{company}</p>',
  'Merhaba {first_name},

Size önemli bir hatırlatma yapmak istiyoruz.

Hatırlatma Detayları:
- Konu: [Konu buraya gelecek]
- Tarih: [Tarih buraya gelecek]
- Saat: [Saat buraya gelecek]

Bu hatırlatmayı dikkate almanız önemlidir.

Herhangi bir sorunuz varsa lütfen bizimle iletişime geçin.

Saygılarımızla,
{company}',
  'active',
  'tr'
);

-- 5. Teşekkür Emaili
INSERT INTO email_templates (
  name, 
  description, 
  category, 
  subject, 
  preheader,
  body_html, 
  body_text,
  status,
  language
) VALUES (
  'Teşekkür Mesajı - Basit',
  'Alışveriş veya işlem sonrası teşekkür',
  'transactional',
  '❤️ Teşekkür Ederiz, {first_name}!',
  'Bizi tercih ettiğiniz için teşekkürler',
  '<h2>Sevgili {first_name},</h2>

<p>Bizi tercih ettiğiniz için çok teşekkür ederiz!</p>

<p>Memnuniyetiniz bizim için en önemli önceliktir. Size en iyi hizmeti sunmak için çalışmaya devam edeceğiz.</p>

<p>Geri bildirimlerinizi duymaktan mutluluk duyarız.</p>

<p>Tekrar görüşmek dileğiyle,<br>
{company} Ekibi</p>',
  'Sevgili {first_name},

Bizi tercih ettiğiniz için çok teşekkür ederiz!

Memnuniyetiniz bizim için en önemli önceliktir. Size en iyi hizmeti sunmak için çalışmaya devam edeceğiz.

Geri bildirimlerinizi duymaktan mutluluk duyarız.

Tekrar görüşmek dileğiyle,
{company} Ekibi',
  'active',
  'tr'
);

-- 6. Duyuru Emaili
INSERT INTO email_templates (
  name, 
  description, 
  category, 
  subject, 
  preheader,
  body_html, 
  body_text,
  status,
  language
) VALUES (
  'Genel Duyuru - Basit',
  'Genel bilgilendirme ve duyurular için',
  'announcement',
  '📢 Önemli Duyuru - {first_name}',
  'Önemli bir güncelleme var',
  '<h2>Merhaba {first_name},</h2>

<h3>📢 Önemli Duyuru</h3>

<p>Sizleri önemli bir gelişme hakkında bilgilendirmek istiyoruz.</p>

<p><strong>Duyuru Detayları:</strong></p>
<p>[Duyuru metni buraya gelecek]</p>

<p>Bu değişiklik hakkında sorularınız varsa, lütfen bizimle iletişime geçmekten çekinmeyin.</p>

<p>Anlayışınız için teşekkür ederiz.</p>

<p>Saygılarımızla,<br>
{company} Yönetimi</p>',
  'Merhaba {first_name},

📢 Önemli Duyuru

Sizleri önemli bir gelişme hakkında bilgilendirmek istiyoruz.

Duyuru Detayları:
[Duyuru metni buraya gelecek]

Bu değişiklik hakkında sorularınız varsa, lütfen bizimle iletişime geçmekten çekinmeyin.

Anlayışınız için teşekkür ederiz.

Saygılarımızla,
{company} Yönetimi',
  'active',
  'tr'
);

-- 7. Takip Emaili
INSERT INTO email_templates (
  name, 
  description, 
  category, 
  subject, 
  preheader,
  body_html, 
  body_text,
  status,
  language
) VALUES (
  'Takip Mesajı - Basit',
  'İlk iletişim sonrası takip emaili',
  'follow_up',
  'Sizinle İletişime Geçmek İstiyoruz - {first_name}',
  'Sizi aramızda görmek isteriz',
  '<h2>Merhaba {first_name},</h2>

<p>Daha önce sizinle iletişime geçmiştik ve tekrar sizden haber almak istedik.</p>

<p>Size nasıl yardımcı olabileceğimizi merak ediyoruz. Sorularınız veya ihtiyaçlarınız varsa, lütfen bize bildirin.</p>

<p>İletişime geçmek için en uygun zaman ve yöntemi seçebilirsiniz:</p>
<ul>
  <li>Email: {email}</li>
  <li>Telefon: [Telefon numarası]</li>
</ul>

<p>Sizden haber bekliyoruz.</p>

<p>İyi günler,<br>
{company}</p>',
  'Merhaba {first_name},

Daha önce sizinle iletişime geçmiştik ve tekrar sizden haber almak istedik.

Size nasıl yardımcı olabileceğimizi merak ediyoruz. Sorularınız veya ihtiyaçlarınız varsa, lütfen bize bildirin.

İletişime geçmek için en uygun zaman ve yöntemi seçebilirsiniz:
- Email: {email}
- Telefon: [Telefon numarası]

Sizden haber bekliyoruz.

İyi günler,
{company}',
  'active',
  'tr'
);

-- 8. Ürün Tanıtımı
INSERT INTO email_templates (
  name, 
  description, 
  category, 
  subject, 
  preheader,
  body_html, 
  body_text,
  status,
  language
) VALUES (
  'Yeni Ürün Tanıtımı - Basit',
  'Yeni ürün lansmanı için email',
  'product_launch',
  '🚀 Yeni Ürünümüzü Keşfedin!',
  'İlk sizin öğrenmenizi istedik',
  '<h2>Merhaba {first_name},</h2>

<h3>🚀 Yeni Ürünümüzü Tanıtıyoruz!</h3>

<p>Heyecan verici bir haberimiz var! Yeni ürünümüz artık sizlerle.</p>

<p><strong>Ürün Özellikleri:</strong></p>
<ul>
  <li>Yenilikçi tasarım</li>
  <li>Kullanıcı dostu arayüz</li>
  <li>Uygun fiyat</li>
</ul>

<p>İlk alanlar için özel indirim fırsatı!</p>

<p>Daha fazla bilgi için bizimle iletişime geçin.</p>

<p>Heyecanlı günler,<br>
{company} Ekibi</p>',
  'Merhaba {first_name},

🚀 Yeni Ürünümüzü Tanıtıyoruz!

Heyecan verici bir haberimiz var! Yeni ürünümüz artık sizlerle.

Ürün Özellikleri:
- Yenilikçi tasarım
- Kullanıcı dostu arayüz
- Uygun fiyat

İlk alanlar için özel indirim fırsatı!

Daha fazla bilgi için bizimle iletişime geçin.

Heyecanlı günler,
{company} Ekibi',
  'active',
  'tr'
);

-- 9. Geri Bildirim İsteği
INSERT INTO email_templates (
  name, 
  description, 
  category, 
  subject, 
  preheader,
  body_html, 
  body_text,
  status,
  language
) VALUES (
  'Geri Bildirim İsteği - Basit',
  'Müşteri memnuniyeti ve geri bildirim toplama',
  'feedback',
  'Görüşünüz Bizim İçin Önemli, {first_name}',
  'Bize geri bildiriminizi paylaşır mısınız?',
  '<h2>Merhaba {first_name},</h2>

<p>Sizden hizmetlerimiz hakkında görüş almak istiyoruz.</p>

<p>Geri bildiriminiz, size daha iyi hizmet sunmamıza yardımcı olacak.</p>

<p><strong>Lütfen bize şunları söyleyin:</strong></p>
<ul>
  <li>Deneyiminiz nasıldı?</li>
  <li>Neyi beğendiniz?</li>
  <li>Neleri geliştirebiliriz?</li>
</ul>

<p>Sadece birkaç dakikanızı ayırmanız yeterli.</p>

<p>Katkılarınız için teşekkür ederiz!</p>

<p>Saygılarımızla,<br>
{company}</p>',
  'Merhaba {first_name},

Sizden hizmetlerimiz hakkında görüş almak istiyoruz.

Geri bildiriminiz, size daha iyi hizmet sunmamıza yardımcı olacak.

Lütfen bize şunları söyleyin:
- Deneyiminiz nasıldı?
- Neyi beğendiniz?
- Neleri geliştirebiliriz?

Sadece birkaç dakikanızı ayırmanız yeterli.

Katkılarınız için teşekkür ederiz!

Saygılarımızla,
{company}',
  'active',
  'tr'
);

-- 10. Davet Emaili
INSERT INTO email_templates (
  name, 
  description, 
  category, 
  subject, 
  preheader,
  body_html, 
  body_text,
  status,
  language
) VALUES (
  'Etkinlik Daveti - Basit',
  'Webinar, seminer veya etkinlik davetiyesi',
  'invitation',
  '🎊 Özel Davetimiz Var, {first_name}!',
  'Etkinliğimize katılın',
  '<h2>Merhaba {first_name},</h2>

<h3>🎊 Sizi Özel Etkinliğimize Davet Ediyoruz!</h3>

<p>Size özel olarak düzenlediğimiz etkinliğe katılmanızı isteriz.</p>

<p><strong>Etkinlik Detayları:</strong></p>
<ul>
  <li><strong>Konu:</strong> [Etkinlik konusu]</li>
  <li><strong>Tarih:</strong> [Tarih]</li>
  <li><strong>Saat:</strong> [Saat]</li>
  <li><strong>Yer:</strong> [Lokasyon/Online]</li>
</ul>

<p>Katılımınızı onaylamak için lütfen bize dönüş yapın.</p>

<p>Görüşmek üzere!</p>

<p>Saygılarımızla,<br>
{company} Organizasyon Ekibi</p>',
  'Merhaba {first_name},

🎊 Sizi Özel Etkinliğimize Davet Ediyoruz!

Size özel olarak düzenlediğimiz etkinliğe katılmanızı isteriz.

Etkinlik Detayları:
- Konu: [Etkinlik konusu]
- Tarih: [Tarih]
- Saat: [Saat]
- Yer: [Lokasyon/Online]

Katılımınızı onaylamak için lütfen bize dönüş yapın.

Görüşmek üzere!

Saygılarımızla,
{company} Organizasyon Ekibi',
  'active',
  'tr'
);

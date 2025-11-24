-- Email Template Örnekleri
-- Düz metin formatında, kullanıma hazır şablonlar
-- Not: Kategori 'welcome' olarak ayarlandı, sonrasında güncellenebilir

-- 1. Hoş Geldiniz Emaili
INSERT INTO email_templates (
  name, description, category, subject, preheader, body_html, body_text,
  from_name, from_email, priority, track_opens, track_clicks,
  available_variables, tags, language, status
) VALUES (
  'Hoş Geldiniz - Basit',
  'Yeni müşteriler için sade hoş geldiniz emaili',
  'welcome',
  'Hoş Geldiniz {first_name}!',
  'Aramıza katıldığınız için teşekkürler',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Hoş Geldiniz</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #2c3e50;">Merhaba {first_name}!</h1>
  
  <p>Aramıza katıldığınız için teşekkür ederiz.</p>
  
  <p>Bizi tercih ettiğiniz için çok mutluyuz. Size en iyi hizmeti sunmak için buradayız.</p>
  
  <p>Herhangi bir sorunuz olursa, bize ulaşmaktan çekinmeyin.</p>
  
  <p style="margin-top: 30px;">
    Saygılarımızla,<br>
    <strong>Teymur Tekstil Ekibi</strong>
  </p>
</body>
</html>',
  'Merhaba {first_name}!

Aramıza katıldığınız için teşekkür ederiz.

Bizi tercih ettiğiniz için çok mutluyuz. Size en iyi hizmeti sunmak için buradayız.

Herhangi bir sorunuz olursa, bize ulaşmaktan çekinmeyin.

Saygılarımızla,
Teymur Tekstil Ekibi',
  'Teymur Tekstil',
  'info@teymurtekstil.com',
  'normal',
  true,
  true,
  '["first_name", "last_name", "email"]',
  ARRAY['welcome', 'onboarding'],
  'tr',
  'active'
);

-- 2. Ürün Tanıtımı
INSERT INTO email_templates (
  name, description, category, subject, preheader, body_html, body_text,
  from_name, from_email, priority, track_opens, track_clicks,
  available_variables, tags, language, status
) VALUES (
  'Yeni Ürün Duyurusu',
  'Yeni ürün lansmanı için email şablonu',
  'welcome',
  'Yeni Koleksiyonumuz Çıktı! 🎉',
  'En yeni ürünlerimizi keşfedin',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Yeni Ürün</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #e74c3c;">🎉 Yeni Koleksiyonumuz Çıktı!</h1>
  
  <p>Merhaba {first_name},</p>
  
  <p>Sizi en yeni koleksiyonumuz hakkında bilgilendirmek istiyoruz!</p>
  
  <p><strong>Öne Çıkanlar:</strong></p>
  <ul>
    <li>Premium kalite kumaşlar</li>
    <li>Modern ve şık tasarımlar</li>
    <li>Uygun fiyatlar</li>
    <li>Hızlı teslimat</li>
  </ul>
  
  <p style="text-align: center; margin: 30px 0;">
    <a href="https://www.teymurtekstil.com/yeni-urunler" style="background-color: #e74c3c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Ürünleri İncele</a>
  </p>
  
  <p style="margin-top: 30px;">
    İyi alışverişler,<br>
    <strong>Teymur Tekstil</strong>
  </p>
</body>
</html>',
  'Merhaba {first_name},

🎉 YENİ KOLEKSİYONUMUZ ÇIKTI!

Sizi en yeni koleksiyonumuz hakkında bilgilendirmek istiyoruz!

Öne Çıkanlar:
• Premium kalite kumaşlar
• Modern ve şık tasarımlar
• Uygun fiyatlar
• Hızlı teslimat

Ürünlerimizi İncele: https://www.teymurtekstil.com/yeni-urunler

İyi alışverişler,
Teymur Tekstil',
  'Teymur Tekstil',
  'info@teymurtekstil.com',
  'normal',
  true,
  true,
  '["first_name", "last_name"]',
  ARRAY['promotion', 'product', 'announcement'],
  'tr',
  'active'
);

-- 3. İndirim Kampanyası
INSERT INTO email_templates (
  name, description, category, subject, preheader, body_html, body_text,
  from_name, from_email, priority, track_opens, track_clicks,
  available_variables, tags, language, status
) VALUES (
  'İndirim Kampanyası - %50',
  'Büyük indirim kampanyası duyurusu',
  'welcome',
  '🔥 %50 İndirim Başladı!',
  'Kaçırmayın! Sınırlı süre',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>İndirim</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #ff6b6b; color: white; padding: 20px; text-align: center; border-radius: 10px;">
    <h1 style="margin: 0; font-size: 32px;">🔥 %50 İNDİRİM!</h1>
    <p style="margin: 10px 0 0 0; font-size: 18px;">Sınırlı Süre - Kaçırmayın!</p>
  </div>
  
  <p style="margin-top: 30px;">Sayın {first_name},</p>
  
  <p><strong>Müjde!</strong> Tüm ürünlerimizde %50''ye varan indirimler başladı!</p>
  
  <p><strong>Kampanya Detayları:</strong></p>
  <ul>
    <li>📅 Süre: 3 gün</li>
    <li>🎯 Tüm kategorilerde geçerli</li>
    <li>🚚 Ücretsiz kargo</li>
    <li>💳 Taksit imkanı</li>
  </ul>
  
  <p style="text-align: center; margin: 30px 0;">
    <a href="https://www.teymurtekstil.com/kampanya" style="background-color: #ff6b6b; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 18px;">Hemen Alışverişe Başla</a>
  </p>
  
  <p style="color: #666; font-size: 12px; margin-top: 40px;">
    * Kampanya 27.11.2025 tarihinde sona erecektir.
  </p>
  
  <p style="margin-top: 30px;">
    Mutlu alışverişler dileriz,<br>
    <strong>Teymur Tekstil Ekibi</strong>
  </p>
</body>
</html>',
  'Sayın {first_name},

🔥 %50 İNDİRİM BAŞLADI!
Sınırlı Süre - Kaçırmayın!

MÜJDE! Tüm ürünlerimizde %50''ye varan indirimler başladı!

Kampanya Detayları:
📅 Süre: 3 gün
🎯 Tüm kategorilerde geçerli
🚚 Ücretsiz kargo
💳 Taksit imkanı

Hemen Alışverişe Başla: https://www.teymurtekstil.com/kampanya

* Kampanya 27.11.2025 tarihinde sona erecektir.

Mutlu alışverişler dileriz,
Teymur Tekstil Ekibi',
  'Teymur Tekstil',
  'info@teymurtekstil.com',
  'high',
  true,
  true,
  '["first_name", "last_name"]',
  ARRAY['promotion', 'sale', 'discount'],
  'tr',
  'active'
);

-- 4. Bülten (Newsletter)
INSERT INTO email_templates (
  name, description, category, subject, preheader, body_html, body_text,
  from_name, from_email, priority, track_opens, track_clicks,
  available_variables, tags, language, status
) VALUES (
  'Aylık Bülten',
  'Aylık haber ve güncelleme bülteni',
  'welcome',
  'Aylık Bülten - Kasım 2025',
  'Bu ayki yenilikler ve haberler',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Bülten</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #3498db; border-bottom: 3px solid #3498db; padding-bottom: 10px;">📰 Aylık Bülten</h1>
  
  <p>Merhaba {first_name},</p>
  
  <p>Bu ayki en önemli gelişmeleri sizler için derledik.</p>
  
  <h2 style="color: #2c3e50; margin-top: 30px;">📌 Bu Ay Neler Oldu?</h2>
  <ul>
    <li><strong>Yeni Koleksiyon:</strong> Sonbahar/Kış koleksiyonumuz yayında</li>
    <li><strong>Kampanyalar:</strong> Özel indirim günleri başladı</li>
    <li><strong>Blog:</strong> Kumaş bakım ipuçları yazımız yayınlandı</li>
  </ul>
  
  <h2 style="color: #2c3e50; margin-top: 30px;">🎯 Gelecek Ay</h2>
  <p>Aralık ayında sizleri yılbaşı özel kampanyalarımız bekliyor!</p>
  
  <p style="text-align: center; margin: 30px 0;">
    <a href="https://www.teymurtekstil.com/blog" style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Daha Fazlası</a>
  </p>
  
  <p style="margin-top: 40px;">
    İyi okumalar,<br>
    <strong>Teymur Tekstil</strong>
  </p>
  
  <hr style="margin: 40px 0; border: none; border-top: 1px solid #ddd;">
  
  <p style="font-size: 12px; color: #666;">
    Bu emaili almak istemiyorsanız <a href="https://www.teymurtekstil.com/unsubscribe">buradan</a> aboneliği iptal edebilirsiniz.
  </p>
</body>
</html>',
  'AYLIK BÜLTEN - Kasım 2025

Merhaba {first_name},

Bu ayki en önemli gelişmeleri sizler için derledik.

📌 BU AY NELER OLDU?
• Yeni Koleksiyon: Sonbahar/Kış koleksiyonumuz yayında
• Kampanyalar: Özel indirim günleri başladı
• Blog: Kumaş bakım ipuçları yazımız yayınlandı

🎯 GELECEK AY
Aralık ayında sizleri yılbaşı özel kampanyalarımız bekliyor!

Daha Fazlası: https://www.teymurtekstil.com/blog

İyi okumalar,
Teymur Tekstil

---
Bu emaili almak istemiyorsanız buradan aboneliği iptal edebilirsiniz:
https://www.teymurtekstil.com/unsubscribe',
  'Teymur Tekstil',
  'info@teymurtekstil.com',
  'normal',
  true,
  true,
  '["first_name"]',
  ARRAY['newsletter', 'monthly', 'updates'],
  'tr',
  'active'
);

-- 5. Sipariş Onayı
INSERT INTO email_templates (
  name, description, category, subject, preheader, body_html, body_text,
  from_name, from_email, priority, track_opens, track_clicks,
  available_variables, tags, language, status
) VALUES (
  'Sipariş Onayı',
  'Sipariş alındı bildirimi',
  'welcome',
  'Siparişiniz Alındı - #{order_number}',
  'Siparişiniz başarıyla oluşturuldu',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Sipariş Onayı</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #27ae60; color: white; padding: 20px; text-align: center; border-radius: 10px;">
    <h1 style="margin: 0;">✅ Siparişiniz Alındı!</h1>
  </div>
  
  <p style="margin-top: 30px;">Sayın {first_name} {last_name},</p>
  
  <p>Siparişiniz başarıyla alınmıştır. Teşekkür ederiz!</p>
  
  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
    <p style="margin: 0;"><strong>Sipariş Numarası:</strong> #{order_number}</p>
    <p style="margin: 10px 0 0 0;"><strong>Sipariş Tarihi:</strong> {order_date}</p>
  </div>
  
  <h2 style="color: #2c3e50;">📦 Sonraki Adımlar</h2>
  <ol>
    <li>Siparişiniz hazırlanacak</li>
    <li>Kargoya teslim edilecek</li>
    <li>Kargo takip numarası tarafınıza iletilecek</li>
  </ol>
  
  <p style="text-align: center; margin: 30px 0;">
    <a href="https://www.teymurtekstil.com/siparis/{order_number}" style="background-color: #27ae60; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Siparişimi Takip Et</a>
  </p>
  
  <p style="margin-top: 40px;">
    Herhangi bir sorunuz varsa bizimle iletişime geçebilirsiniz.<br>
    <strong>Teymur Tekstil Müşteri Hizmetleri</strong>
  </p>
</body>
</html>',
  'Sayın {first_name} {last_name},

✅ SİPARİŞİNİZ ALINDI!

Siparişiniz başarıyla alınmıştır. Teşekkür ederiz!

Sipariş Numarası: #{order_number}
Sipariş Tarihi: {order_date}

📦 SONRAKI ADIMLAR:
1. Siparişiniz hazırlanacak
2. Kargoya teslim edilecek
3. Kargo takip numarası tarafınıza iletilecek

Siparişimi Takip Et: https://www.teymurtekstil.com/siparis/{order_number}

Herhangi bir sorunuz varsa bizimle iletişime geçebilirsiniz.

Teymur Tekstil Müşteri Hizmetleri',
  'Teymur Tekstil',
  'siparis@teymurtekstil.com',
  'high',
  true,
  true,
  '["first_name", "last_name", "order_number", "order_date"]',
  ARRAY['transactional', 'order', 'confirmation'],
  'tr',
  'active'
);

-- 6. Hatırlatma
INSERT INTO email_templates (
  name, description, category, subject, preheader, body_html, body_text,
  from_name, from_email, priority, track_opens, track_clicks,
  available_variables, tags, language, status
) VALUES (
  'Sepet Hatırlatma',
  'Terk edilmiş sepet hatırlatması',
  'welcome',
  '{first_name}, Sepetinizde Ürünler Bekliyor! 🛒',
  'Sepetinizdeki ürünleri unutmayın',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Sepet Hatırlatma</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #e67e22;">🛒 Sepetinizde Ürünler Var!</h1>
  
  <p>Merhaba {first_name},</p>
  
  <p>Sepetinizde {cart_item_count} adet ürün bırakmışsınız.</p>
  
  <p>Bu harika ürünleri kaçırmayın! Stoklar tükenebilir.</p>
  
  <div style="background-color: #fff3cd; border-left: 4px solid #e67e22; padding: 15px; margin: 20px 0;">
    <p style="margin: 0;"><strong>💡 Özel Fırsat:</strong></p>
    <p style="margin: 5px 0 0 0;">Bu ürünleri bugün satın alırsanız ücretsiz kargo!</p>
  </div>
  
  <p style="text-align: center; margin: 30px 0;">
    <a href="https://www.teymurtekstil.com/sepet" style="background-color: #e67e22; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 18px;">Sepetime Dön</a>
  </p>
  
  <p style="margin-top: 40px;">
    Yardıma mı ihtiyacınız var? Bizimle iletişime geçin.<br>
    <strong>Teymur Tekstil</strong>
  </p>
</body>
</html>',
  'Merhaba {first_name},

🛒 SEPETİNİZDE ÜRÜNLER VAR!

Sepetinizde {cart_item_count} adet ürün bırakmışsınız.

Bu harika ürünleri kaçırmayın! Stoklar tükenebilir.

💡 ÖZEL FIRSAT:
Bu ürünleri bugün satın alırsanız ücretsiz kargo!

Sepetime Dön: https://www.teymurtekstil.com/sepet

Yardıma mı ihtiyacınız var? Bizimle iletişime geçin.

Teymur Tekstil',
  'Teymur Tekstil',
  'info@teymurtekstil.com',
  'normal',
  true,
  true,
  '["first_name", "cart_item_count"]',
  ARRAY['reminder', 'cart', 'abandoned'],
  'tr',
  'active'
);

-- 7. Teşekkür
INSERT INTO email_templates (
  name, description, category, subject, preheader, body_html, body_text,
  from_name, from_email, priority, track_opens, track_clicks,
  available_variables, tags, language, status
) VALUES (
  'Teşekkür Emaili',
  'Alışveriş sonrası teşekkür',
  'welcome',
  'Alışverişiniz İçin Teşekkürler! 🙏',
  'Deneyiminizi paylaşır mısınız?',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Teşekkürler</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #9b59b6;">🙏 Teşekkürler!</h1>
  
  <p>Sayın {first_name},</p>
  
  <p>Bizi tercih ettiğiniz için çok teşekkür ederiz!</p>
  
  <p>Ürünlerinizi beğendiğinizi umuyoruz. Deneyiminizi bizimle paylaşır mısınız?</p>
  
  <p style="text-align: center; margin: 30px 0;">
    <a href="https://www.teymurtekstil.com/yorum-yap/{order_number}" style="background-color: #9b59b6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Yorum Yap</a>
  </p>
  
  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 30px 0;">
    <h3 style="margin-top: 0; color: #2c3e50;">🎁 Özel İndirim</h3>
    <p style="margin-bottom: 0;">Bir sonraki alışverişinizde kullanabileceğiniz <strong>%10 indirim kodu:</strong></p>
    <p style="font-size: 24px; font-weight: bold; color: #9b59b6; margin: 10px 0;">TESEKKUR10</p>
  </div>
  
  <p>Sizlere hizmet etmekten mutluluk duyuyoruz.</p>
  
  <p style="margin-top: 30px;">
    İyi günler,<br>
    <strong>Teymur Tekstil Ekibi</strong>
  </p>
</body>
</html>',
  'Sayın {first_name},

🙏 TEŞEKKÜRLER!

Bizi tercih ettiğiniz için çok teşekkür ederiz!

Ürünlerinizi beğendiğinizi umuyoruz. Deneyiminizi bizimle paylaşır mısınız?

Yorum Yap: https://www.teymurtekstil.com/yorum-yap/{order_number}

🎁 ÖZEL İNDİRİM
Bir sonraki alışverişinizde kullanabileceğiniz %10 indirim kodu:

TESEKKUR10

Sizlere hizmet etmekten mutluluk duyuyoruz.

İyi günler,
Teymur Tekstil Ekibi',
  'Teymur Tekstil',
  'info@teymurtekstil.com',
  'normal',
  true,
  true,
  '["first_name", "order_number"]',
  ARRAY['followup', 'thankyou', 'review'],
  'tr',
  'active'
);

-- 8. Özel Gün Kutlaması
INSERT INTO email_templates (
  name, description, category, subject, preheader, body_html, body_text,
  from_name, from_email, priority, track_opens, track_clicks,
  available_variables, tags, language, status
) VALUES (
  'Doğum Günü Kutlaması',
  'Müşteri doğum günü kutlama emaili',
  'welcome',
  '🎂 Mutlu Yıllar {first_name}!',
  'Sizin için özel bir hediyemiz var',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Doğum Günün Kutlu Olsun</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 10px;">
    <h1 style="margin: 0; font-size: 36px;">🎂 MUTLU YILLAR!</h1>
    <p style="margin: 10px 0 0 0; font-size: 20px;">{first_name}</p>
  </div>
  
  <p style="margin-top: 30px; font-size: 18px;">Değerli {first_name},</p>
  
  <p>Doğum gününüzü kutlar, nice mutlu yıllar dileriz! 🎉</p>
  
  <p>Bu özel gününüzü sizinle kutlamak için bir hediyemiz var:</p>
  
  <div style="background-color: #fff3cd; border: 2px dashed #ffc107; padding: 25px; border-radius: 10px; margin: 30px 0; text-align: center;">
    <p style="margin: 0; font-size: 16px;">🎁 DOĞUM GÜNÜ HEDİYENİZ</p>
    <p style="font-size: 32px; font-weight: bold; color: #667eea; margin: 15px 0;">%20 İNDİRİM</p>
    <p style="margin: 0; font-size: 14px; color: #666;">Kod: DOGUMGUNU20</p>
    <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">* Bu ay boyunca geçerli</p>
  </div>
  
  <p style="text-align: center; margin: 30px 0;">
    <a href="https://www.teymurtekstil.com" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 18px;">Hemen Alışverişe Başla</a>
  </p>
  
  <p style="margin-top: 40px;">
    En içten dileklerimizle,<br>
    <strong>Teymur Tekstil Ailesi</strong>
  </p>
</body>
</html>',
  'Değerli {first_name},

🎂 MUTLU YILLAR!

Doğum gününüzü kutlar, nice mutlu yıllar dileriz! 🎉

Bu özel gününüzü sizinle kutlamak için bir hediyemiz var:

🎁 DOĞUM GÜNÜ HEDİYENİZ
%20 İNDİRİM

Kod: DOGUMGUNU20
* Bu ay boyunca geçerli

Hemen Alışverişe Başla: https://www.teymurtekstil.com

En içten dileklerimizle,
Teymur Tekstil Ailesi',
  'Teymur Tekstil',
  'info@teymurtekstil.com',
  'normal',
  true,
  true,
  '["first_name"]',
  ARRAY['special', 'birthday', 'celebration'],
  'tr',
  'active'
);

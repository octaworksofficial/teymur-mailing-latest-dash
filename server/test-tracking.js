/**
 * Email Tracking Test Script
 * Tracking sisteminin nasıl çalıştığını gösterir
 */

const { addTrackingToEmail, generateTestUrls } = require('./utils/emailTracking');

// Test HTML içeriği
const testHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Test Email</title>
</head>
<body>
  <h1>Merhaba {first_name}!</h1>
  <p>Bu bir test emailidir.</p>
  
  <p>
    <a href="https://www.example.com">Web Sitemizi Ziyaret Edin</a>
  </p>
  
  <p>
    <a href="https://www.example.com/products">Ürünlerimizi Görün</a>
  </p>
  
  <p>
    İletişim: <a href="mailto:info@example.com">info@example.com</a> |
    Telefon: <a href="tel:+905551234567">+90 555 123 45 67</a>
  </p>
  
  <p style="color: #999; font-size: 12px;">
    Bu emaili almak istemiyorsanız <a href="https://www.example.com/unsubscribe">buradan</a> abonelikten çıkabilirsiniz.
  </p>
</body>
</html>
`;

// Örnek tracking ID (gerçek UUID kullanılmalı)
const testTrackingId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

console.log('🔬 EMAIL TRACKING TEST\n');
console.log('=' .repeat(80));

// 1. Test URL'lerini göster
console.log('\n📍 TRACKING URL\'LERİ:\n');
const urls = generateTestUrls(testTrackingId);
console.log('Pixel URL (Email Açılma):');
console.log(`  ${urls.pixelUrl}`);
console.log('\nLink Tracking URL Örneği:');
console.log(`  ${urls.clickUrl('https://www.example.com')}`);

// 2. HTML'e tracking ekle
console.log('\n\n🔧 TRACKING EKLENİYOR...\n');
const trackedHTML = addTrackingToEmail(testHTML, testTrackingId);

// 3. Sonucu göster
console.log('✅ TRACKING EKLENDİ!\n');
console.log('=' .repeat(80));
console.log('TRACKED HTML:\n');
console.log(trackedHTML);
console.log('\n' + '='.repeat(80));

// 4. Değişiklikleri özetle
console.log('\n📊 DEĞİŞİKLİKLER:\n');

const originalLinks = (testHTML.match(/<a\s+[^>]*href=/gi) || []).length;
const trackedLinks = (trackedHTML.match(/<a\s+[^>]*href=/gi) || []).length;
const trackingPixels = (trackedHTML.match(/tracking\/open/g) || []).length;
const trackingClicks = (trackedHTML.match(/tracking\/click/g) || []).length;

console.log(`  Orijinal linkler: ${originalLinks}`);
console.log(`  Tracking linkleri: ${trackedLinks}`);
console.log(`  Tracking pixel'ler: ${trackingPixels}`);
console.log(`  Tracking click'ler: ${trackingClicks}`);

console.log('\n✨ Test tamamlandı!\n');

// 5. Beklenen davranışları açıkla
console.log('📝 BEKLENEN DAVRANIŞ:\n');
console.log('  ✓ mailto: ve tel: linkleri değiştirilMEMELİ');
console.log('  ✓ Normal HTTP(S) linkleri tracking URL ile wrap edilMELİ');
console.log('  ✓ Body sonuna 1x1 invisible pixel eklenMELİ');
console.log('  ✓ Email açılınca pixel yüklenir → is_opened = true');
console.log('  ✓ Link tıklanınca tracking kaydedilir → is_clicked = true');
console.log('  ✓ Her event email_tracking_events tablosuna kaydedilir\n');

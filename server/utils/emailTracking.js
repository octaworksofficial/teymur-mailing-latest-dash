/**
 * Email Tracking Utilities
 * Email HTML içeriğine tracking pixel ve link tracking ekler
 */

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3001';

/**
 * Email HTML'ine tracking ekler
 * @param {string} htmlContent - Orijinal email HTML içeriği
 * @param {string} trackingId - Campaign send tracking UUID
 * @returns {string} - Tracking eklenmiş HTML içerik
 */
function addTrackingToEmail(htmlContent, trackingId) {
  if (!htmlContent || !trackingId) {
    console.warn('⚠️  addTrackingToEmail: HTML veya trackingId eksik');
    return htmlContent;
  }

  let processedHtml = htmlContent;

  // 1. Tracking Pixel Ekle (Email açılma takibi)
  processedHtml = addTrackingPixel(processedHtml, trackingId);

  // 2. Tüm linklere tracking ekle
  processedHtml = addLinkTracking(processedHtml, trackingId);

  return processedHtml;
}

/**
 * Email sonuna 1x1 invisible tracking pixel ekler
 * @param {string} html - HTML içerik
 * @param {string} trackingId - Tracking UUID
 * @returns {string} - Pixel eklenmiş HTML
 */
function addTrackingPixel(html, trackingId) {
  const pixelUrl = `${BASE_URL}/api/tracking/open/${trackingId}`;
  
  // Tracking pixel HTML
  const pixelTag = `<img src="${pixelUrl}" width="1" height="1" style="display:none !important; width:1px !important; height:1px !important; border:0 !important; margin:0 !important; padding:0 !important;" alt="" />`;

  // </body> taginden önce ekle, yoksa en sona ekle
  if (html.includes('</body>')) {
    return html.replace('</body>', `${pixelTag}\n</body>`);
  } else {
    return html + '\n' + pixelTag;
  }
}

/**
 * HTML içindeki tüm linklere tracking ekler
 * @param {string} html - HTML içerik
 * @param {string} trackingId - Tracking UUID
 * @returns {string} - Link tracking eklenmiş HTML
 */
function addLinkTracking(html, trackingId) {
  // <a> taglerini bul ve href'lerini tracking URL'leri ile wrap et
  const linkRegex = /<a\s+([^>]*?)href=["']([^"']+)["']([^>]*)>/gi;
  
  return html.replace(linkRegex, (match, before, originalUrl, after) => {
    // mailto:, tel:, # gibi özel protokolleri tracking'den muaf tut
    if (
      originalUrl.startsWith('mailto:') ||
      originalUrl.startsWith('tel:') ||
      originalUrl.startsWith('#') ||
      originalUrl.startsWith('javascript:') ||
      originalUrl.trim() === ''
    ) {
      return match; // Değiştirme
    }

    // Tracking URL'i oluştur
    const trackingUrl = `${BASE_URL}/api/tracking/click/${trackingId}?url=${encodeURIComponent(originalUrl)}`;

    // Yeni <a> tag'i
    return `<a ${before}href="${trackingUrl}"${after}>`;
  });
}

/**
 * Email içeriğindeki değişkenleri contact bilgileriyle değiştirir
 * @param {string} html - HTML içerik
 * @param {object} contact - Contact bilgileri
 * @returns {string} - Personalize edilmiş HTML
 */
function personalizeEmail(html, contact) {
  if (!html || !contact) return html;

  let personalized = html;

  // Değişken mapping (tüm contact alanları dahil)
  const variables = {
    '{{ad}}': contact.first_name || '',
    '{{soyad}}': contact.last_name || '',
    '{{email}}': contact.email || '',
    '{{telefon}}': contact.phone || '',
    '{{mobilTelefon}}': contact.mobile_phone || '',
    '{{sirket}}': contact.company || '',
    '{{firmaUnvan}}': contact.company_title || '',
    '{{pozisyon}}': contact.position || '',
    '{{adSoyad}}': `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
    '{{musteriTemsilcisi}}': contact.customer_representative || '',
    '{{ulke}}': contact.country || '',
    '{{il}}': contact.state || '',
    '{{ilce}}': contact.district || '',
    '{{adres1}}': contact.address_1 || '',
    '{{adres2}}': contact.address_2 || '',
    '{{onemDerecesi}}': contact.importance_level ? String(contact.importance_level) : '',
    '{{notlar}}': contact.notes || '',
  };

  // Tüm değişkenleri değiştir
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    personalized = personalized.replace(regex, variables[key]);
  });

  return personalized;
}

/**
 * Test için tracking URL'lerini generate et
 * @param {string} trackingId - Tracking UUID
 * @returns {object} - Test URL'leri
 */
function generateTestUrls(trackingId) {
  return {
    pixelUrl: `${BASE_URL}/api/tracking/open/${trackingId}`,
    clickUrl: (originalUrl) => `${BASE_URL}/api/tracking/click/${trackingId}?url=${encodeURIComponent(originalUrl)}`,
  };
}

module.exports = {
  addTrackingToEmail,
  addTrackingPixel,
  addLinkTracking,
  personalizeEmail,
  generateTestUrls,
};

/**
 * VML Fallback Utility
 * 
 * Eski Outlook istemcileri (2007, 2010, 2013, 2016, 2019) Microsoft Word
 * rendering engine kullanır ve modern CSS'i desteklemez.
 * 
 * Bu modül:
 * 1. Background image'lara VML fallback ekler
 * 2. Görsellere width/height attribute ekler (Word rendering için)
 * 3. Table-based layout için gerekli düzenlemeleri yapar
 */

const cheerio = require('cheerio');

/**
 * HTML email içeriğine Outlook VML fallback ekler
 * @param {string} html - Orijinal HTML içeriği
 * @returns {string} - VML fallback eklenmiş HTML
 */
function addVMLFallback(html) {
  if (!html) return html;

  try {
    const $ = cheerio.load(html, {
      xmlMode: false,
      decodeEntities: false,
    });

    // 1. Tüm img elementlerine width/height attribute ekle
    $('img').each((_, img) => {
      const $img = $(img);
      const style = $img.attr('style') || '';
      
      // Style'dan width/height çıkar
      const widthMatch = style.match(/width:\s*(\d+)px/i);
      const heightMatch = style.match(/height:\s*(\d+)px/i);
      
      if (widthMatch && !$img.attr('width')) {
        $img.attr('width', widthMatch[1]);
      }
      if (heightMatch && !$img.attr('height')) {
        $img.attr('height', heightMatch[1]);
      }
      
      // Border attribute ekle (Outlook için)
      if (!$img.attr('border')) {
        $img.attr('border', '0');
      }
      
      // Display block ekle
      const currentStyle = $img.attr('style') || '';
      if (!currentStyle.includes('display')) {
        $img.attr('style', `${currentStyle}; display: block;`.replace(/^;\s*/, ''));
      }
    });

    // 2. Background-image olan elementlere VML fallback ekle
    $('[style*="background-image"]').each((_, el) => {
      const $el = $(el);
      const style = $el.attr('style') || '';
      
      // Background image URL'ini çıkar
      const bgMatch = style.match(/background-image:\s*url\(['"]?([^'")]+)['"]?\)/i);
      if (!bgMatch) return;
      
      const bgUrl = bgMatch[1];
      
      // Element boyutlarını al
      const widthMatch = style.match(/width:\s*(\d+)px/i);
      const heightMatch = style.match(/height:\s*(\d+)px/i);
      
      const width = widthMatch ? widthMatch[1] : '600';
      const height = heightMatch ? heightMatch[1] : '200';
      
      // Mevcut içeriği al
      const innerContent = $el.html();
      
      // VML wrapper oluştur
      const vmlWrapper = `
<!--[if gte mso 9]>
<v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:${width}px;height:${height}px;">
<v:fill type="tile" src="${bgUrl}" />
<v:textbox inset="0,0,0,0">
<![endif]-->
${innerContent}
<!--[if gte mso 9]>
</v:textbox>
</v:rect>
<![endif]-->`;

      $el.html(vmlWrapper);
    });

    // 3. DOCTYPE ve XML namespace ekle (eğer yoksa)
    let result = $.html();
    
    // HTML tag'ine VML namespace ekle
    if (!result.includes('xmlns:v=')) {
      result = result.replace(
        /<html([^>]*)>/i,
        '<html$1 xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">'
      );
    }
    
    // Head'e VML behavior ekle
    if (!result.includes('v\\:*')) {
      const vmlStyle = `
<!--[if gte mso 9]>
<style>
v\\:* { behavior: url(#default#VML); display: inline-block; }
o\\:* { behavior: url(#default#VML); display: inline-block; }
</style>
<![endif]-->`;
      
      result = result.replace('</head>', `${vmlStyle}\n</head>`);
    }

    return result;
  } catch (error) {
    console.error('VML fallback ekleme hatası:', error.message);
    return html; // Hata durumunda orijinal HTML'i döndür
  }
}

/**
 * Outlook için güvenli tablo yapısına dönüştürür
 * @param {string} html - Orijinal HTML
 * @returns {string} - Table-safe HTML
 */
function makeTableSafe(html) {
  if (!html) return html;

  try {
    const $ = cheerio.load(html, {
      xmlMode: false,
      decodeEntities: false,
    });

    // Tüm table'lara gerekli attribute'ları ekle
    $('table').each((_, table) => {
      const $table = $(table);
      
      if (!$table.attr('border')) {
        $table.attr('border', '0');
      }
      if (!$table.attr('cellpadding')) {
        $table.attr('cellpadding', '0');
      }
      if (!$table.attr('cellspacing')) {
        $table.attr('cellspacing', '0');
      }
      if (!$table.attr('role')) {
        $table.attr('role', 'presentation');
      }
    });

    // TD'lere valign ekle
    $('td').each((_, td) => {
      const $td = $(td);
      if (!$td.attr('valign')) {
        $td.attr('valign', 'top');
      }
    });

    return $.html();
  } catch (error) {
    console.error('Table-safe dönüşüm hatası:', error.message);
    return html;
  }
}

/**
 * Email HTML'ini Outlook-uyumlu hale getirir
 * Tüm VML ve table-safe işlemlerini uygular
 * @param {string} html - Orijinal HTML
 * @returns {string} - Outlook-uyumlu HTML
 */
function makeOutlookCompatible(html) {
  if (!html) return html;
  
  let result = html;
  
  // 1. Table-safe yap
  result = makeTableSafe(result);
  
  // 2. VML fallback ekle
  result = addVMLFallback(result);
  
  return result;
}

/**
 * Sadece görsellere gerekli attribute'ları ekler
 * (Hafif versiyon - sadece img tag'leri için)
 * @param {string} html - Orijinal HTML
 * @returns {string} - Düzenlenmiş HTML
 */
function fixImagesForOutlook(html) {
  if (!html) return html;

  try {
    const $ = cheerio.load(html, {
      xmlMode: false,
      decodeEntities: false,
    });

    $('img').each((_, img) => {
      const $img = $(img);
      const style = $img.attr('style') || '';
      const src = $img.attr('src') || '';
      
      // Base64 görsellerini kontrol et - çok büyükse uyar
      if (src.startsWith('data:image') && src.length > 100000) {
        console.warn('⚠️ Çok büyük base64 görsel tespit edildi. Outlook\'ta sorun çıkabilir.');
      }
      
      // Width/height attribute ekle
      const widthMatch = style.match(/width:\s*(\d+)px/i);
      const heightMatch = style.match(/height:\s*(\d+)px/i);
      
      if (widthMatch && !$img.attr('width')) {
        $img.attr('width', widthMatch[1]);
      }
      if (heightMatch && !$img.attr('height')) {
        $img.attr('height', heightMatch[1]);
      }
      
      // Border=0 ekle
      if (!$img.attr('border')) {
        $img.attr('border', '0');
      }
      
      // Alt attribute ekle (eğer yoksa)
      if (!$img.attr('alt')) {
        $img.attr('alt', '');
      }
      
      // Style düzenle
      let newStyle = style;
      if (!newStyle.includes('display')) {
        newStyle = `display: block; ${newStyle}`;
      }
      if (!newStyle.includes('-ms-interpolation-mode')) {
        newStyle = `${newStyle}; -ms-interpolation-mode: bicubic;`;
      }
      $img.attr('style', newStyle.replace(/;\s*;/g, ';').trim());
    });

    return $.html();
  } catch (error) {
    console.error('Görsel düzenleme hatası:', error.message);
    return html;
  }
}

module.exports = {
  addVMLFallback,
  makeTableSafe,
  makeOutlookCompatible,
  fixImagesForOutlook,
};

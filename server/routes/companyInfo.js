const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// GET /api/company-info - Kurumsal bilgileri getir
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM company_info WHERE id = 1');
    
    if (result.rows.length === 0) {
      // Eğer kayıt yoksa, boş bir kayıt oluştur
      const createResult = await pool.query(`
        INSERT INTO company_info (id, company_name, country)
        VALUES (1, 'Şirket Adı', 'Türkiye')
        RETURNING *
      `);
      return res.json({ success: true, data: createResult.rows[0] });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get company info error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/company-info - Kurumsal bilgileri güncelle
router.put('/', async (req, res) => {
  try {
    const {
      company_name,
      company_slogan,
      company_description,
      mission,
      vision,
      logo_url,
      favicon_url,
      cover_image_url,
      address_line1,
      address_line2,
      city,
      state_province,
      postal_code,
      country,
      phone_primary,
      phone_secondary,
      phone_fax,
      whatsapp_number,
      email_general,
      email_support,
      email_sales,
      website_url,
      facebook_url,
      twitter_url,
      instagram_url,
      linkedin_url,
      youtube_url,
      business_hours,
      gallery_photos,
      products,
      team_members,
      certifications,
      awards,
      stats,
      tax_number,
      trade_registry_number,
      legal_name,
      seo_keywords,
      meta_description,
      is_active,
      default_currency,
      default_language,
      timezone,
    } = req.body;

    const query = `
      UPDATE company_info SET
        company_name = COALESCE($1, company_name),
        company_slogan = $2,
        company_description = $3,
        mission = $4,
        vision = $5,
        logo_url = $6,
        favicon_url = $7,
        cover_image_url = $8,
        address_line1 = $9,
        address_line2 = $10,
        city = $11,
        state_province = $12,
        postal_code = $13,
        country = $14,
        phone_primary = $15,
        phone_secondary = $16,
        phone_fax = $17,
        whatsapp_number = $18,
        email_general = $19,
        email_support = $20,
        email_sales = $21,
        website_url = $22,
        facebook_url = $23,
        twitter_url = $24,
        instagram_url = $25,
        linkedin_url = $26,
        youtube_url = $27,
        business_hours = $28,
        gallery_photos = $29,
        products = $30,
        team_members = $31,
        certifications = $32,
        awards = $33,
        stats = $34,
        tax_number = $35,
        trade_registry_number = $36,
        legal_name = $37,
        seo_keywords = $38,
        meta_description = $39,
        is_active = COALESCE($40, is_active),
        default_currency = COALESCE($41, default_currency),
        default_language = COALESCE($42, default_language),
        timezone = COALESCE($43, timezone),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
      RETURNING *
    `;

    const values = [
      company_name,
      company_slogan,
      company_description,
      mission,
      vision,
      logo_url,
      favicon_url,
      cover_image_url,
      address_line1,
      address_line2,
      city,
      state_province,
      postal_code,
      country,
      phone_primary,
      phone_secondary,
      phone_fax,
      whatsapp_number,
      email_general,
      email_support,
      email_sales,
      website_url,
      facebook_url,
      twitter_url,
      instagram_url,
      linkedin_url,
      youtube_url,
      business_hours,
      gallery_photos ? JSON.stringify(gallery_photos) : null,
      products ? JSON.stringify(products) : null,
      team_members ? JSON.stringify(team_members) : null,
      certifications ? JSON.stringify(certifications) : null,
      awards ? JSON.stringify(awards) : null,
      stats ? JSON.stringify(stats) : null,
      tax_number,
      trade_registry_number,
      legal_name,
      seo_keywords,
      meta_description,
      is_active,
      default_currency,
      default_language,
      timezone,
    ];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Kurumsal bilgi kaydı bulunamadı' });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Kurumsal bilgiler başarıyla güncellendi',
    });
  } catch (error) {
    console.error('Update company info error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

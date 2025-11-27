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
        company_slogan = COALESCE($2, company_slogan),
        company_description = COALESCE($3, company_description),
        mission = COALESCE($4, mission),
        vision = COALESCE($5, vision),
        logo_url = COALESCE($6, logo_url),
        favicon_url = COALESCE($7, favicon_url),
        cover_image_url = COALESCE($8, cover_image_url),
        address_line1 = COALESCE($9, address_line1),
        address_line2 = COALESCE($10, address_line2),
        city = COALESCE($11, city),
        state_province = COALESCE($12, state_province),
        postal_code = COALESCE($13, postal_code),
        country = COALESCE($14, country),
        phone_primary = COALESCE($15, phone_primary),
        phone_secondary = COALESCE($16, phone_secondary),
        phone_fax = COALESCE($17, phone_fax),
        whatsapp_number = COALESCE($18, whatsapp_number),
        email_general = COALESCE($19, email_general),
        email_support = COALESCE($20, email_support),
        email_sales = COALESCE($21, email_sales),
        website_url = COALESCE($22, website_url),
        facebook_url = COALESCE($23, facebook_url),
        twitter_url = COALESCE($24, twitter_url),
        instagram_url = COALESCE($25, instagram_url),
        linkedin_url = COALESCE($26, linkedin_url),
        youtube_url = COALESCE($27, youtube_url),
        business_hours = COALESCE($28, business_hours),
        gallery_photos = COALESCE($29, gallery_photos),
        products = COALESCE($30, products),
        team_members = COALESCE($31, team_members),
        certifications = COALESCE($32, certifications),
        awards = COALESCE($33, awards),
        stats = COALESCE($34, stats),
        tax_number = COALESCE($35, tax_number),
        trade_registry_number = COALESCE($36, trade_registry_number),
        legal_name = COALESCE($37, legal_name),
        seo_keywords = COALESCE($38, seo_keywords),
        meta_description = COALESCE($39, meta_description),
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

# Email Template Değişkenleri (Variables)

Email şablonlarında kullanabileceğiniz kişiselleştirme değişkenleri:

## Temel Bilgiler

- `{{ad}}` veya `{first_name}` - Müşterinin adı
- `{{soyad}}` veya `{last_name}` - Müşterinin soyadı
- `{{adSoyad}}` veya `{full_name}` - Tam ad (Ad + Soyad)
- `{{email}}` veya `{email}` - E-posta adresi

## İletişim Bilgileri

- `{{telefon}}` veya `{phone}` - Sabit telefon
- `{{mobilTelefon}}` veya `{mobile_phone}` - Mobil telefon

## Firma Bilgileri

- `{{sirket}}` veya `{company}` - Şirket adı
- `{{firmaUnvan}}` veya `{company_title}` - Firma ünvanı
- `{{pozisyon}}` veya `{position}` - Pozisyon/Görev

## Müşteri Yönetimi

- `{{musteriTemsilcisi}}` veya `{customer_representative}` - Müşteri temsilcisi
- `{{onemDerecesi}}` veya `{importance_level}` - Önem derecesi (1-10)
- `{{notlar}}` veya `{notes}` - Notlar

## Adres Bilgileri

- `{{ulke}}` veya `{country}` - Ülke
- `{{il}}` veya `{state}` - İl
- `{{ilce}}` veya `{district}` - İlçe
- `{{adres1}}` veya `{address_1}` - Adres 1
- `{{adres2}}` veya `{address_2}` - Adres 2

## Özel Alanlar (Custom Fields)

**ÖNEMLİ:** Özel alanları kullanmak için Excel'deki kolon başlığını **aynen** kullanın!

### ✅ DOĞRU Kullanım:
Excel'de "Departman" kolonunuz varsa:
- `{{Departman}}` veya `{Departman}`

Excel'de "Uyelik_Tipi" kolonunuz varsa:
- `{{Uyelik_Tipi}}` veya `{Uyelik_Tipi}`

Excel'de "VIP Durum" kolonunuz varsa:
- `{{VIP Durum}}` veya `{VIP Durum}`

### ❌ YANLIŞ Kullanım:
- `{{custom_Departman}}` ← **KULLANMAYIN**
- `{{custom_field_1_name}}` ← **KULLANMAYIN**
- `{custom_field_1_value}` ← **KULLANMAYIN**

**Kural:** Excel'deki kolon başlığı ne ise, onu süslü parantez içine yazın. `custom_` öneki eklemeyin!

## Kullanım Örnekleri

### Türkçe Format ({{...}})
```html
<p>Sayın {{adSoyad}},</p>
<p>{{sirket}} şirketinde {{pozisyon}} olarak görev yaptığınızı biliyoruz.</p>
<p>Müşteri temsilciniz: {{musteriTemsilcisi}}</p>
<p>İletişim: {{telefon}} / {{mobilTelefon}}</p>

<!-- Özel alanlar -->
<p>Departmanınız: {{Departman}}</p>
<p>Üyelik Yılınız: {{Uyelik_Yili}}</p>
```

### İngilizce Format ({...})
```html
<p>Dear {full_name},</p>
<p>We know you work as {position} at {company}.</p>
<p>Your customer representative: {customer_representative}</p>
<p>Contact: {phone} / {mobile_phone}</p>

<!-- Custom fields -->
<p>Your department: {Departman}</p>
<p>Membership year: {Uyelik_Yili}</p>
```

## Notlar

- Her iki format da desteklenir: `{{...}}` (Türkçe) ve `{...}` (İngilizce)
- Eğer bir alan boşsa, otomatik olarak boş string ile değiştirilir
- Özel alanlar Excel başlığıyla **birebir aynı** yazılmalıdır (büyük/küçük harf, boşluk, özel karakter dahil)
- Template içinde kullanılmayan değişkenler etkilenmez

---

## 🔗 İlgili Dokümanlar

- **n8n Email Tracking Kurulumu:** `docs/N8N_EMAIL_TRACKING_SETUP.md`
- **Excel Import Rehberi:** `EXCEL_IMPORT_GUIDE.md`
- **Email Tracking:** `docs/EMAIL_TRACKING.md`

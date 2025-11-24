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

Özel alanları kullanmak için:
- `{custom_alan_adi}` formatını kullanın
- Örnek: Eğer "departman" adında özel alan varsa: `{custom_departman}`

## Kullanım Örnekleri

### Türkçe Format ({{...}})
```html
<p>Sayın {{adSoyad}},</p>
<p>{{sirket}} şirketinde {{pozisyon}} olarak görev yaptığınızı biliyoruz.</p>
<p>Müşteri temsilciniz: {{musteriTemsilcisi}}</p>
<p>İletişim: {{telefon}} / {{mobilTelefon}}</p>
```

### İngilizce Format ({...})
```html
<p>Dear {full_name},</p>
<p>We know you work as {position} at {company}.</p>
<p>Your customer representative: {customer_representative}</p>
<p>Contact: {phone} / {mobile_phone}</p>
```

## Notlar

- Her iki format da desteklenir: `{{...}}` (Türkçe) ve `{...}` (İngilizce)
- Eğer bir alan boşsa, otomatik olarak boş string ile değiştirilir
- Özel alanlar sadece `{custom_...}` formatında kullanılabilir
- Template içinde kullanılmayan değişkenler etkilenmez

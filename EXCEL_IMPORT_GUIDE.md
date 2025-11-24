# 📊 Excel Import/Export Kullanım Kılavuzu

## 🎯 Genel Bakış

Bu özellik sayesinde kişilerinizi toplu olarak Excel dosyası ile sisteme aktarabilir veya mevcut kişilerinizi Excel formatında dışa aktarabilirsiniz.

## 📥 Excel Import (İçe Aktarma)

### Adım 1: Şablon İndirin
1. Kişiler sayfasına gidin
2. **"📋 Şablon İndir"** butonuna tıklayın
3. `kisiler_import_sablonu.xlsx` dosyası indirilecektir

### Adım 2: Excel Dosyasını Doldurun

#### 📋 Zorunlu Kolonlar
- **email**: Geçerli bir email adresi (örn: ahmet@email.com)

#### 📝 İsteğe Bağlı Kolonlar
- **first_name**: Ad
- **last_name**: Soyad
- **company**: Şirket adı
- **position**: Pozisyon/Unvan
- **phone**: Telefon numarası
- **source**: Kaynak (manuel, website, import, api vb.)
- **status**: Durum (active, unsubscribed, bounced, complained)
- **subscription_status**: Abonelik durumu (subscribed, unsubscribed, pending)

#### 🏷️ Etiketler (Tags)
- **tags**: Virgülle ayrılmış etiketler
- Örnek: `vip,teknoloji,istanbul`
- Örnek: `yeni,aktif,premium`

#### ⚙️ Özel Alanlar (Custom Fields)
Özel alanlar için **çift kolon** sistemi kullanılır:

| Kolon Adı | Açıklama | Örnek |
|-----------|----------|-------|
| custom_field_1_name | 1. özel alanın ismi | Şehir |
| custom_field_1_value | 1. özel alanın değeri | İstanbul |
| custom_field_2_name | 2. özel alanın ismi | Sektör |
| custom_field_2_value | 2. özel alanın değeri | Teknoloji |
| custom_field_3_name | 3. özel alanın ismi | Bütçe |
| custom_field_3_value | 3. özel alanın değeri | 50000 |

**💡 İpucu:** İstediğiniz kadar özel alan ekleyebilirsiniz (custom_field_4, custom_field_5, ...)

### Adım 3: Excel Dosyasını Yükleyin
1. **"📥 Excel Yükle"** butonuna tıklayın
2. Dosyanızı sürükleyip bırakın veya seçin
3. **"İçe Aktar"** butonuna tıklayın

### 📊 İçe Aktarma Sonuçları
- ✅ **Başarılı kayıtlar** sayısı
- ❌ **Başarısız kayıtlar** sayısı
- 📋 İlk 5 kaydın önizlemesi
- ⚠️ Hata detayları (hangi satırda hangi hata olduğu)

## 📤 Excel Export (Dışa Aktarma)

### Tüm Kişileri Dışa Aktarma
1. Kişiler sayfasında **"📤 Excel İndir"** butonuna tıklayın
2. Tüm kişileriniz Excel dosyası olarak indirilir
3. Dosya adı: `kisiler_export_YYYY-MM-DD.xlsx`

### Filtrelenmiş Kişileri Dışa Aktarma
1. Kişiler tablosunda filtreleme yapın (email, durum, etiket vb.)
2. **"📤 Excel İndir"** butonuna tıklayın
3. Sadece filtrelenmiş kişiler indirilir

## 🎨 Excel Format Özellikleri

### Şablon Dosyası İçeriği
1. **Kişiler Sayfası**: Örnek verilerle dolu şablon
2. **Kullanım Kılavuzu Sayfası**: Tüm kolonların açıklamaları

### Kolon Genişlikleri
Tüm kolonlar okunabilir genişlikte ayarlanmıştır:
- Email: 25 karakter
- Ad/Soyad: 15 karakter
- Şirket/Pozisyon: 20 karakter
- Etiketler: 30 karakter
- Özel alanlar: 20 karakter

## ⚠️ Önemli Notlar

### Email Validasyonu
- Email adresi **zorunludur**
- Geçerli bir email formatı olmalıdır (örn: user@domain.com)
- Yinelenen emailler sisteme eklenmez

### Durum (Status) Değerleri
- `active`: Aktif
- `unsubscribed`: Abonelikten çıkmış
- `bounced`: Geri dönen email
- `complained`: Şikayet eden

### Abonelik Durumu (Subscription Status)
- `subscribed`: Abone
- `unsubscribed`: Abone değil
- `pending`: Beklemede

### Özel Alanlar İpuçları
- Her özel alan için **_name** ve **_value** kullanın
- Boş özel alanlar otomatik atlanır
- Aynı isimde özel alanlar olmamalı
- Özel alan değerleri metin, sayı veya tarih olabilir

### Performans
- Tek seferde **10,000'e kadar** kişi içe aktarabilirsiniz
- Büyük dosyalar için işlem biraz zaman alabilir
- Hatalı kayıtlar atlanır, diğerleri eklenir

## 🚀 Örnek Kullanım Senaryoları

### Senaryo 1: LinkedIn'den Kişi Ekleme
```
email: ahmet.yilmaz@sirket.com
first_name: Ahmet
last_name: Yılmaz
company: ABC Teknoloji
position: Yazılım Müdürü
tags: linkedin,teknoloji,yönetici
custom_field_1_name: Bağlantı Tarihi
custom_field_1_value: 2024-01-15
custom_field_2_name: Bağlantı Kaynağı
custom_field_2_value: LinkedIn Premium
```

### Senaryo 2: Etkinlik Katılımcıları
```
email: ayse@email.com
first_name: Ayşe
last_name: Demir
company: XYZ Ltd
tags: etkinlik,2024,istanbul
custom_field_1_name: Etkinlik
custom_field_1_value: Tech Summit 2024
custom_field_2_name: Katılım Türü
custom_field_2_value: VIP
custom_field_3_name: Masraf Merkezi
custom_field_3_value: Pazarlama
```

### Senaryo 3: CRM'den Aktarma
```
email: mehmet@firma.com
first_name: Mehmet
last_name: Kaya
company: Kaya Holding
position: CEO
source: crm_export
status: active
subscription_status: subscribed
tags: vip,premium,ceo
custom_field_1_name: CRM ID
custom_field_1_value: CRM-12345
custom_field_2_name: Potansiyel Değer
custom_field_2_value: 100000
custom_field_3_name: Son Görüşme
custom_field_3_value: 2024-03-20
```

## 🆘 Sık Karşılaşılan Hatalar

### "Email adresi zorunludur"
➡️ Email kolonunu boş bırakmayın

### "Geçersiz email formatı"
➡️ Emaili düzgün formatta yazın: user@domain.com

### "Bu email zaten kayıtlı"
➡️ Sistemde zaten var, güncelleme için farklı yöntem kullanın

### Dosya yüklenmiyor
➡️ Sadece .xlsx veya .xls formatında dosya yükleyin
➡️ Dosya boyutu 10MB'dan küçük olmalı

## 📞 Destek

Sorun yaşarsanız:
1. Şablon dosyasını tekrar indirin
2. Örnek verilere bakın
3. Hata mesajlarını kontrol edin
4. Gerekirse teknik destek ile iletişime geçin

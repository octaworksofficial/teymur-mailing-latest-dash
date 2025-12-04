# CERİLAS Mailing Platform - Test Rehberi

## Test Ortamı Kurulumu

### Ön Koşullar
- Chrome/Firefox tarayıcısı (son sürüm)
- Test email hesapları (email alma için)
- Örnek Excel dosyaları (import testi için)
- Platform URL'sine erişim yetkisi
- Test için gerekli giriş bilgileri

### Test Verileri
- Geçerli giriş kimlik bilgileri
- Test kişi bilgileri
- Kişi verisi içeren örnek Excel dosyaları
- Kampanyalar için test email adresleri

## Test Yürütme Talimatları

### Test Durumları Dosyasını Kullanma

1. **CSV dosyasını içe aktarın** (`CERILAS_Platform_Test_Cases_TR.csv`) Excel'e
2. **Durum sütununu kullanarak** test ilerlemesini takip edin:
   - `Bekliyor` - Başlanmamış
   - `Başarılı` - Test geçti
   - `Başarısız` - Test başarısız
   - `Engellenmiş` - Bağımlılık nedeniyle test yapılamıyor
   - `Atlandı` - Test atlandı (sebep ile)

3. **Sonuçları doldurun**:
   - Her testten sonra Durum'u güncelleyin
   - Gözlemler için "Tester Notları" kullanın
   - Bulunan sorunlar için "Hata Açıklaması" kullanın

### Test Öncelik Rehberi

- **Yüksek Öncelik**: Ana iş operasyonlarını etkileyen temel işlevsellik
- **Orta Öncelik**: Kullanıcı deneyimini artıran önemli özellikler
- **Düşük Öncelik**: İsteğe bağlı özellikler ve UI iyileştirmeleri

### Test Kategorileri Genel Bakış

#### 1. Kimlik Doğrulama & Güvenlik (TC001-TC008, TC113-TC118)
- Giriş/çıkış işlevselliği
- Input doğrulama ve güvenlik
- Oturum yönetimi
- SQL Injection ve XSS koruması

#### 2. Dashboard & Analytics (TC009-TC014, TC075-TC076, TC090-TC093)
- Dashboard veri görüntüleme
- İstatistik doğruluğu
- Email takip işlevselliği
- Grafik ve görselleştirme

#### 3. Kişi Yönetimi (TC015-TC040)
- Kişiler üzerinde CRUD işlemleri
- Excel içe/dışa aktarma işlevselliği
- Arama ve sayfalama
- Kişi detayları ve istatistikleri

#### 4. Şablon Yönetimi (TC041-TC055)
- Şablon oluşturma ve düzenleme
- Şablon değişkenleri işlevselliği
- Önizleme ve kopyalama yetenekleri
- Kategori ve organize etme

#### 5. Kampanya Yönetimi (TC056-TC079)
- Kampanya oluşturma (tekil & sekans)
- Zamanlama ve durum yönetimi
- Gelişmiş özellikler (yanıt durdur, test emailler)
- Analytics ve raporlama

#### 6. Şirket Bilgileri (TC080-TC084)
- Şirket veri yönetimi
- SMTP yapılandırma
- Email teslimat ayarları

#### 7. Sistem Yönetimi (TC085-TC089)
- Zamanlayıcı logları erişim ve filtreleme
- Log arama ve detay görüntüleme

#### 8. Kullanıcı Deneyimi (TC094-TC112)
- Navigasyon ve UI responsiveness
- Hata yönetimi ve loading durumları
- Performans ve büyük veri testleri

#### 9. Güvenlik & Entegrasyon (TC113-TC126)
- Güvenlik testleri
- Uçtan uca işlevsellik
- Veri bütünlüğü
- API ve SMTP entegrasyonları

#### 10. Tarayıcı & Mobil Uyumluluk (TC127-TC132)
- Çoklu tarayıcı testleri
- Mobil cihaz uyumluluğu

#### 11. Kullanılabilirlik & Özelleştirme (TC133-TC140)
- Yeni kullanıcı deneyimi
- Yardım sistemleri
- Dil ve tema ayarları

## Kritik Test Akışları

### Akış 1: Tam Kampanya Oluşturma ve Gönderme
1. Giriş Yap (TC001)
2. Kişileri İçe Aktar (TC025)
3. Şablon Oluştur (TC042)
4. Kampanya Oluştur (TC057)
5. Kampanya Gönder (TC071)
6. Email Teslimatını Doğrula (TC119)
7. Analytics Kontrol Et (TC075)

### Akış 2: Şablon Sekans Kampanyası
1. Birden fazla şablon oluştur (TC042)
2. Sekans kampanyası oluştur (TC059)
3. Zamanlama test et (TC071)
4. Sekans teslimatını doğrula (TC119)

### Akış 3: Tam Kişi Yönetimi
1. Manuel kişi ekle (TC016)
2. Excel'den içe aktar (TC025)
3. Kişi detaylarını düzenle (TC020)
4. Kişileri dışa aktar (TC030)
5. Arama işlevselliği (TC032-TC034)

### Akış 4: Güvenlik ve Performans
1. Güvenlik testleri (TC113-TC118)
2. Büyük veri testleri (TC110-TC111)
3. Çoklu tarayıcı testleri (TC127-TC130)
4. Mobil uyumluluk (TC131-TC132)

## Hata Raporlama Rehberi

Test başarısız olduğunda:
1. Durum'u "Başarısız" olarak güncelleyin
2. "Hata Açıklaması"nı şunlarla doldurun:
   - Tekrarlama adımları
   - Beklenen vs Gerçek sonuç
   - Tarayıcı ve ortam bilgisi
   - Varsa ekran görüntüleri

## Test Ortamı Sıfırlama

Her büyük test oturumundan sonra:
- Tarayıcı cache ve çerezlerini temizleyin
- Gerekirse test verilerini sıfırlayın
- Sistemin temiz durumda olduğunu doğrulayın

## Test Notları

- Gerçekçi veri hacimleriyle test yapın
- Email teslimatını gerçek email istemcilerinde doğrulayın
- Mümkün olduğunda çoklu tarayıcı uyumluluğunu test edin
- Performans sorunlarını belgeleyin
- Kullanıcı deneyimi ve kullanılabilirliğe dikkat edin

## Sorun Durumunda İletişim

Test sırasında sorular veya açıklamalar için:
- Teknik Destek: deniz@cerilas.com
- Platform Dokümantasyonu: Projedeki README dosyalarına bakın

## Test Tamamlama Kontrol Listesi

- [ ] Tüm Yüksek Öncelikli testler tamamlandı
- [ ] Kritik akışlar uçtan uca test edildi
- [ ] Hata raporları detaylarıyla belgelendi
- [ ] Performans notları kaydedildi
- [ ] Test sonuçları özeti hazırlandı
- [ ] Tarayıcı uyumluluk testleri yapıldı
- [ ] Mobil cihaz testleri tamamlandı
- [ ] Güvenlik testleri gerçekleştirildi

## Test İstatistikleri

**Toplam Test Sayısı: 140**

**Modül Dağılımı:**
- Kimlik Doğrulama & Güvenlik: 14 test
- Dashboard & Analytics: 10 test  
- Kişi Yönetimi: 26 test
- Şablon Yönetimi: 15 test
- Kampanya Yönetimi: 24 test
- Şirket Bilgileri: 5 test
- Zamanlayıcı Logları: 5 test
- UI/UX & Navigasyon: 12 test
- Performans: 6 test
- Güvenlik: 6 test
- Entegrasyon: 7 test
- Tarayıcı Uyumluluğu: 4 test
- Mobil Test: 2 test
- Kullanılabilirlik & Özelleştirme: 4 test

**Öncelik Dağılımı:**
- Yüksek: 65 test
- Orta: 60 test
- Düşük: 15 test

## Test Süresi Tahminleri

- **Hızlı Test (Temel İşlevsellik)**: 4-6 saat
- **Orta Test (Ana Özellikler)**: 8-12 saat  
- **Tam Test (Tüm Senaryolar)**: 16-20 saat
- **Regresyon Test**: 6-8 saat

## Test Başarı Kriterleri

- **Yüksek Öncelikli testlerin %95'i başarılı olmalı**
- **Kritik güvenlik testlerinin %100'ü başarılı olmalı**
- **Temel kullanıcı akışları sorunsuz çalışmalı**
- **Performans kabul edilebilir düzeyde olmalı**
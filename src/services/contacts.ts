import { request } from '@umijs/max';
import * as XLSX from 'xlsx';
import type {
  Contact,
  ContactListParams,
  ContactListResponse,
  ContactResponse,
  ContactStatsResponse,
} from '@/types/contact';

// Development: UmiJS proxy ile localhost:3001'e yönlendirilir
// Production: Nginx/Railway ile aynı domain'de /api altında
const API_BASE_URL = '/api';

/**
 * Tüm müşterileri listele
 */
export async function getContacts(params: ContactListParams): Promise<ContactListResponse> {
  return request(`${API_BASE_URL}/contacts`, {
    method: 'GET',
    params,
  });
}

/**
 * Tek müşteri detayı getir
 */
export async function getContact(id: number): Promise<ContactResponse> {
  return request(`${API_BASE_URL}/contacts/${id}`, {
    method: 'GET',
  });
}

/**
 * Yeni müşteri ekle
 */
export async function createContact(data: Partial<Contact>): Promise<ContactResponse> {
  return request(`${API_BASE_URL}/contacts`, {
    method: 'POST',
    data,
  });
}

/**
 * Müşteri güncelle
 */
export async function updateContact(
  id: number,
  data: Partial<Contact>,
): Promise<ContactResponse> {
  return request(`${API_BASE_URL}/contacts/${id}`, {
    method: 'PUT',
    data,
  });
}

/**
 * Müşteri sil
 */
export async function deleteContact(id: number): Promise<ContactResponse> {
  return request(`${API_BASE_URL}/contacts/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Toplu müşteri silme
 */
export async function bulkDeleteContacts(ids: number[]): Promise<ContactResponse> {
  return request(`${API_BASE_URL}/contacts/bulk-delete`, {
    method: 'POST',
    data: { ids },
  });
}

/**
 * İstatistikleri getir
 */
export async function getContactStats(): Promise<ContactStatsResponse> {
  return request(`${API_BASE_URL}/contacts/stats/summary`, {
    method: 'GET',
  });
}

/**
 * Excel şablonu indir
 * Kullanıcıların import için kullanabileceği örnek dosya
 */
export function downloadExcelTemplate() {
  const templateData = [
    {
      email: 'ornek@email.com',
      first_name: 'Ahmet',
      last_name: 'Yılmaz',
      phone: '+90 555 123 4567',
      mobile_phone: '+90 555 123 4568',
      company: 'ABC Şirket',
      company_title: 'ABC Teknoloji A.Ş.',
      position: 'Yazılım Geliştirici',
      customer_representative: 'Mehmet Kaya',
      country: 'Türkiye',
      state: 'İstanbul',
      district: 'Kadıköy',
      address_1: 'Örnek Mahallesi, Test Sokak No:1',
      address_2: 'Kat:2 Daire:3',
      importance_level: 8,
      notes: 'Önemli müşteri',
      source: 'manuel',
      status: 'active',
      subscription_status: 'subscribed',
      tags: 'vip,teknoloji,istanbul',
      custom_field_1_name: 'Şehir',
      custom_field_1_value: 'İstanbul',
      custom_field_2_name: 'Sektör',
      custom_field_2_value: 'Teknoloji',
      custom_field_3_name: 'Bütçe',
      custom_field_3_value: '50000',
    },
    {
      email: 'test@example.com',
      first_name: 'Ayşe',
      last_name: 'Demir',
      phone: '+90 555 987 6543',
      mobile_phone: '',
      company: 'XYZ Ltd',
      company_title: 'XYZ Danışmanlık Ltd. Şti.',
      position: 'Proje Yöneticisi',
      customer_representative: 'Ali Yıldız',
      country: 'Türkiye',
      state: 'Ankara',
      district: 'Çankaya',
      address_1: 'Test Caddesi No:5',
      address_2: '',
      importance_level: 5,
      notes: '',
      source: 'website',
      status: 'active',
      subscription_status: 'subscribed',
      tags: 'teknoloji,ankara',
      custom_field_1_name: 'Şehir',
      custom_field_1_value: 'Ankara',
      custom_field_2_name: 'Sektör',
      custom_field_2_value: 'Danışmanlık',
      custom_field_3_name: '',
      custom_field_3_value: '',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(templateData);
  
  // Kolon genişliklerini ayarla
  ws['!cols'] = [
    { wch: 25 }, // email
    { wch: 15 }, // first_name
    { wch: 15 }, // last_name
    { wch: 18 }, // phone
    { wch: 18 }, // mobile_phone
    { wch: 20 }, // company
    { wch: 25 }, // company_title
    { wch: 20 }, // position
    { wch: 20 }, // customer_representative
    { wch: 15 }, // country
    { wch: 15 }, // state
    { wch: 15 }, // district
    { wch: 30 }, // address_1
    { wch: 30 }, // address_2
    { wch: 12 }, // importance_level
    { wch: 30 }, // notes
    { wch: 12 }, // source
    { wch: 12 }, // status
    { wch: 18 }, // subscription_status
    { wch: 30 }, // tags
    { wch: 20 }, // custom_field_1_name
    { wch: 20 }, // custom_field_1_value
    { wch: 20 }, // custom_field_2_name
    { wch: 20 }, // custom_field_2_value
    { wch: 20 }, // custom_field_3_name
    { wch: 20 }, // custom_field_3_value
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Kişiler');

  // Açıklama sayfası ekle
  const instructionsData = [
    { Alan: 'email', Zorunlu: 'EVET', Açıklama: 'Geçerli email adresi (örn: test@email.com)' },
    { Alan: 'first_name', Zorunlu: 'HAYIR', Açıklama: 'Kişinin adı' },
    { Alan: 'last_name', Zorunlu: 'HAYIR', Açıklama: 'Kişinin soyadı' },
    { Alan: 'phone', Zorunlu: 'HAYIR', Açıklama: 'Sabit telefon numarası' },
    { Alan: 'mobile_phone', Zorunlu: 'HAYIR', Açıklama: 'Mobil telefon numarası' },
    { Alan: 'company', Zorunlu: 'HAYIR', Açıklama: 'Şirket adı' },
    { Alan: 'company_title', Zorunlu: 'HAYIR', Açıklama: 'Firma ünvanı (örn: ABC Ltd. Şti.)' },
    { Alan: 'position', Zorunlu: 'HAYIR', Açıklama: 'Pozisyon/Unvan' },
    { Alan: 'customer_representative', Zorunlu: 'HAYIR', Açıklama: 'Müşteri temsilcisi adı' },
    { Alan: 'country', Zorunlu: 'HAYIR', Açıklama: 'Ülke' },
    { Alan: 'state', Zorunlu: 'HAYIR', Açıklama: 'İl' },
    { Alan: 'district', Zorunlu: 'HAYIR', Açıklama: 'İlçe' },
    { Alan: 'address_1', Zorunlu: 'HAYIR', Açıklama: 'Birinci adres satırı' },
    { Alan: 'address_2', Zorunlu: 'HAYIR', Açıklama: 'İkinci adres satırı' },
    { Alan: 'importance_level', Zorunlu: 'HAYIR', Açıklama: 'Önem derecesi (1-10 arası sayı)' },
    { Alan: 'notes', Zorunlu: 'HAYIR', Açıklama: 'Müşteri hakkında notlar' },
    { Alan: 'source', Zorunlu: 'HAYIR', Açıklama: 'Kaynak (manuel, website, import, api vb.)' },
    { Alan: 'status', Zorunlu: 'HAYIR', Açıklama: 'Durum: active, unsubscribed, bounced, complained' },
    { Alan: 'subscription_status', Zorunlu: 'HAYIR', Açıklama: 'Abonelik: subscribed, unsubscribed, pending' },
    { Alan: 'tags', Zorunlu: 'HAYIR', Açıklama: 'Etiketler (virgülle ayırın: vip,teknoloji,istanbul)' },
    { Alan: 'custom_field_X_name', Zorunlu: 'HAYIR', Açıklama: 'Özel alan ismi (X yerine 1,2,3... kullanın)' },
    { Alan: 'custom_field_X_value', Zorunlu: 'HAYIR', Açıklama: 'Özel alan değeri' },
  ];
  
  const instructionsWs = XLSX.utils.json_to_sheet(instructionsData);
  instructionsWs['!cols'] = [
    { wch: 25 },
    { wch: 10 },
    { wch: 60 },
  ];
  XLSX.utils.book_append_sheet(wb, instructionsWs, 'Kullanım Kılavuzu');

  XLSX.writeFile(wb, 'kisiler_import_sablonu.xlsx');
}

/**
 * Kişileri Excel'e aktar
 */
export async function exportContactsToExcel(params: ContactListParams) {
  try {
    // Tüm kişileri getir
    const response = await getContacts({
      ...params,
      page: 1,
      pageSize: 10000, // Maksimum limit
    });

    const contacts = response.data;
    
    if (!contacts || contacts.length === 0) {
      throw new Error('Aktarılacak kişi bulunamadı');
    }

    // Excel formatına dönüştür
    const excelData = contacts.map((contact) => {
      const row: any = {
        email: contact.email,
        first_name: contact.first_name || '',
        last_name: contact.last_name || '',
        phone: contact.phone || '',
        mobile_phone: contact.mobile_phone || '',
        company: contact.company || '',
        company_title: contact.company_title || '',
        position: contact.position || '',
        customer_representative: contact.customer_representative || '',
        country: contact.country || '',
        state: contact.state || '',
        district: contact.district || '',
        address_1: contact.address_1 || '',
        address_2: contact.address_2 || '',
        importance_level: contact.importance_level || '',
        notes: contact.notes || '',
        source: contact.source || '',
        status: contact.status || 'active',
        subscription_status: contact.subscription_status || 'subscribed',
        tags: contact.tags?.join(',') || '',
      };

      // Özel alanları ekle
      if (contact.custom_fields) {
        const customFields = Object.entries(contact.custom_fields);
        customFields.forEach(([key, value], index) => {
          row[`custom_field_${index + 1}_name`] = key;
          row[`custom_field_${index + 1}_value`] = value;
        });
      }

      return row;
    });

    const ws = XLSX.utils.json_to_sheet(excelData);
    
    // Kolon genişliklerini ayarla
    ws['!cols'] = [
      { wch: 25 }, // email
      { wch: 15 }, // first_name
      { wch: 15 }, // last_name
      { wch: 18 }, // phone
      { wch: 18 }, // mobile_phone
      { wch: 20 }, // company
      { wch: 25 }, // company_title
      { wch: 20 }, // position
      { wch: 20 }, // customer_representative
      { wch: 15 }, // country
      { wch: 15 }, // state
      { wch: 15 }, // district
      { wch: 30 }, // address_1
      { wch: 30 }, // address_2
      { wch: 12 }, // importance_level
      { wch: 30 }, // notes
      { wch: 12 }, // source
      { wch: 12 }, // status
      { wch: 18 }, // subscription_status
      { wch: 30 }, // tags
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Kişiler');

    const fileName = `kisiler_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);

    return { success: true, fileName, count: contacts.length };
  } catch (error) {
    console.error('Excel export error:', error);
    throw error;
  }
}

/**
 * Excel'den kişileri içe aktar
 */
export async function importContactsFromExcel(file: File): Promise<{
  success: boolean;
  imported: number;
  failed: number;
  errors: Array<{ row: number; email: string; error: string }>;
  preview: Contact[];
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const errors: Array<{ row: number; email: string; error: string }> = [];
        const preview: Contact[] = [];
        let imported = 0;
        let failed = 0;

        for (let i = 0; i < jsonData.length; i++) {
          const row: any = jsonData[i];
          const rowNumber = i + 2; // Excel'de satır numarası (başlık + 1)

          try {
            // Email kontrolü
            if (!row.email) {
              throw new Error('Email adresi zorunludur');
            }

            // Email formatı kontrolü
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(row.email)) {
              throw new Error('Geçersiz email formatı');
            }

            // Özel alanları oluştur
            const customFields: Record<string, any> = {};
            let customFieldIndex = 1;
            while (row[`custom_field_${customFieldIndex}_name`]) {
              const fieldName = row[`custom_field_${customFieldIndex}_name`];
              const fieldValue = row[`custom_field_${customFieldIndex}_value`];
              if (fieldName && fieldValue) {
                customFields[fieldName] = fieldValue;
              }
              customFieldIndex++;
            }

            // Etiketleri işle
            const tags = row.tags
              ? row.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean)
              : [];

            const contactData: Partial<Contact> = {
              email: row.email.trim().toLowerCase(),
              first_name: row.first_name || '',
              last_name: row.last_name || '',
              phone: row.phone || '',
              mobile_phone: row.mobile_phone || '',
              company: row.company || '',
              company_title: row.company_title || '',
              position: row.position || '',
              customer_representative: row.customer_representative || '',
              country: row.country || '',
              state: row.state || '',
              district: row.district || '',
              address_1: row.address_1 || '',
              address_2: row.address_2 || '',
              importance_level: row.importance_level ? parseInt(row.importance_level) : undefined,
              notes: row.notes || '',
              source: row.source || 'import',
              status: row.status || 'active',
              subscription_status: row.subscription_status || 'subscribed',
              tags,
              custom_fields: Object.keys(customFields).length > 0 ? customFields : undefined,
            };

            // Önizleme için ilk 5 kaydı sakla
            if (preview.length < 5) {
              preview.push(contactData as Contact);
            }

            // API'ye gönder
            await createContact(contactData);
            imported++;
          } catch (error: any) {
            failed++;
            errors.push({
              row: rowNumber,
              email: row.email || 'N/A',
              error: error.message || 'Bilinmeyen hata',
            });
          }
        }

        resolve({
          success: true,
          imported,
          failed,
          errors,
          preview,
        });
      } catch (error: any) {
        reject(new Error(`Excel okuma hatası: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Dosya okunamadı'));
    };

    reader.readAsBinaryString(file);
  });
}

/**
 * Kişiye gönderilen emailleri getir
 */
export async function getContactSentEmails(contactId: number, params?: { page?: number; pageSize?: number }) {
  return request(`${API_BASE_URL}/contacts/${contactId}/sent-emails`, {
    method: 'GET',
    params,
  });
}

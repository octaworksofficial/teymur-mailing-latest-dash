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
 * Filtre seçeneklerini getir - her alan için benzersiz değerler
 */
export interface FilterOptionsResponse {
  success: boolean;
  data: {
    status: string[];
    subscription_status: string[];
    importance_level: string[];
    customer_representative: string[];
    country: string[];
    state: string[];
    district: string[];
    company: string[];
    position: string[];
    source: string[];
    tags: string[];
  };
}

export async function getFilterOptions(): Promise<FilterOptionsResponse> {
  return request(`${API_BASE_URL}/contacts/filter-options`, {
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
      salutation: 'Bay',
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
      salutation: 'Bayan',
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
    { wch: 10 }, // salutation
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
        salutation: contact.salutation || '',
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
 * Toplu kişi içe aktarma API'si
 */
export async function bulkImportContacts(contacts: Partial<Contact>[]): Promise<{
  success: boolean;
  message: string;
  data: {
    imported: number;
    duplicates: number;
    errors: number;
    details: {
      duplicateEmails: string[];
      errorDetails: Array<{ row: number; email: string; error: string }>;
    };
  };
}> {
  return request(`${API_BASE_URL}/contacts/bulk-import`, {
    method: 'POST',
    data: { contacts },
  });
}

/**
 * Excel'den kişileri içe aktar (Bulk API kullanır)
 */
export async function importContactsFromExcel(file: File): Promise<{
  success: boolean;
  imported: number;
  duplicates: number;
  failed: number;
  errors: Array<{ row: number; email: string; error: string }>;
  duplicateEmails: string[];
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

        if (jsonData.length === 0) {
          reject(new Error('Excel dosyası boş veya okunamadı'));
          return;
        }

        // Kişi verilerini hazırla
        const contacts: Partial<Contact>[] = [];
        const preview: Contact[] = [];

        for (let i = 0; i < jsonData.length; i++) {
          const row: any = jsonData[i];

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
            ? String(row.tags).split(',').map((tag: string) => tag.trim()).filter(Boolean)
            : [];

          const contactData: Partial<Contact> = {
            email: row.email ? String(row.email).trim().toLowerCase() : '',
            salutation: row.salutation || '',
            first_name: row.first_name || '',
            last_name: row.last_name || '',
            phone: row.phone ? String(row.phone) : '',
            mobile_phone: row.mobile_phone ? String(row.mobile_phone) : '',
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
            source: row.source || 'excel-import',
            status: row.status || 'active',
            subscription_status: row.subscription_status || 'subscribed',
            tags,
            custom_fields: Object.keys(customFields).length > 0 ? customFields : undefined,
          };

          contacts.push(contactData);

          // Önizleme için ilk 5 kaydı sakla
          if (preview.length < 5) {
            preview.push(contactData as Contact);
          }
        }

        // Bulk API'ye gönder
        const response = await bulkImportContacts(contacts);

        if (response.success) {
          resolve({
            success: true,
            imported: response.data.imported,
            duplicates: response.data.duplicates,
            failed: response.data.errors,
            errors: response.data.details.errorDetails,
            duplicateEmails: response.data.details.duplicateEmails,
            preview,
          });
        } else {
          reject(new Error((response as any).message || 'İçe aktarma başarısız'));
        }
      } catch (error: any) {
        // API hata mesajını çıkar
        let errorMsg = 'İçe aktarma hatası';
        if (error.info?.errorMessage) {
          errorMsg = error.info.errorMessage;
        } else if (error.response?.data?.message) {
          errorMsg = error.response.data.message;
        } else if (error.data?.message) {
          errorMsg = error.data.message;
        } else if (error.message) {
          errorMsg = error.message;
        }
        reject(new Error(errorMsg));
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

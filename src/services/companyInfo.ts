import { request } from '@umijs/max';

// Kurumsal bilgileri getir
export async function getCompanyInfo() {
  return request('/api/company-info', {
    method: 'GET',
  });
}

// Kurumsal bilgileri güncelle
export async function updateCompanyInfo(data: any) {
  return request('/api/company-info', {
    method: 'PUT',
    data,
  });
}

// Görsel yükleme (n8n webhook)
export async function uploadImage(file: File) {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('https://n8n-production-14b9.up.railway.app/webhook/upload-image', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Upload image error:', error);
    throw error;
  }
}

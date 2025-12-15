import { request } from '@umijs/max';

export interface SpecialDay {
  id: number;
  year: number;
  day_type: string;
  day_name: string;
  actual_date: string;
  category: string;
}

// Tüm özel günleri getir
export async function getSpecialDays(year?: number) {
  return request<{ success: boolean; data: SpecialDay[] }>('/api/special-days', {
    method: 'GET',
    params: year ? { year } : undefined,
  });
}

// Mevcut yılları getir
export async function getSpecialDayYears() {
  return request<{ success: boolean; data: number[] }>('/api/special-days/years', {
    method: 'GET',
  });
}

// Tekil özel gün getir
export async function getSpecialDay(id: number) {
  return request<{ success: boolean; data: SpecialDay }>(`/api/special-days/${id}`, {
    method: 'GET',
  });
}

// Özel gün güncelle
export async function updateSpecialDay(id: number, data: Partial<SpecialDay>) {
  return request<{ success: boolean; data: SpecialDay; message: string }>(
    `/api/special-days/${id}`,
    {
      method: 'PUT',
      data,
    },
  );
}

// Yeni özel gün ekle
export async function createSpecialDay(data: Omit<SpecialDay, 'id'>) {
  return request<{ success: boolean; data: SpecialDay; message: string }>(
    '/api/special-days',
    {
      method: 'POST',
      data,
    },
  );
}

// Özel gün sil
export async function deleteSpecialDay(id: number) {
  return request<{ success: boolean; message: string }>(`/api/special-days/${id}`, {
    method: 'DELETE',
  });
}

// Yılı kopyala
export async function copyYear(sourceYear: number, targetYear: number) {
  return request<{ success: boolean; message: string }>('/api/special-days/copy-year', {
    method: 'POST',
    data: { sourceYear, targetYear },
  });
}

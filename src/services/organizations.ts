import { request } from '@umijs/max';

/**
 * Organizations API Service
 */

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

// Organizasyon listesi
export async function getOrganizations(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}) {
  return request<ApiResponse>('/api/organizations', {
    method: 'GET',
    params,
  });
}

// Tek organizasyon detayı
export async function getOrganization(id: number) {
  return request<ApiResponse>(`/api/organizations/${id}`, {
    method: 'GET',
  });
}

// Organizasyon oluştur
export async function createOrganization(data: {
  name: string;
  slug: string;
  description?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  country?: string;
  plan?: string;
  max_users?: number;
  max_contacts?: number;
  max_emails_per_month?: number;
  status?: string;
}) {
  return request<ApiResponse>('/api/organizations', {
    method: 'POST',
    data,
  });
}

// Organizasyon güncelle
export async function updateOrganization(id: number, data: Partial<{
  name: string;
  description: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  country: string;
  plan: string;
  max_users: number;
  max_contacts: number;
  max_emails_per_month: number;
  status: string;
  settings: Record<string, any>;
}>) {
  return request<ApiResponse>(`/api/organizations/${id}`, {
    method: 'PUT',
    data,
  });
}

// Organizasyon sil
export async function deleteOrganization(id: number) {
  return request<ApiResponse>(`/api/organizations/${id}`, {
    method: 'DELETE',
  });
}

// Organizasyon limitleri
export async function getOrganizationLimits(id: number) {
  return request<ApiResponse>(`/api/organizations/${id}/limits`, {
    method: 'GET',
  });
}

// Organizasyondaki kullanıcılar
export async function getOrganizationUsers(id: number) {
  return request<ApiResponse>(`/api/organizations/${id}/users`, {
    method: 'GET',
  });
}

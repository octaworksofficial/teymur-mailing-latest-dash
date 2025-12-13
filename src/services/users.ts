import { request } from '@umijs/max';

/**
 * Users Management API Service
 */

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  password?: string; // Şifre gösterme için
}

// Kullanıcı listesi
export async function getUsers(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  role?: string;
  organization_id?: number;
}) {
  return request<ApiResponse>('/api/users', {
    method: 'GET',
    params,
  });
}

// Tek kullanıcı detayı
export async function getUser(id: number) {
  return request<ApiResponse>(`/api/users/${id}`, {
    method: 'GET',
  });
}

// Kullanıcı oluştur
export async function createUser(data: {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: string;
  organization_id?: number;
  status?: string;
}) {
  return request<ApiResponse>('/api/users', {
    method: 'POST',
    data,
  });
}

// Kullanıcı güncelle
export async function updateUser(id: number, data: Partial<{
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: string;
  status: string;
  organization_id: number;
}>) {
  return request<ApiResponse>(`/api/users/${id}`, {
    method: 'PUT',
    data,
  });
}

// Kullanıcı şifresi güncelle
export async function updateUserPassword(id: number, data: {
  password: string;
  show_password?: boolean;
}) {
  return request<ApiResponse>(`/api/users/${id}/password`, {
    method: 'PUT',
    data,
  });
}

// Kullanıcı sil
export async function deleteUser(id: number) {
  return request<ApiResponse>(`/api/users/${id}`, {
    method: 'DELETE',
  });
}

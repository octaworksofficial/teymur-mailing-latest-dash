/**
 * Auth Service
 * Kullanıcı kimlik doğrulama API istekleri
 */

import { request } from '@umijs/max';

// Types
export interface LoginParams {
  email: string;
  password: string;
}

export interface RegisterParams {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  organizationName?: string;
}

export interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  phone?: string;
  avatar?: string;
  role: 'super_admin' | 'org_admin' | 'user';
  status?: 'active' | 'inactive' | 'suspended';
  organizationId?: number;
  organizationName?: string;
  permissions?: string[];
  preferences?: Record<string, unknown>;
  lastLoginAt?: string;
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
  error?: string;
}

export interface Organization {
  id: number;
  name: string;
  slug: string;
  description?: string;
  email?: string;
  phone?: string;
  website?: string;
  status: 'active' | 'suspended' | 'cancelled';
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
  maxUsers?: number;
  maxContacts?: number;
  maxEmailsPerMonth?: number;
  userCount?: number;
  contactCount?: number;
  createdAt?: string;
}

// Token yönetimi
const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'current_user';

export const getAccessToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const setTokens = (accessToken: string, refreshToken: string): void => {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const clearTokens = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem(USER_KEY);
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
  return null;
};

export const setCurrentUser = (user: User): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const isAuthenticated = (): boolean => {
  return !!getAccessToken();
};

// API istekleri
export async function login(params: LoginParams): Promise<AuthResponse> {
  const response = await request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    data: params,
  });

  if (response.success && response.data) {
    setTokens(response.data.accessToken, response.data.refreshToken);
    setCurrentUser(response.data.user);
  }

  return response;
}

export async function register(params: RegisterParams): Promise<AuthResponse> {
  const response = await request<AuthResponse>('/api/auth/register', {
    method: 'POST',
    data: params,
  });

  if (response.success && response.data) {
    setTokens(response.data.accessToken, response.data.refreshToken);
    setCurrentUser(response.data.user);
  }

  return response;
}

export async function logout(): Promise<void> {
  try {
    const refreshToken = getRefreshToken();
    await request('/api/auth/logout', {
      method: 'POST',
      data: { refreshToken },
    });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    clearTokens();
  }
}

export async function refreshTokens(): Promise<boolean> {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    const response = await request<{
      success: boolean;
      data?: { accessToken: string; refreshToken: string };
    }>('/api/auth/refresh', {
      method: 'POST',
      data: { refreshToken },
    });

    if (response.success && response.data) {
      setTokens(response.data.accessToken, response.data.refreshToken);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Token refresh error:', error);
    clearTokens();
    return false;
  }
}

export async function getMe(): Promise<{ success: boolean; data?: User }> {
  const response = await request<{ success: boolean; data?: User }>('/api/auth/me', {
    method: 'GET',
  });

  if (response.success && response.data) {
    setCurrentUser(response.data);
  }

  return response;
}

export async function updateProfile(params: {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  preferences?: Record<string, unknown>;
}): Promise<{ success: boolean; data?: User; error?: string }> {
  const response = await request<{ success: boolean; data?: User; error?: string }>(
    '/api/auth/me',
    {
      method: 'PUT',
      data: params,
    },
  );

  if (response.success && response.data) {
    setCurrentUser(response.data);
  }

  return response;
}

export async function changePassword(params: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  return request('/api/auth/password', {
    method: 'PUT',
    data: params,
  });
}

// Admin API'ları
export async function getUsers(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
  status?: string;
  organizationId?: number;
}): Promise<{
  success: boolean;
  data?: User[];
  total?: number;
  page?: number;
  pageSize?: number;
}> {
  return request('/api/users', {
    method: 'GET',
    params,
  });
}

export async function createUser(params: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: string;
  organizationId?: number;
}): Promise<{ success: boolean; data?: User; error?: string }> {
  return request('/api/users', {
    method: 'POST',
    data: {
      email: params.email,
      password: params.password,
      first_name: params.firstName,
      last_name: params.lastName,
      phone: params.phone,
      role: params.role,
      organization_id: params.organizationId,
    },
  });
}

export async function updateUser(
  id: number,
  params: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    role?: string;
    status?: string;
    organizationId?: number;
  },
): Promise<{ success: boolean; data?: User; error?: string }> {
  return request(`/api/users/${id}`, {
    method: 'PUT',
    data: {
      first_name: params.firstName,
      last_name: params.lastName,
      phone: params.phone,
      role: params.role,
      status: params.status,
      organization_id: params.organizationId,
    },
  });
}

export async function updateUserPassword(
  id: number,
  password: string,
  showPassword?: boolean,
): Promise<{ success: boolean; message?: string; password?: string; error?: string }> {
  return request(`/api/users/${id}/password`, {
    method: 'PUT',
    data: { password, show_password: showPassword },
  });
}

export async function deleteUser(id: number): Promise<{ success: boolean; message?: string; error?: string }> {
  return request(`/api/users/${id}`, {
    method: 'DELETE',
  });
}

// Organizasyon API'ları (Super Admin)
export async function getOrganizations(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}): Promise<{
  success: boolean;
  data?: Organization[];
  total?: number;
  page?: number;
  pageSize?: number;
}> {
  return request('/api/organizations', {
    method: 'GET',
    params,
  });
}

export async function getOrganization(id: number): Promise<{ success: boolean; data?: Organization; error?: string }> {
  return request(`/api/organizations/${id}`, {
    method: 'GET',
  });
}

export async function createOrganization(params: {
  name: string;
  slug: string;
  description?: string;
  email?: string;
  phone?: string;
  website?: string;
  plan?: string;
  maxUsers?: number;
  maxContacts?: number;
  maxEmailsPerMonth?: number;
}): Promise<{ success: boolean; data?: Organization; error?: string }> {
  return request('/api/organizations', {
    method: 'POST',
    data: {
      name: params.name,
      slug: params.slug,
      description: params.description,
      email: params.email,
      phone: params.phone,
      website: params.website,
      plan: params.plan,
      max_users: params.maxUsers,
      max_contacts: params.maxContacts,
      max_emails_per_month: params.maxEmailsPerMonth,
    },
  });
}

export async function updateOrganization(
  id: number,
  params: {
    name?: string;
    description?: string;
    email?: string;
    phone?: string;
    website?: string;
    plan?: string;
    status?: string;
    maxUsers?: number;
    maxContacts?: number;
    maxEmailsPerMonth?: number;
  },
): Promise<{ success: boolean; data?: Organization; error?: string }> {
  return request(`/api/organizations/${id}`, {
    method: 'PUT',
    data: {
      name: params.name,
      description: params.description,
      email: params.email,
      phone: params.phone,
      website: params.website,
      plan: params.plan,
      status: params.status,
      max_users: params.maxUsers,
      max_contacts: params.maxContacts,
      max_emails_per_month: params.maxEmailsPerMonth,
    },
  });
}

export async function deleteOrganization(
  id: number,
): Promise<{ success: boolean; message?: string; error?: string }> {
  return request(`/api/organizations/${id}`, {
    method: 'DELETE',
  });
}

export async function getOrganizationLimits(
  id: number,
): Promise<{ success: boolean; data?: { organization: string; plan: string; limits: any; usage: any; remaining: any }; error?: string }> {
  return request(`/api/organizations/${id}/limits`, {
    method: 'GET',
  });
}

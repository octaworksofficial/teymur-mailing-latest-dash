import { request } from '@umijs/max';
import type {
  EmailTemplate,
  TemplateListParams,
  TemplateListResponse,
  TemplateResponse,
  TemplateStatsResponse,
} from '@/types/template';

const API_BASE_URL = '/api';

/**
 * Tüm şablonları listele
 */
export async function getTemplates(params: TemplateListParams): Promise<TemplateListResponse> {
  return request(`${API_BASE_URL}/templates`, {
    method: 'GET',
    params,
  });
}

/**
 * Tek şablon detayı getir
 */
export async function getTemplate(id: number): Promise<TemplateResponse> {
  return request(`${API_BASE_URL}/templates/${id}`, {
    method: 'GET',
  });
}

/**
 * Yeni şablon oluştur
 */
export async function createTemplate(data: Partial<EmailTemplate>): Promise<TemplateResponse> {
  return request(`${API_BASE_URL}/templates`, {
    method: 'POST',
    data,
  });
}

/**
 * Şablon güncelle
 */
export async function updateTemplate(
  id: number,
  data: Partial<EmailTemplate>,
): Promise<TemplateResponse> {
  return request(`${API_BASE_URL}/templates/${id}`, {
    method: 'PUT',
    data,
  });
}

/**
 * Şablon sil
 */
export async function deleteTemplate(id: number): Promise<TemplateResponse> {
  return request(`${API_BASE_URL}/templates/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Toplu şablon silme
 */
export async function bulkDeleteTemplates(ids: number[]): Promise<TemplateResponse> {
  return request(`${API_BASE_URL}/templates/bulk-delete`, {
    method: 'POST',
    data: { ids },
  });
}

/**
 * Şablon kopyala
 */
export async function duplicateTemplate(id: number): Promise<TemplateResponse> {
  return request(`${API_BASE_URL}/templates/${id}/duplicate`, {
    method: 'POST',
  });
}

/**
 * Şablon istatistikleri
 */
export async function getTemplateStats(): Promise<TemplateStatsResponse> {
  return request(`${API_BASE_URL}/templates/stats/summary`, {
    method: 'GET',
  });
}

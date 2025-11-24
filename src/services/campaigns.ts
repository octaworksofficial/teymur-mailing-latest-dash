import { request } from '@umijs/max';
import type {
  EmailCampaign,
  CampaignListParams,
  CampaignListResponse,
  CampaignResponse,
  CampaignStatsResponse,
  CampaignFormData,
} from '@/types/campaign';

const API_BASE_URL = '/api';

/**
 * Tüm kampanyaları listele
 */
export async function getCampaigns(params: CampaignListParams): Promise<CampaignListResponse> {
  return request(`${API_BASE_URL}/campaigns`, {
    method: 'GET',
    params,
  });
}

/**
 * Tek kampanya detayı getir
 */
export async function getCampaign(id: number): Promise<CampaignResponse> {
  return request(`${API_BASE_URL}/campaigns/${id}`, {
    method: 'GET',
  });
}

/**
 * Yeni kampanya oluştur
 */
export async function createCampaign(data: Partial<CampaignFormData>): Promise<CampaignResponse> {
  return request(`${API_BASE_URL}/campaigns`, {
    method: 'POST',
    data,
  });
}

/**
 * Kampanya güncelle
 */
export async function updateCampaign(
  id: number,
  data: Partial<EmailCampaign>,
): Promise<CampaignResponse> {
  return request(`${API_BASE_URL}/campaigns/${id}`, {
    method: 'PUT',
    data,
  });
}

/**
 * Kampanya sil
 */
export async function deleteCampaign(id: number): Promise<CampaignResponse> {
  return request(`${API_BASE_URL}/campaigns/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Toplu kampanya silme
 */
export async function bulkDeleteCampaigns(ids: number[]): Promise<CampaignResponse> {
  return request(`${API_BASE_URL}/campaigns/bulk-delete`, {
    method: 'POST',
    data: { ids },
  });
}

/**
 * Kampanya kopyala
 */
export async function duplicateCampaign(id: number): Promise<CampaignResponse> {
  return request(`${API_BASE_URL}/campaigns/${id}/duplicate`, {
    method: 'POST',
  });
}

/**
 * Kampanya istatistikleri
 */
export async function getCampaignStats(): Promise<CampaignStatsResponse> {
  return request(`${API_BASE_URL}/campaigns/stats/summary`, {
    method: 'GET',
  });
}

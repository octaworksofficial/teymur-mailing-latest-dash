import { request } from '@umijs/max';

const API_BASE_URL = '/api';

export interface DashboardStats {
  totalEmailsSent: number;
  totalEmailsSentChange: number;
  openRate: number;
  openRateChange: number;
  clickRate: number;
  clickRateChange: number;
  replyRate: number;
  replyRateChange: number;
  activeCampaigns: number;
  totalContacts: number;
  totalTemplates: number;
}

export interface WeeklyEmailData {
  date: string;
  value: number;
}

export interface ActiveCampaign {
  id: number;
  key: string;
  name: string;
  templateName?: string;
  status: string;
  recipients: number;
  sent: number;
  opened: number;
  clicked: number;
  replied?: number;
  openRate: string;
  clickRate?: string;
  progress: number;
  nextSendDate?: string;
  createdAt?: string;
}

export interface DashboardData {
  stats: DashboardStats;
  weeklyEmails: WeeklyEmailData[];
  activeCampaigns: ActiveCampaign[];
}

/**
 * Dashboard genel istatistiklerini getir
 */
export async function getDashboardStats(): Promise<{ data: DashboardStats }> {
  return request(`${API_BASE_URL}/dashboard/stats`, {
    method: 'GET',
  });
}

/**
 * Haftalık email gönderim verilerini getir
 */
export async function getWeeklyEmailData(): Promise<{ data: WeeklyEmailData[] }> {
  return request(`${API_BASE_URL}/dashboard/weekly-emails`, {
    method: 'GET',
  });
}

/**
 * Aktif kampanyaları getir
 */
export async function getActiveCampaigns(): Promise<{ data: ActiveCampaign[] }> {
  return request(`${API_BASE_URL}/dashboard/active-campaigns`, {
    method: 'GET',
  });
}

/**
 * Tüm dashboard verilerini tek seferde getir
 */
export async function getDashboardData(): Promise<{ data: DashboardData }> {
  return request(`${API_BASE_URL}/dashboard`, {
    method: 'GET',
  });
}

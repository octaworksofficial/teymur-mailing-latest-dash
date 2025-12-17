import { request } from '@umijs/max';

export interface AdminStats {
  totalOrganizations: number;
  totalUsers: number;
  activeUsers: number;
  totalSuperAdmins: number;
  totalOrgAdmins: number;
  totalContacts: number;
  totalTemplates: number;
  totalCampaigns: number;
  activeCampaigns: number;
  totalEmailsSent: number;
  openedEmails: number;
  clickedEmails: number;
  openRate: string;
  clickRate: string;
}

export interface RecentOrganization {
  id: number;
  name: string;
  created_at: string;
}

export interface RecentUser {
  id: number;
  name: string;
  email: string;
  created_at: string;
  organization_name: string;
}

export interface TopOrganization {
  id: number;
  name: string;
  email_count: number;
}

export interface WeeklyTrend {
  date: string;
  count: number;
}

export interface AdminStatsResponse {
  stats: AdminStats;
  recentOrganizations: RecentOrganization[];
  recentUsers: RecentUser[];
  topOrganizations: TopOrganization[];
  weeklyTrend: WeeklyTrend[];
}

export interface ApiResponse {
  success: boolean;
  data: AdminStatsResponse;
  message?: string;
}

/**
 * Get admin statistics
 */
export async function getAdminStats() {
  return request<ApiResponse>('/api/admin/stats', {
    method: 'GET',
  });
}

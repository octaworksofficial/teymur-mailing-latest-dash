// Email Campaign Types

export interface TemplateInSequence {
  template_id: number;
  send_delay_days: number;
  scheduled_date: string;
}

export interface TargetFilters {
  status?: string;
  subscription_status?: string;
  tags?: string[];
  email?: string;
  custom_fields?: Record<string, any>;
}

export interface EmailCampaign {
  id: number;
  name: string;
  description?: string;

  // Hedef Kitle
  target_contact_ids?: number[];
  target_filters?: TargetFilters;
  total_recipients: number;

  // Şablon ve Tekrar
  is_recurring: boolean;
  template_sequence: TemplateInSequence[];

  // Zamanlama
  first_send_date: string;
  recurrence_interval_days?: number;

  // Ayarlar
  stop_on_reply: boolean;
  reply_notification_email?: string;

  // İstatistikler
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  total_replied: number;
  total_failed: number;

  // Durum
  status:
    | 'draft'
    | 'scheduled'
    | 'active'
    | 'paused'
    | 'completed'
    | 'cancelled';

  // Audit
  created_by?: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface CampaignSend {
  id: number;
  campaign_id: number;
  contact_id: number;
  template_id?: number;

  sequence_index: number;
  scheduled_date: string;
  sent_date?: string;

  rendered_subject?: string;
  rendered_body_html?: string;
  rendered_body_text?: string;

  is_sent: boolean;
  is_opened: boolean;
  is_clicked: boolean;
  is_replied: boolean;
  is_failed: boolean;
  is_cancelled: boolean;

  opened_at?: string;
  clicked_at?: string;
  replied_at?: string;
  failed_at?: string;

  failure_reason?: string;
  tracking_pixel_url?: string;
  unsubscribe_url?: string;

  created_at: string;
  updated_at: string;
}

export interface CampaignListParams {
  page?: number;
  pageSize?: number;
  limit?: number;
  name?: string;
  status?: string;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface CampaignListResponse {
  success: boolean;
  data: EmailCampaign[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
  };
}

export interface CampaignResponse {
  success: boolean;
  data?: EmailCampaign;
  message?: string;
}

export interface CampaignStatsResponse {
  success: boolean;
  data: {
    summary: {
      total_campaigns: number;
      active_campaigns: number;
      draft_campaigns: number;
      completed_campaigns: number;
      total_sends: number;
      total_opens: number;
      total_clicks: number;
    };
    byStatus: Array<{
      status: string;
      count: number;
    }>;
  };
}

// Campaign Create/Edit Steps
export interface CampaignFormStep1 {
  target_contact_ids: number[];
  target_filters?: TargetFilters;
}

export interface CampaignFormStep2 {
  is_recurring: boolean;
  template_sequence: TemplateInSequence[];
  first_send_date: string;
  recurrence_interval_days?: number;
}

export interface CampaignFormStep3 {
  stop_on_reply: boolean;
  reply_notification_email?: string;
}

export interface CampaignFormData
  extends CampaignFormStep1,
    CampaignFormStep2,
    CampaignFormStep3 {
  name: string;
  description?: string;
  status?:
    | 'draft'
    | 'scheduled'
    | 'active'
    | 'paused'
    | 'completed'
    | 'cancelled';
}

// Email Template Types

export interface EmailTemplate {
  id: number;
  name: string;
  description?: string;
  category?:
    | 'newsletter'
    | 'promotional'
    | 'transactional'
    | 'welcome'
    | 'announcement'
    | 'follow-up'
    | 'reminder'
    | 'other';

  subject: string;
  preheader?: string;

  body_html: string;
  body_text?: string;

  from_name: string;
  from_email: string;
  reply_to?: string;

  cc_emails?: string[];
  bcc_emails?: string[];

  priority: 'high' | 'normal' | 'low';
  track_opens: boolean;
  track_clicks: boolean;

  available_variables?: TemplateVariable[];
  attachments?: TemplateAttachment[];
  design_json?: any;
  thumbnail_url?: string;

  tags?: string[];
  language: string;

  usage_count: number;
  last_used_at?: string;

  status: 'draft' | 'active' | 'archived';
  is_default: boolean;

  created_by?: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
}

export interface TemplateVariable {
  name: string;
  description: string;
  example: string;
}

export interface TemplateAttachment {
  filename: string;
  url: string;
  size: number;
}

export interface TemplateListParams {
  page?: number;
  pageSize?: number;
  limit?: number;
  name?: string;
  category?: string;
  status?: string;
  tags?: string;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface TemplateListResponse {
  success: boolean;
  data: EmailTemplate[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
  };
}

export interface TemplateResponse {
  success: boolean;
  data?: EmailTemplate;
  message?: string;
}

export interface TemplateStatsResponse {
  success: boolean;
  data: {
    summary: {
      total_templates: number;
      active_templates: number;
      draft_templates: number;
      archived_templates: number;
      total_usage: number;
    };
    byCategory: Array<{
      category: string;
      count: number;
    }>;
  };
}

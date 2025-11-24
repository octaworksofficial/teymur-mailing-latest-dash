// Contact Types
export interface Contact {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  mobile_phone?: string;
  company?: string;
  company_title?: string;
  position?: string;
  status: 'active' | 'unsubscribed' | 'bounced' | 'complained';
  subscription_status: 'subscribed' | 'unsubscribed' | 'pending';
  source?: string;
  tags?: string[];
  custom_fields?: Record<string, any>;
  customer_representative?: string;
  country?: string;
  state?: string;
  district?: string;
  address_1?: string;
  address_2?: string;
  importance_level?: number;
  notes?: string;
  total_email_sent?: number;
  total_emails_sent?: number; // API uyumluluğu için (eski alan adı)
  total_emails_opened?: number;
  total_emails_clicked?: number;
  total_emails_bounced?: number;
  last_email_sent_at?: string;
  last_email_opened_at?: string;
  last_email_clicked_at?: string;
  last_opened_at?: string;
  last_clicked_at?: string;
  last_replied_at?: string;
  engagement_score?: number;
  subscribed_at?: string;
  unsubscribed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ContactListParams {
  page?: number;
  pageSize?: number;
  limit?: number;
  email?: string;
  status?: string;
  subscription_status?: string;
  tags?: string;
  custom_fields?: string;
  search?: string;
  customer_representative?: string;
  country?: string;
  state?: string;
  district?: string;
  importance_level?: number;
}

export interface ContactListResponse {
  success: boolean;
  data: Contact[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ContactResponse {
  success: boolean;
  data?: Contact;
  message?: string;
}

export interface ContactStatsResponse {
  success: boolean;
  data: {
    total_contacts: number;
    active_contacts: number;
    subscribed_contacts: number;
    new_this_month: number;
  };
}

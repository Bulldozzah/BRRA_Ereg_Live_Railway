import { api } from './api';

export interface DashboardStats {
  licenses: number;
  agencies: number;
  regulations: number;
  open_regulations: number;
  locations: number;
  industries: number;
  business_types: number;
  activities: number;
  comments: number;
  pending_comments: number;
  feedback_pending: number;
  news: number;
}

export interface ClickSummary {
  total_clicks: number;
  unique_links: number;
  top_agencies: { agency_name: string; clicks: number }[];
  top_licenses: { license_name: string; clicks: number }[];
  daily_clicks: { date: string; clicks: number }[];
}

export interface HomepageCounts {
  jurisdictions: number;
  business_types: number;
  licenses: number;
}

export const statsService = {
  getDashboardStats() {
    return api.get<{ success: boolean; data: DashboardStats }>('/stats');
  },

  healthCheck() {
    return api.get<{ status: string; database: string }>('/health');
  },

  getClickSummary(startDate?: string, endDate?: string) {
    return api.get<{ success: boolean; data: ClickSummary }>('/link-clicks/summary', {
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    });
  },

  getHomepageCounts() {
    return api.get<{ success: boolean; data: HomepageCounts }>('/stats/counts');
  },
};

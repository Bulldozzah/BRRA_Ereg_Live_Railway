import { api } from './api';
import type {
  BusinessActivity,
  BusinessLicense,
  PaginatedResponse,
  ApiResponse,
} from '@/types/database';

export interface ActivityWithCount extends BusinessActivity {
  license_count: number;
}

export interface ActivityDetail extends BusinessActivity {
  licenses: Pick<BusinessLicense, 'id' | 'name' | 'status' | 'agency_id'>[];
}

export interface ActivityListParams {
  page?: number;
  per_page?: number;
  search?: string;
  order_by?: string;
  order_dir?: string;
}

export const activityService = {
  list(params: ActivityListParams = {}) {
    return api.get<PaginatedResponse<ActivityWithCount>>('/activities', params as Record<string, string | number>);
  },

  getById(id: number | string) {
    return api.get<ApiResponse<ActivityDetail>>(`/activities/${id}`);
  },
};

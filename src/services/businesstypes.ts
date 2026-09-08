import { api } from './api';
import type {
  BusinessType,
  BusinessActivity,
  BusinessIndustry,
  PaginatedResponse,
  ApiResponse,
} from '@/types/database';

export interface BusinessTypeWithCount extends BusinessType {
  license_count: number;
  activity_count: number;
  activities: BusinessActivity[];
  industries: BusinessIndustry[];
}

export interface BusinessTypeDetail extends BusinessType {
  activities: BusinessActivity[];
  industries: BusinessIndustry[];
}

export interface BusinessTypeLicensesResponse {
  business_type: BusinessType;
  licenses: any[];
  total: number;
}

export interface BusinessTypeListParams {
  page?: number;
  per_page?: number;
  search?: string;
  order_by?: string;
  order_dir?: string;
  show_in_browse?: number;
  industry_id?: number | string;
}

export const businessTypeService = {
  list(params: BusinessTypeListParams = {}) {
    return api.get<PaginatedResponse<BusinessTypeWithCount>>('/businesstypes', params as Record<string, string | number>);
  },

  getById(id: number | string) {
    return api.get<ApiResponse<BusinessTypeDetail>>(`/businesstypes/${id}`);
  },

  getLicenses(id: number | string) {
    return api.get<ApiResponse<BusinessTypeLicensesResponse>>(`/businesstypes/${id}/licenses`);
  },
};

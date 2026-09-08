import { api } from './api';
import type {
  BusinessIndustry,
  BusinessAgency,
  PaginatedResponse,
  ApiResponse,
} from '@/types/database';

export interface IndustryWithCount extends BusinessIndustry {
  license_count: number;
}

export interface IndustryDetail extends BusinessIndustry {
  agencies: BusinessAgency[];
}

export interface IndustryListParams {
  page?: number;
  per_page?: number;
  search?: string;
  order_by?: string;
  order_dir?: string;
  show_in_browse?: number;
}

export const industryService = {
  list(params: IndustryListParams = {}) {
    return api.get<PaginatedResponse<IndustryWithCount>>('/industries', params as Record<string, string | number>);
  },

  getById(id: number | string) {
    return api.get<ApiResponse<IndustryDetail>>(`/industries/${id}`);
  },
};

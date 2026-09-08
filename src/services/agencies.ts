import { api } from './api';
import type {
  BusinessAgency,
  BusinessAgencyOffice,
  BusinessIndustry,
  PaginatedResponse,
  ApiResponse,
} from '@/types/database';

export interface AgencyDetail extends BusinessAgency {
  location_name: string | null;
  offices: BusinessAgencyOffice[];
  industries: BusinessIndustry[];
  license_count: number;
  users: { id: number; firstname: string; lastname: string; email: string }[];
}

export interface AgencyListParams {
  page?: number;
  per_page?: number;
  search?: string;
  order_by?: string;
  order_dir?: string;
}

export const agencyService = {
  list(params: AgencyListParams = {}) {
    return api.get<PaginatedResponse<BusinessAgency>>('/agencies', params as Record<string, string | number>);
  },

  getById(id: number | string) {
    return api.get<ApiResponse<AgencyDetail>>(`/agencies/${id}`);
  },

  getBySlug(slug: string) {
    return api.get<ApiResponse<BusinessAgency>>(`/agencies/slug/${slug}`);
  },

  create(data: Record<string, any>) {
    return api.post<ApiResponse<BusinessAgency>>('/agencies', data);
  },

  update(id: number | string, data: Record<string, any>) {
    return api.put<ApiResponse<BusinessAgency>>(`/agencies/${id}`, data);
  },

  delete(id: number | string) {
    return api.delete<ApiResponse<any>>(`/agencies/${id}`);
  },
};

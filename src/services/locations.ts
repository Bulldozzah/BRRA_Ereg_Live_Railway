import { api } from './api';
import type {
  BusinessLocation,
  BusinessLocationCategory,
  PaginatedResponse,
  ApiResponse,
} from '@/types/database';

export interface LocationDetail extends BusinessLocation {
  license_count: number;
  children: BusinessLocation[];
}

export interface LocationListParams {
  page?: number;
  per_page?: number;
  search?: string;
  order_by?: string;
  order_dir?: string;
}

export const locationService = {
  list(params: LocationListParams = {}) {
    return api.get<PaginatedResponse<BusinessLocation>>('/locations', params as Record<string, string | number>);
  },

  getById(id: number | string) {
    return api.get<ApiResponse<LocationDetail>>(`/locations/${id}`);
  },

  getCategories() {
    return api.get<ApiResponse<BusinessLocationCategory[]>>('/locations/categories/all');
  },
};

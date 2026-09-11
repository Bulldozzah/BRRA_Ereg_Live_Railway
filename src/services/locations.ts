import { api } from './api';
import type {
  BusinessLocation,
  BusinessLocationCategory,
  PaginatedResponse,
  ApiResponse,
} from '@/types/database';

export interface LocationWithCategory extends BusinessLocation {
  license_count: number;
  category_name: string | null;
}

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
  has_licenses?: number;
}

export const locationService = {
  list(params: LocationListParams = {}) {
    return api.get<PaginatedResponse<LocationWithCategory>>('/locations', params as Record<string, string | number>);
  },

  getById(id: number | string) {
    return api.get<ApiResponse<LocationDetail>>(`/locations/${id}`);
  },

  getCategories() {
    return api.get<ApiResponse<BusinessLocationCategory[]>>('/locations/categories/all');
  },
};

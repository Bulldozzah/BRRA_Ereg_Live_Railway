import { api } from './api';
import type { ApiResponse } from '@/types/database';

export interface SearchResult {
  id: number;
  name: string;
  slug: string | null;
  result_type: 'license' | 'regulation' | 'agency' | 'news';
}

export interface SearchResponse {
  licenses: SearchResult[];
  regulations: SearchResult[];
  agencies: SearchResult[];
  news: SearchResult[];
  total: number;
}

export const searchService = {
  search(q: string) {
    return api.get<ApiResponse<SearchResponse>>('/search', { q });
  },
};

import { api } from './api';
import type {
  Regulation,
  RegulationAttachment,
  Comment,
  Position,
  RegulationFieldData,
  PaginatedResponse,
  ApiResponse,
} from '@/types/database';

export interface RegulationDetail extends Regulation {
  agency_name: string | null;
  industry_name: string | null;
  attachments: RegulationAttachment[];
  comments: (Comment & { user_role: string | null })[];
  positions: Position[];
  field_data: (RegulationFieldData & { fieldlabel: string; fieldtype: number })[];
}

export interface RegulationListItem extends Regulation {
  agency_name: string | null;
  comment_count: number;
}

export interface RegulationListParams {
  page?: number;
  per_page?: number;
  search?: string;
  order_by?: string;
  order_dir?: string;
  agency_id?: number;
  industry_id?: number;
  published?: number;
  consultation_stage?: number;
}

export interface CommentSubmission {
  comment: string;
  user?: number;
  parent?: number | null;
  position?: number;
  documents?: string | null;
}

export interface ConsultationCounts {
  all: number;
  open: number;
  closing: number;
  completed: number;
  trending: number;
}

export interface SidebarItem {
  id: number;
  title: string;
  slug: string | null;
  closing_date: string | null;
  consultation_stage: number;
  agency_name: string | null;
  comment_count: number;
  days_remaining?: number;
  publish_date?: string | null;
}

export interface AgencyOption {
  id: number;
  name: string;
  slug: string | null;
  regulation_count: number;
}

export interface IndustryOption {
  id: number;
  name: string;
  regulation_count: number;
}

export interface SearchParams {
  agency?: string;
  industry?: string;
  keywords?: string;
  page?: number;
}

export const regulationService = {
  list(params: RegulationListParams = {}) {
    return api.get<PaginatedResponse<RegulationListItem>>('/regulations', params as Record<string, string | number>);
  },

  getById(id: number | string) {
    return api.get<ApiResponse<RegulationDetail>>(`/regulations/${id}`);
  },

  submitComment(regulationId: number | string, data: CommentSubmission) {
    return api.post<ApiResponse<{ id: number }>>(`/regulations/${regulationId}/comments`, data);
  },

  submitPosition(regulationId: number | string, data: { position: string; user?: number }) {
    return api.post<ApiResponse<{ id: number }>>(`/regulations/${regulationId}/position`, data);
  },

  likeComment(regulationId: number | string, commentId: number | string, user?: number) {
    return api.post<ApiResponse<{ liked: boolean }>>(`/regulations/${regulationId}/comments/${commentId}/like`, { user });
  },

  getCounts() {
    return api.get<ApiResponse<ConsultationCounts>>('/regulations/counts');
  },

  getTrending(limit = 10) {
    return api.get<ApiResponse<SidebarItem[]>>('/regulations/trending', { limit });
  },

  getClosingSoon(limit = 10) {
    return api.get<ApiResponse<SidebarItem[]>>('/regulations/closing-soon', { limit });
  },

  getCompleted(limit = 10) {
    return api.get<ApiResponse<SidebarItem[]>>('/regulations/completed', { limit });
  },

  getAgencies() {
    return api.get<ApiResponse<AgencyOption[]>>('/regulations/agencies');
  },

  getIndustries() {
    return api.get<ApiResponse<IndustryOption[]>>('/regulations/industries');
  },

  search(params: SearchParams) {
    return api.get<PaginatedResponse<RegulationListItem>>('/regulations/search', params as Record<string, string | number>);
  },

  create(data: Record<string, any>) {
    return api.post<ApiResponse<Regulation>>('/regulations', data);
  },

  update(id: number | string, data: Record<string, any>) {
    return api.put<ApiResponse<Regulation>>(`/regulations/${id}`, data);
  },

  delete(id: number | string) {
    return api.delete<ApiResponse<any>>(`/regulations/${id}`);
  },
};

import { api } from './api';
import type {
  LicenseWorkflow,
  BusinessAgency,
  Group,
  PaginatedResponse,
  ApiResponse,
} from '@/types/database';

export interface WorkflowWithRelations extends LicenseWorkflow {
  agencies: Pick<BusinessAgency, 'id' | 'name'>[];
  groups: Pick<Group, 'id' | 'name'>[];
}

export interface WorkflowDetail extends LicenseWorkflow {
  agencies: BusinessAgency[];
  groups: Group[];
  users: { user_id: number }[];
}

export interface WorkflowListParams {
  page?: number;
  per_page?: number;
  search?: string;
  order_by?: string;
  order_dir?: string;
}

export const workflowService = {
  list(params: WorkflowListParams = {}) {
    return api.get<PaginatedResponse<WorkflowWithRelations>>('/workflows', params as Record<string, string | number>);
  },

  getById(id: number | string) {
    return api.get<ApiResponse<WorkflowDetail>>(`/workflows/${id}`);
  },
};

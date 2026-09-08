import { api } from './api';
import type {
  BusinessLicense,
  LicenseRequirement,
  LicenseStatute,
  LicenseDownload,
  BusinessActivity,
  LicenseFieldData,
  PaginatedResponse,
  ApiResponse,
} from '@/types/database';

export interface LicenseDetail extends Omit<BusinessLicense, 'requirements'> {
  agency_name: string | null;
  agency_slug: string | null;
  location_name: string | null;
  requirements_text: string | null;
  requirements: LicenseRequirement[];
  statutes: LicenseStatute[];
  downloads: LicenseDownload[];
  activities: BusinessActivity[];
  field_data: (LicenseFieldData & { fieldlabel: string; fieldtype: number })[];
}

export interface LicenseListParams {
  page?: number;
  per_page?: number;
  search?: string;
  order_by?: string;
  order_dir?: string;
  agency_id?: number;
  location_id?: number;
  industry_id?: number;
  business_type_id?: number;
  status?: string;
  stage_id?: number;
}

export const licenseService = {
  list(params: LicenseListParams = {}) {
    return api.get<PaginatedResponse<BusinessLicense>>('/licenses', params as Record<string, string | number>);
  },

  getById(id: number | string) {
    return api.get<ApiResponse<LicenseDetail>>(`/licenses/${id}`);
  },

  getByAgencySlug(slug: string, params: LicenseListParams = {}) {
    return api.get<PaginatedResponse<BusinessLicense> & { agency: { id: number; name: string } }>(
      `/licenses/agency/${slug}`,
      params as Record<string, string | number>
    );
  },

  getByLocation(locationId: number | string, params: LicenseListParams = {}) {
    return api.get<PaginatedResponse<BusinessLicense>>(
      `/licenses/location/${locationId}`,
      params as Record<string, string | number>
    );
  },
};

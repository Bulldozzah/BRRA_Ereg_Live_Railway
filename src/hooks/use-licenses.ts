import { useQuery } from '@tanstack/react-query';
import { licenseService, type LicenseListParams } from '@/services/licenses';

export function useLicenses(params: LicenseListParams = {}) {
  return useQuery({
    queryKey: ['licenses', params],
    queryFn: () => licenseService.list(params),
  });
}

export function useLicense(id: number | string | undefined) {
  return useQuery({
    queryKey: ['license', id],
    queryFn: () => licenseService.getById(id!),
    enabled: !!id,
  });
}

export function useLicensesByAgencySlug(slug: string | undefined, params: LicenseListParams = {}) {
  return useQuery({
    queryKey: ['licenses', 'agency', slug, params],
    queryFn: () => licenseService.getByAgencySlug(slug!, params),
    enabled: !!slug,
  });
}

export function useLicensesByLocation(locationId: number | string | undefined, params: LicenseListParams = {}) {
  return useQuery({
    queryKey: ['licenses', 'location', locationId, params],
    queryFn: () => licenseService.getByLocation(locationId!, params),
    enabled: !!locationId,
  });
}

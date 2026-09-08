import { useQuery } from '@tanstack/react-query';
import { agencyService, type AgencyListParams } from '@/services/agencies';

export function useAgencies(params: AgencyListParams = {}) {
  return useQuery({
    queryKey: ['agencies', params],
    queryFn: () => agencyService.list(params),
  });
}

export function useAgency(id: number | string | undefined) {
  return useQuery({
    queryKey: ['agency', id],
    queryFn: () => agencyService.getById(id!),
    enabled: !!id,
  });
}

export function useAgencyBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ['agency', 'slug', slug],
    queryFn: () => agencyService.getBySlug(slug!),
    enabled: !!slug,
  });
}

import { useQuery } from '@tanstack/react-query';
import { industryService, type IndustryListParams } from '@/services/industries';

export function useIndustries(params: IndustryListParams = {}) {
  return useQuery({
    queryKey: ['industries', params],
    queryFn: () => industryService.list(params),
  });
}

export function useIndustry(id: number | string | undefined) {
  return useQuery({
    queryKey: ['industry', id],
    queryFn: () => industryService.getById(id!),
    enabled: !!id,
  });
}

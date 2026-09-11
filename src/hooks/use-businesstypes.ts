import { useQuery } from '@tanstack/react-query';
import { businessTypeService, type BusinessTypeListParams } from '@/services/businesstypes';

export function useBusinessTypes(params: BusinessTypeListParams = {}, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['businesstypes', params],
    queryFn: () => businessTypeService.list(params),
    enabled: options.enabled ?? true,
  });
}

export function useBusinessType(id: number | string | undefined) {
  return useQuery({
    queryKey: ['businesstype', id],
    queryFn: () => businessTypeService.getById(id!),
    enabled: !!id,
  });
}

export function useBusinessTypeLicenses(id: number | string | undefined) {
  return useQuery({
    queryKey: ['businesstype-licenses', id],
    queryFn: () => businessTypeService.getLicenses(id!),
    enabled: !!id,
  });
}

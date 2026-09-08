import { useQuery } from '@tanstack/react-query';
import { locationService, type LocationListParams } from '@/services/locations';

export function useLocations(params: LocationListParams = {}) {
  return useQuery({
    queryKey: ['locations', params],
    queryFn: () => locationService.list(params),
  });
}

export function useLocation(id: number | string | undefined) {
  return useQuery({
    queryKey: ['location', id],
    queryFn: () => locationService.getById(id!),
    enabled: !!id,
  });
}

export function useLocationCategories() {
  return useQuery({
    queryKey: ['location-categories'],
    queryFn: () => locationService.getCategories(),
  });
}

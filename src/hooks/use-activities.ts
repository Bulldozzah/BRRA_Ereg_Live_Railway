import { useQuery } from '@tanstack/react-query';
import { activityService, type ActivityListParams } from '@/services/activities';

export function useActivities(params: ActivityListParams = {}) {
  return useQuery({
    queryKey: ['activities', params],
    queryFn: () => activityService.list(params),
  });
}

export function useActivity(id: number | string | undefined) {
  return useQuery({
    queryKey: ['activity', id],
    queryFn: () => activityService.getById(id!),
    enabled: !!id,
  });
}

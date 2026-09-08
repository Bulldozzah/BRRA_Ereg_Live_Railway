import { useQuery } from '@tanstack/react-query';
import { statsService } from '@/services/stats';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => statsService.getDashboardStats(),
  });
}

export function useClickSummary(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['click-summary', startDate, endDate],
    queryFn: () => statsService.getClickSummary(startDate, endDate),
  });
}

export function useHealthCheck() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => statsService.healthCheck(),
    refetchInterval: 30000,
  });
}

export function useHomepageCounts() {
  return useQuery({
    queryKey: ['homepage-counts'],
    queryFn: () => statsService.getHomepageCounts(),
  });
}

import { useQuery } from '@tanstack/react-query';
import { searchService } from '@/services/search';

export function useSearch(query: string) {
  return useQuery({
    queryKey: ['search', query],
    queryFn: () => searchService.search(query),
    enabled: query.length >= 2,
  });
}

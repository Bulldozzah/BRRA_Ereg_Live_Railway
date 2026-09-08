import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { regulationService, type RegulationListParams, type CommentSubmission, type SearchParams } from '@/services/regulations';

export function useRegulations(params: RegulationListParams = {}) {
  return useQuery({
    queryKey: ['regulations', params],
    queryFn: () => regulationService.list(params),
  });
}

export function useRegulation(id: number | string | undefined) {
  return useQuery({
    queryKey: ['regulation', id],
    queryFn: () => regulationService.getById(id!),
    enabled: !!id,
  });
}

export function useSubmitComment(regulationId: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CommentSubmission) => regulationService.submitComment(regulationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regulation', regulationId] });
    },
  });
}

export function useConsultationCounts() {
  return useQuery({
    queryKey: ['regulation-counts'],
    queryFn: () => regulationService.getCounts(),
  });
}

export function useTrendingRegulations(limit = 10) {
  return useQuery({
    queryKey: ['regulations-trending', limit],
    queryFn: () => regulationService.getTrending(limit),
  });
}

export function useClosingSoonRegulations(limit = 10) {
  return useQuery({
    queryKey: ['regulations-closing-soon', limit],
    queryFn: () => regulationService.getClosingSoon(limit),
  });
}

export function useCompletedRegulations(limit = 10) {
  return useQuery({
    queryKey: ['regulations-completed', limit],
    queryFn: () => regulationService.getCompleted(limit),
  });
}

export function useRegulationAgencies() {
  return useQuery({
    queryKey: ['regulation-agencies'],
    queryFn: () => regulationService.getAgencies(),
  });
}

export function useRegulationIndustries() {
  return useQuery({
    queryKey: ['regulation-industries'],
    queryFn: () => regulationService.getIndustries(),
  });
}

export function useRegulationSearch(params: SearchParams, enabled = true) {
  return useQuery({
    queryKey: ['regulation-search', params],
    queryFn: () => regulationService.search(params),
    enabled,
  });
}

export function useSubmitPosition(regulationId: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { position: string; user?: number }) => regulationService.submitPosition(regulationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regulation', regulationId] });
    },
  });
}

export function useLikeComment(regulationId: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, user }: { commentId: number | string; user?: number }) =>
      regulationService.likeComment(regulationId, commentId, user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regulation', regulationId] });
    },
  });
}

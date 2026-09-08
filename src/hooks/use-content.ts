import { useQuery, useMutation } from '@tanstack/react-query';
import {
  newsService,
  faqService,
  pageService,
  bannerService,
  policyService,
  menuService,
  feedbackService,
  procedureService,
  forwardPlanService,
  newsletterService,
  type NewsListParams,
  type FeedbackSubmission,
  type ForwardPlansListParams,
  type NewsletterSubscription,
} from '@/services/content';

// ======================== NEWS ========================

export function useNewsList(params: NewsListParams = {}) {
  return useQuery({
    queryKey: ['news', params],
    queryFn: () => newsService.list(params),
  });
}

export function useNewsArticle(id: number | string | undefined) {
  return useQuery({
    queryKey: ['news', id],
    queryFn: () => newsService.getById(id!),
    enabled: !!id,
  });
}

// ======================== FAQ ========================

export function useFAQs(site?: number) {
  return useQuery({
    queryKey: ['faqs', site],
    queryFn: () => faqService.list(site),
  });
}

// ======================== PAGES ========================

export function usePages(site?: number) {
  return useQuery({
    queryKey: ['pages', site],
    queryFn: () => pageService.list(site),
  });
}

export function usePageBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ['page', slug],
    queryFn: () => pageService.getBySlug(slug!),
    enabled: !!slug,
  });
}

// ======================== BANNERS ========================

export function useBanners() {
  return useQuery({
    queryKey: ['banners'],
    queryFn: () => bannerService.list(),
  });
}

export function useRegulationBanners() {
  return useQuery({
    queryKey: ['regulation-banners'],
    queryFn: () => bannerService.regulationBanners(),
  });
}

// ======================== POLICIES ========================

export function usePolicies() {
  return useQuery({
    queryKey: ['policies'],
    queryFn: () => policyService.list(),
  });
}

export function usePolicyBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ['policy', slug],
    queryFn: () => policyService.getBySlug(slug!),
    enabled: !!slug,
  });
}

// ======================== MENUS ========================

export function useMenus() {
  return useQuery({
    queryKey: ['menus'],
    queryFn: () => menuService.list(),
  });
}

// ======================== FEEDBACK ========================

export function useSubmitFeedback() {
  return useMutation({
    mutationFn: (data: FeedbackSubmission) => feedbackService.submit(data),
  });
}

// ======================== PROCEDURES ========================

export function useProcedures() {
  return useQuery({
    queryKey: ['procedures'],
    queryFn: () => procedureService.list(),
  });
}

export function useProcedureBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ['procedure', slug],
    queryFn: () => procedureService.getBySlug(slug!),
    enabled: !!slug,
  });
}

// ======================== FORWARD PLANS ========================

export function useForwardPlans(params: ForwardPlansListParams = {}) {
  return useQuery({
    queryKey: ['forward-plans', params],
    queryFn: () => forwardPlanService.list(params),
  });
}

export function useForwardPlanBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ['forward-plan', slug],
    queryFn: () => forwardPlanService.getBySlug(slug!),
    enabled: !!slug,
  });
}

// ======================== NEWSLETTER ========================

export function useNewsletterSubscribe() {
  return useMutation({
    mutationFn: (data: NewsletterSubscription) => newsletterService.subscribe(data),
  });
}

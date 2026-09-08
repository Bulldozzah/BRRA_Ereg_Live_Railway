import { api } from './api';
import type {
  News,
  FAQ,
  Page,
  Banner,
  Policy,
  Menu,
  BusinessStartup,
  ProcedureCategory,
  ForwardPlan,
  ForwardPlanCategory,
  ForwardPlanAttachment,
  RegulationBanner,
  PaginatedResponse,
  ApiResponse,
} from '@/types/database';

// ======================== NEWS ========================

export interface NewsListParams {
  page?: number;
  per_page?: number;
  search?: string;
  order_by?: string;
  order_dir?: string;
}

export const newsService = {
  list(params: NewsListParams = {}) {
    return api.get<PaginatedResponse<News>>('/content/news', params as Record<string, string | number>);
  },

  getById(id: number | string) {
    return api.get<ApiResponse<News>>(`/content/news/${id}`);
  },
};

// ======================== FAQ ========================

export const faqService = {
  list(site?: number) {
    return api.get<ApiResponse<FAQ[]>>('/content/faqs', { site });
  },
};

// ======================== PAGES ========================

export const pageService = {
  list(site?: number) {
    return api.get<ApiResponse<Pick<Page, 'id' | 'page_title' | 'page_breadcrumb_title' | 'slug' | 'page_order' | 'menu_id' | 'parent_id' | 'site'>[]>>(
      '/content/pages',
      { site }
    );
  },

  getBySlug(slug: string) {
    return api.get<ApiResponse<Page>>(`/content/pages/slug/${slug}`);
  },
};

// ======================== BANNERS ========================

export const bannerService = {
  list() {
    return api.get<ApiResponse<Banner[]>>('/content/banners');
  },

  regulationBanners() {
    return api.get<ApiResponse<RegulationBanner[]>>('/content/regulation-banners');
  },
};

// ======================== POLICIES ========================

export interface PolicyWithType extends Policy {
  policy_type_name: string | null;
}

export const policyService = {
  list() {
    return api.get<ApiResponse<PolicyWithType[]>>('/content/policies');
  },

  getBySlug(slug: string) {
    return api.get<ApiResponse<PolicyWithType>>(`/content/policies/slug/${slug}`);
  },
};

// ======================== MENUS ========================

export const menuService = {
  list() {
    return api.get<ApiResponse<Menu[]>>('/content/menus');
  },
};

// ======================== FEEDBACK ========================

export interface FeedbackSubmission {
  subject: string;
  type?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  message: string;
  site?: number;
}

export const feedbackService = {
  submit(data: FeedbackSubmission) {
    return api.post<ApiResponse<{ id: number }>>('/content/feedback', data);
  },
};

// ======================== BUSINESS PROCEDURES ========================

export interface ProceduresResponse {
  categories: ProcedureCategory[];
  procedures: BusinessStartup[];
}

export const procedureService = {
  list() {
    return api.get<ApiResponse<ProceduresResponse>>('/content/procedures');
  },

  getBySlug(slug: string) {
    return api.get<ApiResponse<BusinessStartup>>(`/content/procedures/${slug}`);
  },
};

// ======================== FORWARD PLANS ========================

export interface ForwardPlanDetail extends ForwardPlan {
  agency_name: string | null;
  category_name: string | null;
  attachments: ForwardPlanAttachment[];
}

export interface ForwardPlansListParams {
  page?: number;
  per_page?: number;
  search?: string;
  order_by?: string;
  order_dir?: string;
}

export const forwardPlanService = {
  list(params: ForwardPlansListParams = {}) {
    return api.get<PaginatedResponse<ForwardPlan> & { categories: ForwardPlanCategory[] }>(
      '/content/forward-plans',
      params as Record<string, string | number>
    );
  },

  getBySlug(slug: string) {
    return api.get<ApiResponse<ForwardPlanDetail>>(`/content/forward-plans/${slug}`);
  },
};

// ======================== NEWSLETTER ========================

export interface NewsletterSubscription {
  name?: string;
  email: string;
  organisation?: string;
}

export const newsletterService = {
  subscribe(data: NewsletterSubscription) {
    return api.post<ApiResponse<{ id: number }>>('/content/newsletter/subscribe', data);
  },
};

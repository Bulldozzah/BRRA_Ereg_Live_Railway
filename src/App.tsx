import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Index from "./pages/Index";
import BrowseLicenses from "./pages/browse/BrowseLicenses";
import {
  BrowseJurisdictions, BrowseIndustries, BrowseBusinessTypes, BrowseActivities, BrowseAgencies,
} from "./pages/browse/ListPages";
import LicenseDetail from "./pages/license/LicenseDetail";
import NoticesHome, { RegulationDetail, ForwardPlanDetail } from "./pages/notices/Notices";
import {
  NewsList, NewsArticle, FAQsPage, ContactPage, StaticPage, BusinessProcedures, NotFoundPage,
} from "./pages/info/InfoPages";
import AboutPage from "./pages/info/AboutPage";
import { Login, Register, AdminLogin } from "./pages/auth/Auth";
import Dashboard from "./pages/admin/Dashboard";
import {
  ManageLicenses, ManageAgencies, ManageLocations, ManageIndustries, ManageBusinessTypes, ManageActivities, ManageWorkflows,
  ManageRegulations, ManageComments, ManageNews, ManagePages, ManageFAQs, ManageBanners,
  ManagePolicy, ManageFeedback, ManageUsers, ManageGroups, RegulationsDashboard, AdminSearch,
} from "./pages/admin/ManagePages";
import BusinessTypeForm from "./pages/admin/BusinessTypeForm";
import BusinessActivityForm from "./pages/admin/BusinessActivityForm";
import IssuingAuthorityForm from "./pages/admin/IssuingAuthorityForm";
import LicenseForm from "./pages/admin/LicenseForm";
import LicenseShow from "./pages/admin/LicenseShow";
import JurisdictionForm from "./pages/admin/JurisdictionForm";
import ConsultationForm from "./pages/admin/ConsultationForm";
import UserForm from "./pages/admin/UserForm";
import { RequireAdmin } from "./components/auth/RequireAdmin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Browse */}
          <Route path="/browse/licenses" element={<BrowseLicenses />} />
          <Route path="/browse/licenses-agency/:slug" element={<BrowseLicenses />} />
          <Route path="/browse/jurisdictions" element={<BrowseJurisdictions />} />
          <Route path="/browse/locations/license/:id" element={<BrowseLicenses />} />
          <Route path="/browse/listindustries" element={<BrowseIndustries />} />
          <Route path="/browse/listbusinesstypes" element={<BrowseBusinessTypes />} />
          <Route path="/browse/business-types" element={<BrowseBusinessTypes />} />
          <Route path="/browse/business-types/licenses/:id" element={<BrowseLicenses />} />
          <Route path="/browse/listactivities" element={<BrowseActivities />} />
          <Route path="/browse/agencies" element={<BrowseAgencies />} />

          {/* Licence */}
          <Route path="/license/id/:id" element={<LicenseDetail />} />
          <Route path="/printlicense/id/:id" element={<LicenseDetail />} />

          {/* Notice & Comment */}
          <Route path="/notices" element={<NoticesHome />} />
          <Route path="/notices/regulation/:id" element={<RegulationDetail />} />
          <Route path="/notices/faqs" element={<FAQsPage namespace="notice" />} />
          <Route path="/notices/contactus" element={<ContactPage />} />
          <Route path="/notices/forward-plan/:slug" element={<ForwardPlanDetail />} />
          <Route path="/notices/pages/:slug" element={<StaticPage />} />

          {/* Info */}
          <Route path="/news/articles" element={<NewsList />} />
          <Route path="/news/article/:id" element={<NewsArticle />} />
          <Route path="/faqs" element={<FAQsPage />} />
          <Route path="/contactus" element={<ContactPage />} />
          <Route path="/press/:id" element={<StaticPage />} />
          <Route path="/policy/:slug" element={<StaticPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/business-procedures" element={<BusinessProcedures />} />
          <Route path="/business-procedures/details/:slug" element={<StaticPage />} />

          {/* Admin */}
          <Route path="/login-admin" element={<AdminLogin />} />
          <Route path="/login-admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<RequireAdmin><Dashboard /></RequireAdmin>} />
          <Route path="/login-admin/admin/dashboard" element={<RequireAdmin><Dashboard /></RequireAdmin>} />
          <Route path="/login-admin/search" element={<RequireAdmin><AdminSearch /></RequireAdmin>} />
          <Route path="/login-admin/managelicenses" element={<RequireAdmin><ManageLicenses /></RequireAdmin>} />
          <Route path="/login-admin/managelicenses/new" element={<RequireAdmin><LicenseForm /></RequireAdmin>} />
          <Route path="/login-admin/managelicenses/:id/edit" element={<RequireAdmin><LicenseForm /></RequireAdmin>} />
          <Route path="/login-admin/managelicenses/:id/show" element={<RequireAdmin><LicenseShow /></RequireAdmin>} />
          <Route path="/login-admin/managelicenses/:rest" element={<RequireAdmin><ManageLicenses /></RequireAdmin>} />
          <Route path="/login-admin/manageagencies" element={<RequireAdmin><ManageAgencies /></RequireAdmin>} />
          <Route path="/login-admin/manageagencies/new" element={<RequireAdmin><IssuingAuthorityForm /></RequireAdmin>} />
          <Route path="/login-admin/manageagencies/:id/edit" element={<RequireAdmin><IssuingAuthorityForm /></RequireAdmin>} />
          <Route path="/login-admin/managelocations" element={<RequireAdmin><ManageLocations /></RequireAdmin>} />
          <Route path="/login-admin/managelocations/new" element={<RequireAdmin><JurisdictionForm /></RequireAdmin>} />
          <Route path="/login-admin/managelocations/:id/edit" element={<RequireAdmin><JurisdictionForm /></RequireAdmin>} />
          <Route path="/login-admin/manageindustries" element={<RequireAdmin><ManageIndustries /></RequireAdmin>} />
          <Route path="/login-admin/managebusinesstypes" element={<RequireAdmin><ManageBusinessTypes /></RequireAdmin>} />
          <Route path="/login-admin/managebusinesstypes/new" element={<RequireAdmin><BusinessTypeForm /></RequireAdmin>} />
          <Route path="/login-admin/manageactivities" element={<RequireAdmin><ManageActivities /></RequireAdmin>} />
          <Route path="/login-admin/manageactivities/new" element={<RequireAdmin><BusinessActivityForm /></RequireAdmin>} />
          <Route path="/login-admin/manageworkflows" element={<RequireAdmin><ManageWorkflows /></RequireAdmin>} />
          <Route path="/login-admin/regulations/admin" element={<RequireAdmin><RegulationsDashboard /></RequireAdmin>} />
          <Route path="/login-admin/manageregulations" element={<RequireAdmin><ManageRegulations /></RequireAdmin>} />
          <Route path="/login-admin/manageregulations/new" element={<RequireAdmin><ConsultationForm /></RequireAdmin>} />
          <Route path="/login-admin/manageregulations/:id/edit" element={<RequireAdmin><ConsultationForm /></RequireAdmin>} />
          <Route path="/login-admin/managecomments" element={<RequireAdmin><ManageComments /></RequireAdmin>} />
          <Route path="/login-admin/managenews" element={<RequireAdmin><ManageNews /></RequireAdmin>} />
          <Route path="/login-admin/managepages" element={<RequireAdmin><ManagePages /></RequireAdmin>} />
          <Route path="/login-admin/managefaq" element={<RequireAdmin><ManageFAQs /></RequireAdmin>} />
          <Route path="/login-admin/managefaq/nc" element={<RequireAdmin><ManageFAQs /></RequireAdmin>} />
          <Route path="/login-admin/managebanners" element={<RequireAdmin><ManageBanners /></RequireAdmin>} />
          <Route path="/login-admin/managepolicy" element={<RequireAdmin><ManagePolicy /></RequireAdmin>} />
          <Route path="/login-admin/managefeedback" element={<RequireAdmin><ManageFeedback /></RequireAdmin>} />
          <Route path="/login-admin/manageusers" element={<RequireAdmin><ManageUsers /></RequireAdmin>} />
          <Route path="/login-admin/manageusers/new" element={<RequireAdmin><UserForm /></RequireAdmin>} />
          <Route path="/login-admin/managegroups" element={<RequireAdmin><ManageGroups /></RequireAdmin>} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

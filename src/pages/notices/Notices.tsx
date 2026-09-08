import { Link, useParams, useSearchParams } from "react-router-dom";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  useRegulations, useRegulation, useConsultationCounts, useTrendingRegulations,
  useClosingSoonRegulations, useCompletedRegulations, useRegulationAgencies,
  useRegulationIndustries, useRegulationSearch, useSubmitComment, useSubmitPosition, useLikeComment,
} from "@/hooks/use-regulations";
import { useFAQs, useForwardPlans, useForwardPlanBySlug, useSubmitFeedback } from "@/hooks/use-content";
import {
  Calendar, MessageSquare, ThumbsUp, ArrowRight, FileText, Users, Loader2, Search,
  ChevronDown, ChevronLeft, ChevronRight, Mail, Phone, MapPin, Send, ClipboardList,
  Megaphone, HelpCircle, TrendingUp, Clock, CheckCircle2, Building2, Factory, Flame,
  ExternalLink, Paperclip, Shield, Eye,
} from "lucide-react";
import { useState } from "react";
import { stripHtml } from "@/lib/strip-html";

type TabKey = "regulations" | "forward-plans" | "faqs" | "contact";

const TAB_CONFIG: { key: TabKey; label: string; icon: typeof FileText }[] = [
  { key: "regulations", label: "Consultations", icon: Megaphone },
  { key: "forward-plans", label: "Forward Plans", icon: ClipboardList },
  { key: "faqs", label: "FAQs", icon: HelpCircle },
  { key: "contact", label: "Contact Us", icon: Mail },
];

type SubTab = "all" | "open" | "closing" | "completed" | "trending";

// ─── Regulation Card ────────────────────────────────────────────────────────
const RegulationCard = ({ r }: { r: any }) => {
  const closing = r.closing_date ? new Date(r.closing_date) : null;
  const daysLeft = closing ? Math.max(0, Math.ceil((closing.getTime() - Date.now()) / 86400000)) : 0;
  const isOpen = r.consultation_stage === 1;
  return (
    <article className="bg-white border border-sand-200 p-5 md:p-6 rounded-2xl hover:border-copper-500/30 transition-colors">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${isOpen ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500"}`}>
              {isOpen ? "Open" : "Closed"}
            </span>
            {r.agency_name && (
              <span className="text-xs text-muted-foreground">{r.agency_name}</span>
            )}
          </div>
          <h3 className="font-serif text-lg font-medium mb-1.5">
            <Link to={`/notices/regulation/${r.id}`} className="hover:text-primary transition-colors">{r.title}</Link>
          </h3>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{stripHtml(r.description)}</p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {r.publish_date && <span className="inline-flex items-center gap-1"><Calendar size={11} /> Published {new Date(r.publish_date).toLocaleDateString()}</span>}
            <span className="inline-flex items-center gap-1"><Calendar size={11} /> Closes {r.closing_date ? new Date(r.closing_date).toLocaleDateString() : 'TBD'}</span>
            <span className="inline-flex items-center gap-1"><MessageSquare size={11} /> {r.comment_count ?? 0} comments</span>
          </div>
        </div>
        <div className="shrink-0 flex flex-col items-start md:items-end gap-2">
          {isOpen && closing && (
            <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${daysLeft <= 7 ? "bg-red-50 text-red-600" : "bg-copper-50 text-copper-600"}`}>
              {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
            </span>
          )}
          <Link to={`/notices/regulation/${r.id}`} className="text-sm font-semibold inline-flex items-center gap-1 text-copper-600 hover:text-copper-700">
            {isOpen ? "Read & Comment" : "View Details"} <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
};

// ─── Sidebar Widget ─────────────────────────────────────────────────────────
const SidebarWidget = ({ title, icon: Icon, items, emptyText }: { title: string; icon: typeof Flame; items: any[]; emptyText: string }) => (
  <div className="bg-white border border-sand-200 rounded-2xl p-5">
    <h3 className="flex items-center gap-2 font-serif text-sm font-medium mb-3">
      <Icon size={15} className="text-copper-600" /> {title}
    </h3>
    {items.length === 0 ? (
      <p className="text-xs text-muted-foreground">{emptyText}</p>
    ) : (
      <ul className="space-y-2">
        {items.slice(0, 5).map((item) => (
          <li key={item.id}>
            <Link to={`/notices/regulation/${item.id}`} className="group block">
              <div className="text-sm font-medium group-hover:text-copper-600 transition-colors line-clamp-1">{item.title}</div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                {item.comment_count != null && <span>{item.comment_count} comments</span>}
                {item.days_remaining != null && <span>{item.days_remaining} day{item.days_remaining !== 1 ? 's' : ''} left</span>}
                {item.agency_name && <span>{item.agency_name}</span>}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    )}
  </div>
);

// ─── Pagination ─────────────────────────────────────────────────────────────
const Pagination = ({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-1 mt-8">
      <button disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm border border-sand-200 disabled:opacity-40 hover:bg-sand-50">
        <ChevronLeft size={14} /> Prev
      </button>
      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
        let p: number;
        if (totalPages <= 7) p = i + 1;
        else if (page <= 4) p = i + 1;
        else if (page >= totalPages - 3) p = totalPages - 6 + i;
        else p = page - 3 + i;
        return (
          <button key={p} onClick={() => onPageChange(p)} className={`px-3 py-2 rounded-lg text-sm ${p === page ? "bg-copper-600 text-white" : "border border-sand-200 hover:bg-sand-50"}`}>
            {p}
          </button>
        );
      })}
      <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm border border-sand-200 disabled:opacity-40 hover:bg-sand-50">
        Next <ChevronRight size={14} />
      </button>
    </div>
  );
};

// ─── Regulations Tab (Full Consultations Page) ──────────────────────────────
const RegulationsTab = () => {
  const [subTab, setSubTab] = useState<SubTab>("all");
  const [page, setPage] = useState(1);
  const [searchAgency, setSearchAgency] = useState("0");
  const [searchIndustry, setSearchIndustry] = useState("0");
  const [searchKeywords, setSearchKeywords] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Data hooks
  const { data: countsRes } = useConsultationCounts();
  const counts = countsRes?.data ?? { all: 0, open: 0, closing: 0, completed: 0, trending: 0 };

  const stageMap: Record<SubTab, number | undefined> = { all: undefined, open: 1, closing: 1, completed: 2, trending: undefined };
  const listParams: any = { per_page: 10, page, published: 1 };
  if (stageMap[subTab] !== undefined) listParams.consultation_stage = stageMap[subTab];
  const { data: regulationsData, isLoading: listLoading } = useRegulations(listParams);

  const searchParams = { agency: searchAgency, industry: searchIndustry, keywords: searchKeywords, page };
  const { data: searchData, isLoading: searchLoading } = useRegulationSearch(searchParams, isSearching);

  const { data: trendingRes } = useTrendingRegulations(5);
  const { data: closingRes } = useClosingSoonRegulations(5);
  const { data: completedRes } = useCompletedRegulations(5);
  const { data: agenciesRes } = useRegulationAgencies();
  const { data: industriesRes } = useRegulationIndustries();

  const trending = trendingRes?.data ?? [];
  const closingSoon = closingRes?.data ?? [];
  const completed = completedRes?.data ?? [];
  const agencies = agenciesRes?.data ?? [];
  const industries = industriesRes?.data ?? [];

  const activeData = isSearching ? searchData : regulationsData;
  const regulations = activeData?.data ?? [];
  const totalPages = activeData?.total_pages ?? 1;
  const isLoading = isSearching ? searchLoading : listLoading;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchAgency || searchAgency === "0") {
      if (!searchIndustry || searchIndustry === "0") {
        if (!searchKeywords.trim()) { setIsSearching(false); return; }
      }
    }
    setPage(1);
    setIsSearching(true);
  };

  const clearSearch = () => {
    setSearchAgency("0");
    setSearchIndustry("0");
    setSearchKeywords("");
    setIsSearching(false);
    setPage(1);
  };

  const handleSubTab = (t: SubTab) => {
    setSubTab(t);
    setPage(1);
    setIsSearching(false);
  };

  const SUB_TABS: { key: SubTab; label: string; icon: typeof FileText; count: number }[] = [
    { key: "all", label: "All", icon: FileText, count: counts.all },
    { key: "open", label: "Open", icon: Eye, count: counts.open },
    { key: "closing", label: "Closing Soon", icon: Clock, count: counts.closing },
    { key: "completed", label: "Completed", icon: CheckCircle2, count: counts.completed },
    { key: "trending", label: "Trending", icon: TrendingUp, count: counts.trending },
  ];

  return (
    <div>
      {/* Sub-tab Navigation */}
      <div className="flex flex-wrap gap-1 bg-sand-50 border border-sand-200 rounded-xl p-1 mb-6">
        {SUB_TABS.map((t) => {
          const active = t.key === subTab && !isSearching;
          const Icon = t.icon;
          return (
            <button key={t.key} type="button" onClick={() => handleSubTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${active ? "bg-white text-copper-600 shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-sand-100"}`}>
              <Icon size={13} />
              <span>{t.label}</span>
              <span className={`ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full ${active ? "bg-copper-50 text-copper-700" : "bg-sand-200/60"}`}>{t.count}</span>
            </button>
          );
        })}
      </div>

      {/* Search & Filter */}
      <form onSubmit={handleSearch} className="bg-white border border-sand-200 rounded-xl p-4 mb-6">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[160px]">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1 block">Agency</label>
            <select value={searchAgency} onChange={(e) => setSearchAgency(e.target.value)}
              className="w-full border border-sand-200 rounded-lg px-3 py-2 text-sm bg-white">
              <option value="0">All Agencies</option>
              {agencies.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.regulation_count})</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1 block">Industry</label>
            <select value={searchIndustry} onChange={(e) => setSearchIndustry(e.target.value)}
              className="w-full border border-sand-200 rounded-lg px-3 py-2 text-sm bg-white">
              <option value="0">All Industries</option>
              {industries.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.regulation_count})</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1 block">Keywords</label>
            <input value={searchKeywords} onChange={(e) => setSearchKeywords(e.target.value)} placeholder="Search by title, description, tags…"
              className="w-full border border-sand-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="inline-flex items-center gap-1.5 bg-copper-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-copper-700 transition-colors">
              <Search size={14} /> Search
            </button>
            {isSearching && (
              <button type="button" onClick={clearSearch} className="text-sm text-muted-foreground hover:text-foreground px-3 py-2 border border-sand-200 rounded-lg">
                Clear
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Main Content + Sidebar Grid */}
      <div className="grid lg:grid-cols-[1fr_300px] gap-6">
        {/* Main List */}
        <div>
          {isSearching && (
            <div className="text-sm text-muted-foreground mb-4">
              Showing {regulations.length} of {activeData?.total ?? 0} result{(activeData?.total ?? 0) !== 1 ? 's' : ''}
              {searchKeywords && <> for "<span className="font-medium text-foreground">{searchKeywords}</span>"</>}
            </div>
          )}
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="animate-spin text-copper-600" size={32} /></div>
          ) : regulations.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground bg-white border border-sand-200 rounded-2xl">
              {isSearching ? "No consultations match your search criteria." : "No consultations found."}
            </div>
          ) : (
            <div className="space-y-3">
              {regulations.map((r: any) => <RegulationCard key={r.id} r={r} />)}
            </div>
          )}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 hidden lg:block">
          <SidebarWidget title="Trending Consultations" icon={Flame} items={trending} emptyText="No trending consultations." />
          <SidebarWidget title="Closing Soon" icon={Clock} items={closingSoon} emptyText="No consultations closing soon." />
          <SidebarWidget title="Recently Completed" icon={CheckCircle2} items={completed} emptyText="No completed consultations." />

          {industries.length > 0 && (
            <div className="bg-white border border-sand-200 rounded-2xl p-5">
              <h3 className="flex items-center gap-2 font-serif text-sm font-medium mb-3">
                <Factory size={15} className="text-copper-600" /> By Industry
              </h3>
              <ul className="space-y-1.5">
                {industries.slice(0, 8).map((ind) => (
                  <li key={ind.id}>
                    <button onClick={() => { setSearchIndustry(String(ind.id)); setPage(1); setIsSearching(true); }}
                      className="text-sm text-muted-foreground hover:text-copper-600 transition-colors flex items-center justify-between w-full">
                      <span className="line-clamp-1">{ind.name}</span>
                      <span className="text-xs bg-sand-100 px-1.5 py-0.5 rounded-full">{ind.regulation_count}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

// ─── Forward Plans Tab ──────────────────────────────────────────────────────
const ForwardPlansTab = () => {
  const { data: plansResponse, isLoading } = useForwardPlans({ per_page: 24 });
  const plans = plansResponse?.data ?? [];

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-copper-600" size={32} /></div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="font-serif text-2xl font-medium mb-2">Forward Planning</h2>
        <p className="text-muted-foreground">View upcoming regulatory plans from government agencies before formal consultations begin.</p>
      </div>
      {plans.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-white border border-sand-200 rounded-2xl">
          No forward plans published yet.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan: any) => (
            <Link
              key={plan.id}
              to={`/notices/forward-plan/${plan.slug || plan.id}`}
              className="group bg-white border border-sand-200 rounded-2xl p-6 hover:border-copper-500/30 hover:shadow-soft transition-all"
            >
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                {plan.agency_name || "Agency"}
              </div>
              <h3 className="font-serif text-lg font-medium mb-2 group-hover:text-primary transition-colors line-clamp-2">
                {plan.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                {plan.description?.replace(/<[^>]*>/g, '').substring(0, 150)}
              </p>
              <span className="text-sm font-semibold inline-flex items-center gap-1 text-copper-600">
                View details <ArrowRight size={14} />
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── FAQs Tab ───────────────────────────────────────────────────────────────
const FAQsTab = () => {
  const [open, setOpen] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const { data: faqsResponse, isLoading } = useFAQs(1);
  const faqsList = faqsResponse?.data ?? [];

  const filtered = search
    ? faqsList.filter((f) =>
        f.question?.toLowerCase().includes(search.toLowerCase()) ||
        f.answer?.toLowerCase().includes(search.toLowerCase())
      )
    : faqsList;

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-copper-600" size={32} /></div>;
  }

  return (
    <div>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-medium mb-2">Frequently Asked Questions</h2>
          <p className="text-muted-foreground">Common questions about the Notice & Comment platform.</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-sand-200 rounded-full px-4 h-10 max-w-sm w-full sm:w-auto">
          <HelpCircle size={14} className="text-muted-foreground shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search FAQs…"
            className="flex-1 bg-transparent outline-none text-sm"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-white border border-sand-200 rounded-2xl">
          {search ? "No FAQs match your search." : "No FAQs published yet."}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((f) => (
            <div key={f.id} className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
              <button
                onClick={() => setOpen(open === f.id ? null : f.id)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <span className="font-serif text-lg font-medium pr-4">{f.question}</span>
                <ChevronDown size={18} className={`shrink-0 transition-transform text-muted-foreground ${open === f.id ? "rotate-180" : ""}`} />
              </button>
              {open === f.id && (
                <div className="px-6 pb-6 text-muted-foreground leading-relaxed border-t border-sand-100 pt-4">
                  <div dangerouslySetInnerHTML={{ __html: f.answer || "" }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Contact Tab ────────────────────────────────────────────────────────────
const ContactTab = () => {
  const submitFeedback = useSubmitFeedback();
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.subject || !form.message) return;
    try {
      await submitFeedback.mutateAsync({ ...form, site: 2, type: "notice_contact" });
      setSubmitted(true);
    } catch { /* handled by mutation */ }
  };

  if (submitted) {
    return (
      <div className="bg-white border border-sand-200 rounded-2xl p-12 text-center">
        <div className="size-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
          <Send size={24} />
        </div>
        <h3 className="font-serif text-2xl font-medium mb-2">Message sent!</h3>
        <p className="text-muted-foreground mb-6">Thank you for contacting us. We will respond to your inquiry shortly.</p>
        <button onClick={() => { setSubmitted(false); setForm({ first_name: "", last_name: "", email: "", subject: "", message: "" }); }} className="text-sm text-copper-600 font-medium hover:underline">
          Send another message
        </button>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-8">
      <form onSubmit={handleSubmit} className="bg-white border border-sand-200 rounded-2xl p-8 space-y-5">
        <div>
          <h2 className="font-serif text-2xl font-medium mb-2">Get in Touch</h2>
          <p className="text-muted-foreground text-sm">Send us a message about the Notice & Comment platform.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">First Name <span className="text-copper-600">*</span></label>
            <input
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              required
              className="w-full border border-sand-200 rounded-lg px-4 py-2.5 text-sm focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20 outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Last Name <span className="text-copper-600">*</span></label>
            <input
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              required
              className="w-full border border-sand-200 rounded-lg px-4 py-2.5 text-sm focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20 outline-none"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Email <span className="text-copper-600">*</span></label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            className="w-full border border-sand-200 rounded-lg px-4 py-2.5 text-sm focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20 outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Subject <span className="text-copper-600">*</span></label>
          <input
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            required
            className="w-full border border-sand-200 rounded-lg px-4 py-2.5 text-sm focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20 outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Message <span className="text-copper-600">*</span></label>
          <textarea
            rows={5}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            required
            className="w-full border border-sand-200 rounded-lg px-4 py-2.5 text-sm resize-y focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20 outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={submitFeedback.isPending}
          className="inline-flex items-center gap-2 bg-gradient-to-b from-copper-500 to-copper-600 text-white rounded-xl px-6 py-3 font-medium hover:from-copper-600 transition-colors disabled:opacity-50"
        >
          {submitFeedback.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          Send Message
        </button>
      </form>

      <aside className="space-y-4">
        {[
          { icon: Mail, label: "Email", value: "support@eregistry.gov.zm" },
          { icon: Phone, label: "Phone", value: "+260 211 123 456" },
          { icon: MapPin, label: "Address", value: "Cabinet Office, Lusaka, Zambia" },
        ].map((c) => (
          <div key={c.label} className="bg-white border border-sand-200 rounded-2xl p-5 flex items-start gap-4">
            <div className="size-10 rounded-xl bg-copper-50 text-copper-600 flex items-center justify-center shrink-0">
              <c.icon size={18} />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</div>
              <div className="text-sm font-medium mt-1">{c.value}</div>
            </div>
          </div>
        ))}
      </aside>
    </div>
  );
};

// ─── Main NoticesHome with Tabs ─────────────────────────────────────────────
export const NoticesHome = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as TabKey | null;
  const activeTab: TabKey = TAB_CONFIG.some((t) => t.key === tabParam) ? tabParam! : "regulations";

  const setTab = (key: TabKey) => {
    setSearchParams(key === "regulations" ? {} : { tab: key });
  };

  return (
    <PublicLayout>
      <PageHeader
        eyebrow="Notice & Comment"
        title="Public consultation on proposed regulations"
        description="Review and submit feedback on regulations before they become law. Your voice matters."
        breadcrumbs={[{ label: "Home", to: "/" }, { label: "Notice & Comment" }]}
      />
      <section className="container-page py-8">
        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-1 bg-sand-100 rounded-xl p-1 mb-8">
          {TAB_CONFIG.map((tab) => {
            const active = tab.key === activeTab;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  active
                    ? "bg-white text-copper-600 shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-sand-200/50"
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === "regulations" && <RegulationsTab />}
        {activeTab === "forward-plans" && <ForwardPlansTab />}
        {activeTab === "faqs" && <FAQsTab />}
        {activeTab === "contact" && <ContactTab />}
      </section>
    </PublicLayout>
  );
};

export const RegulationDetail = () => {
  const { id } = useParams();
  const { data: regResponse, isLoading } = useRegulation(id);
  const reg = regResponse?.data;
  const submitComment = useSubmitComment(id || "0");
  const submitPosition = useSubmitPosition(id || "0");
  const likeComment = useLikeComment(id || "0");

  const [commentText, setCommentText] = useState("");
  const [commentName, setCommentName] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [positionVote, setPositionVote] = useState<string | null>(null);

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="container-page py-32 flex justify-center"><Loader2 className="animate-spin text-copper-600" size={32} /></div>
      </PublicLayout>
    );
  }

  if (!reg) {
    return (
      <PublicLayout>
        <div className="container-page py-32 text-center">
          <h1 className="font-serif text-3xl font-medium mb-3">Regulation not found</h1>
          <Link to="/notices" className="text-copper-600 hover:underline">Back to consultations</Link>
        </div>
      </PublicLayout>
    );
  }

  const closing = reg.closing_date ? new Date(reg.closing_date) : null;
  const daysLeft = closing ? Math.max(0, Math.ceil((closing.getTime() - Date.now()) / 86400000)) : 0;
  const isOpen = reg.consultation_stage === 1;
  const allComments = reg.comments ?? [];
  const topComments = allComments.filter((c) => !c.parent);
  const getReplies = (parentId: number) => allComments.filter((c) => c.parent === parentId);
  const positions = reg.positions ?? [];
  const supportCount = positions.filter((p) => p.position === "support").length;
  const opposeCount = positions.filter((p) => p.position === "oppose").length;
  const neutralCount = positions.filter((p) => p.position === "neutral").length;
  const totalPositions = positions.length || 1;
  const fieldData = reg.field_data ?? [];

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    await submitComment.mutateAsync({ comment: commentText, user: 0 });
    setCommentText("");
    setCommentName("");
  };

  const handleReply = async (parentId: number) => {
    if (!replyText.trim()) return;
    await submitComment.mutateAsync({ comment: replyText, user: 0, parent: parentId });
    setReplyText("");
    setReplyTo(null);
  };

  const handlePosition = async (pos: string) => {
    setPositionVote(pos);
    await submitPosition.mutateAsync({ position: pos });
  };

  const renderComment = (c: any, depth = 0) => {
    const replies = getReplies(c.id);
    return (
      <div key={c.id} className={depth > 0 ? "ml-6 mt-3 pl-4 border-l-2 border-sand-200" : ""}>
        <article className="bg-white border border-sand-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`size-9 rounded-full flex items-center justify-center text-xs font-semibold ${c.is_admin ? "bg-blue-50 text-blue-600" : "bg-copper-50 text-copper-600"}`}>
                {c.is_admin ? 'A' : 'C'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{c.is_admin ? 'Official Response' : `Citizen #${c.user}`}</span>
                  {c.is_admin && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">Admin</span>}
                  {c.position === 1 && <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full">Support</span>}
                  {c.position === 2 && <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full">Oppose</span>}
                </div>
                <div className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString()}</div>
              </div>
            </div>
            <button onClick={() => likeComment.mutate({ commentId: c.id })}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-copper-600 transition-colors">
              <ThumbsUp size={12} /> {c.upvote_count ?? 0}
            </button>
          </div>
          <p className="text-sm leading-relaxed mb-3">{c.comment}</p>
          {c.documents && (
            <div className="flex items-center gap-1.5 text-xs text-copper-600 mb-3">
              <Paperclip size={12} /> <a href={c.documents} className="hover:underline">Attachment</a>
            </div>
          )}
          <div className="flex items-center gap-3">
            {isOpen && depth === 0 && (
              <button onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}
                className="text-xs font-medium text-muted-foreground hover:text-copper-600 transition-colors">
                Reply
              </button>
            )}
          </div>
          {replyTo === c.id && (
            <div className="mt-3 flex gap-2">
              <input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Write a reply…"
                className="flex-1 border border-sand-200 rounded-lg px-3 py-2 text-sm" />
              <button onClick={() => handleReply(c.id)} disabled={submitComment.isPending}
                className="bg-copper-600 text-white rounded-lg px-3 py-2 text-sm font-medium hover:bg-copper-700 disabled:opacity-50">
                {submitComment.isPending ? <Loader2 size={14} className="animate-spin" /> : "Reply"}
              </button>
            </div>
          )}
        </article>
        {replies.map((r) => renderComment(r, depth + 1))}
      </div>
    );
  };

  return (
    <PublicLayout>
      <PageHeader
        eyebrow={reg.agency_name || 'Agency'}
        title={reg.title}
        breadcrumbs={[
          { label: "Home", to: "/" },
          { label: "Consultations", to: "/notices" },
          { label: reg.title },
        ]}
      />
      <section className="container-page py-10 grid lg:grid-cols-[1fr_320px] gap-10">
        <div className="space-y-8">
          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${isOpen ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-stone-100 text-stone-500 border border-stone-200"}`}>
              {isOpen ? "Open for Comments" : "Consultation Closed"}
            </span>
          </div>

          {/* Meta Information */}
          <div className="bg-white border border-sand-200 rounded-2xl p-6">
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2"><Building2 size={14} className="text-muted-foreground" /> <span className="text-muted-foreground">Agency:</span> <span className="font-medium">{reg.agency_name || 'N/A'}</span></div>
              <div className="flex items-center gap-2"><Factory size={14} className="text-muted-foreground" /> <span className="text-muted-foreground">Industry:</span> <span className="font-medium">{reg.industry_name || 'N/A'}</span></div>
              <div className="flex items-center gap-2"><Calendar size={14} className="text-muted-foreground" /> <span className="text-muted-foreground">Published:</span> <span className="font-medium">{reg.publish_date ? new Date(reg.publish_date).toLocaleDateString() : 'N/A'}</span></div>
              <div className="flex items-center gap-2"><Clock size={14} className="text-muted-foreground" /> <span className="text-muted-foreground">Closing:</span> <span className="font-medium">{reg.closing_date ? new Date(reg.closing_date).toLocaleDateString() : 'TBD'}</span></div>
              {reg.tags && <div className="flex items-center gap-2 col-span-2"><span className="text-muted-foreground">Tags:</span> <span className="font-medium">{reg.tags}</span></div>}
              {reg.keywords && <div className="flex items-center gap-2 col-span-2"><span className="text-muted-foreground">Keywords:</span> <span className="font-medium">{reg.keywords}</span></div>}
            </div>
          </div>

          {/* Description */}
          {reg.description && (
            <div className="bg-white border border-sand-200 rounded-2xl p-6">
              <h2 className="font-serif text-xl font-medium mb-4">Description</h2>
              <div className="text-muted-foreground leading-relaxed prose prose-stone max-w-none" dangerouslySetInnerHTML={{ __html: reg.description }} />
            </div>
          )}

          {/* Expected Outcome */}
          {reg.expected_outcome && (
            <div className="bg-white border border-sand-200 rounded-2xl p-6">
              <h2 className="font-serif text-xl font-medium mb-4">Expected Outcome</h2>
              <div className="text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: reg.expected_outcome }} />
            </div>
          )}

          {/* Specific Instructions */}
          {reg.specific_instructions && (
            <div className="bg-white border border-sand-200 rounded-2xl p-6">
              <h2 className="font-serif text-xl font-medium mb-4">Specific Instructions</h2>
              <div className="text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: reg.specific_instructions }} />
            </div>
          )}

          {/* Supporting Materials */}
          {reg.supporting_materials && (
            <div className="bg-white border border-sand-200 rounded-2xl p-6">
              <h2 className="font-serif text-xl font-medium mb-4">Supporting Materials</h2>
              <div className="text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: reg.supporting_materials }} />
            </div>
          )}

          {/* Attachments */}
          {reg.attachments && reg.attachments.length > 0 && (
            <div className="bg-white border border-sand-200 rounded-2xl p-6">
              <h2 className="font-serif text-xl font-medium mb-4">Attachments</h2>
              <div className="space-y-2">
                {reg.attachments.map((att) => (
                  <a key={att.id} href={att.filepath || '#'} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between border border-sand-200 rounded-xl p-4 hover:border-copper-500/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <Paperclip size={16} className="text-copper-600" />
                      <span className="text-sm font-medium">{att.name || 'Document'}</span>
                    </div>
                    <span className="text-xs text-copper-600 font-medium">Download</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Offline Consultations */}
          {reg.offline_consultations && (
            <div className="bg-white border border-sand-200 rounded-2xl p-6">
              <h2 className="font-serif text-xl font-medium mb-4">Offline Consultations</h2>
              <div className="text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: reg.offline_consultations }} />
            </div>
          )}

          {/* Custom Fields */}
          {fieldData.length > 0 && (
            <div className="bg-white border border-sand-200 rounded-2xl p-6">
              <h2 className="font-serif text-xl font-medium mb-4">Additional Information</h2>
              <div className="space-y-3">
                {fieldData.map((fd: any) => (
                  <div key={fd.id} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 text-sm">
                    <span className="text-muted-foreground font-medium shrink-0">{fd.fieldlabel}:</span>
                    <span>{fd.fielddata || 'N/A'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Position Voting */}
          {isOpen && (
            <div className="bg-white border border-sand-200 rounded-2xl p-6">
              <h2 className="font-serif text-xl font-medium mb-4">State Your Position</h2>
              <p className="text-sm text-muted-foreground mb-4">What is your position on this regulation?</p>
              <div className="flex flex-wrap gap-3 mb-4">
                {[
                  { value: "support", label: "Support", color: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" },
                  { value: "oppose", label: "Oppose", color: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" },
                  { value: "neutral", label: "Neutral", color: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" },
                ].map((opt) => (
                  <button key={opt.value} onClick={() => handlePosition(opt.value)} disabled={submitPosition.isPending}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border transition-colors ${positionVote === opt.value ? opt.color + " ring-2 ring-offset-1" : opt.color}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
              {positions.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{positions.length} vote{positions.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex h-2 rounded-full overflow-hidden bg-sand-100">
                    <div className="bg-emerald-500 transition-all" style={{ width: `${(supportCount / totalPositions) * 100}%` }} />
                    <div className="bg-red-500 transition-all" style={{ width: `${(opposeCount / totalPositions) * 100}%` }} />
                    <div className="bg-amber-400 transition-all" style={{ width: `${(neutralCount / totalPositions) * 100}%` }} />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-emerald-500" /> Support ({supportCount})</span>
                    <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-red-500" /> Oppose ({opposeCount})</span>
                    <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-amber-400" /> Neutral ({neutralCount})</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submit Comment */}
          {isOpen && (
            <div className="bg-white border border-sand-200 rounded-2xl p-6">
              <h2 className="font-serif text-xl font-medium mb-4">Submit Your Comment</h2>
              <form onSubmit={handleSubmitComment} className="space-y-4">
                <input value={commentName} onChange={(e) => setCommentName(e.target.value)} placeholder="Your name (optional)"
                  className="w-full border border-sand-200 rounded-lg px-4 py-2.5 text-sm focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20 outline-none" />
                <textarea rows={5} value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Share your thoughts on this regulation…" required
                  className="w-full border border-sand-200 rounded-lg px-4 py-2.5 text-sm resize-y focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20 outline-none" />
                <button type="submit" disabled={submitComment.isPending || !commentText.trim()}
                  className="inline-flex items-center gap-2 bg-gradient-to-b from-copper-500 to-copper-600 text-white rounded-xl px-6 py-2.5 font-medium hover:from-copper-600 transition-colors disabled:opacity-50">
                  {submitComment.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  Submit Comment
                </button>
              </form>
            </div>
          )}

          {/* Comments List */}
          <div>
            <h2 className="font-serif text-xl font-medium mb-4">Public Comments ({allComments.length})</h2>
            {allComments.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground bg-white border border-sand-200 rounded-2xl">
                No comments yet. Be the first to share your thoughts.
              </div>
            ) : (
              <div className="space-y-3">
                {topComments.map((c) => renderComment(c))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="bg-white border border-sand-200 rounded-2xl p-6 lg:sticky lg:top-24 space-y-5">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Status</div>
              <div className={`text-lg font-serif font-medium ${isOpen ? "text-emerald-700" : "text-stone-500"}`}>
                {isOpen ? 'Open for Comments' : 'Closed'}
              </div>
            </div>
            <div className="space-y-3 text-sm border-t border-sand-200 pt-4">
              <div className="flex justify-between"><span className="text-muted-foreground">Published</span><span className="font-medium">{reg.publish_date ? new Date(reg.publish_date).toLocaleDateString() : 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Closing</span><span className="font-medium">{reg.closing_date ? new Date(reg.closing_date).toLocaleDateString() : 'TBD'}</span></div>
              {isOpen && <div className="flex justify-between"><span className="text-muted-foreground">Days remaining</span><span className={`font-medium ${daysLeft <= 7 ? "text-red-600" : ""}`}>{daysLeft}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Comments</span><span className="font-medium">{allComments.length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Agency</span><span className="font-medium text-right max-w-[160px]">{reg.agency_name || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Industry</span><span className="font-medium text-right max-w-[160px]">{reg.industry_name || 'N/A'}</span></div>
            </div>
            {positions.length > 0 && (
              <div className="border-t border-sand-200 pt-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Positions</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-emerald-600">Support</span><span className="font-medium">{supportCount}</span></div>
                  <div className="flex justify-between"><span className="text-red-600">Oppose</span><span className="font-medium">{opposeCount}</span></div>
                  <div className="flex justify-between"><span className="text-amber-600">Neutral</span><span className="font-medium">{neutralCount}</span></div>
                </div>
              </div>
            )}
            <div className="border-t border-sand-200 pt-4">
              <Link to="/notices" className="text-sm font-medium text-copper-600 hover:text-copper-700 inline-flex items-center gap-1">
                <ChevronLeft size={14} /> Back to Consultations
              </Link>
            </div>
          </div>
        </aside>
      </section>
    </PublicLayout>
  );
};

export const ForwardPlanDetail = () => {
  const { slug } = useParams();
  const { data: planResponse, isLoading } = useForwardPlanBySlug(slug);
  const plan = planResponse?.data;

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="container-page py-32 flex justify-center"><Loader2 className="animate-spin text-copper-600" size={32} /></div>
      </PublicLayout>
    );
  }

  if (!plan) {
    return (
      <PublicLayout>
        <div className="container-page py-32 text-center">
          <h1 className="font-serif text-3xl font-medium mb-3">Forward plan not found</h1>
          <Link to="/notices?tab=forward-plans" className="text-copper-600 hover:underline">Back to forward plans</Link>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <PageHeader
        eyebrow={plan.agency_name || "Agency"}
        title={plan.title}
        breadcrumbs={[
          { label: "Home", to: "/" },
          { label: "Notice & Comment", to: "/notices" },
          { label: "Forward Plans", to: "/notices?tab=forward-plans" },
          { label: plan.title },
        ]}
      />
      <section className="container-page py-12 max-w-4xl">
        <div className="space-y-8">
          {plan.description && (
            <div className="bg-white border border-sand-200 rounded-2xl p-8">
              <h2 className="font-serif text-xl font-medium mb-4">Description</h2>
              <div className="text-muted-foreground leading-relaxed prose prose-stone max-w-none" dangerouslySetInnerHTML={{ __html: plan.description }} />
            </div>
          )}

          {plan.problem_addressed && (
            <div className="bg-white border border-sand-200 rounded-2xl p-8">
              <h2 className="font-serif text-xl font-medium mb-4">Problem Being Addressed</h2>
              <div className="text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: plan.problem_addressed }} />
            </div>
          )}

          {plan.public_consultation && (
            <div className="bg-white border border-sand-200 rounded-2xl p-8">
              <h2 className="font-serif text-xl font-medium mb-4">Public Consultation Approach</h2>
              <div className="text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: plan.public_consultation }} />
            </div>
          )}

          {plan.impact && (
            <div className="bg-white border border-sand-200 rounded-2xl p-8">
              <h2 className="font-serif text-xl font-medium mb-4">Expected Impact</h2>
              <div className="text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: plan.impact }} />
            </div>
          )}

          {plan.offline_office && (
            <div className="bg-white border border-sand-200 rounded-2xl p-8">
              <h2 className="font-serif text-xl font-medium mb-4">Contact Office</h2>
              <div className="text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: plan.offline_office }} />
            </div>
          )}

          {plan.related_links && (
            <div className="bg-white border border-sand-200 rounded-2xl p-8">
              <h2 className="font-serif text-xl font-medium mb-4">Related Links</h2>
              <div className="text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: plan.related_links }} />
            </div>
          )}

          {plan.attachments && plan.attachments.length > 0 && (
            <div className="bg-white border border-sand-200 rounded-2xl p-8">
              <h2 className="font-serif text-xl font-medium mb-4">Attachments</h2>
              <div className="space-y-2">
                {plan.attachments.map((att: any) => (
                  <a key={att.id} href={att.filepath || '#'} className="flex items-center justify-between border border-sand-200 rounded-xl p-4 hover:border-copper-500/40 transition-colors">
                    <span className="text-sm font-medium">{att.name || 'Document'}</span>
                    <span className="text-xs text-copper-600 font-medium">Download</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 pt-4">
            {plan.category_name && (
              <span className="text-xs px-3 py-1.5 rounded-full bg-sand-100 text-muted-foreground border border-sand-200">
                Category: <span className="font-medium text-foreground">{plan.category_name}</span>
              </span>
            )}
            {plan.agency_name && (
              <span className="text-xs px-3 py-1.5 rounded-full bg-copper-50 text-copper-700 border border-copper-200">
                {plan.agency_name}
              </span>
            )}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default NoticesHome;

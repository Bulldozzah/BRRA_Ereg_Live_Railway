import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Search, Filter, ArrowRight, X, ChevronLeft, ChevronRight, ChevronDown, Loader2 } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useLicenses } from "@/hooks/use-licenses";
import { useAgencies } from "@/hooks/use-agencies";
import { useLocations } from "@/hooks/use-locations";
import { useIndustries } from "@/hooks/use-industries";
import { useBusinessTypes } from "@/hooks/use-businesstypes";
import { AdvancedLicenseSearch, type AdvancedSearchValues } from "@/components/search/AdvancedLicenseSearch";

const PAGE_SIZE = 10;

const FilterDropdown = ({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: string; name: string }[];
  value: string;
  onChange: (value: string) => void;
}) => (
  <div className="relative flex-1 min-w-[180px]">
    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">{label}</label>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 pl-3 pr-9 rounded-xl border border-sand-200 bg-white text-sm font-medium appearance-none cursor-pointer hover:border-copper-500/40 focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20 outline-none transition-colors"
      >
        <option value="">All {label}s</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
    </div>
  </div>
);

export const BrowseLicenses = () => {
  const { slug, id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") || "");
  const [debouncedQ, setDebouncedQ] = useState(searchParams.get("q") || "");
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>("");
  const [selectedLocationId, setSelectedLocationId] = useState<string>(searchParams.get("location_id") || "");
  const [selectedIndustryId, setSelectedIndustryId] = useState<string>(searchParams.get("industry_id") || "");
  const [selectedBusinessTypeId, setSelectedBusinessTypeId] = useState<string>(searchParams.get("business_type_id") || id || "");
  const [selectedActivityIds, setSelectedActivityIds] = useState<string>(searchParams.get("activity_ids") || "");
  const [page, setPage] = useState(1);

  // Debounce search
  const [searchTimer, setSearchTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = (value: string) => {
    setQ(value);
    if (searchTimer) clearTimeout(searchTimer);
    setSearchTimer(setTimeout(() => { setDebouncedQ(value); setPage(1); }, 400));
  };

  // Fetch filter options
  // per_page must exceed the row counts of these reference tables (114 jurisdictions,
  // 109 business types) or the dropdowns silently drop options.
  const { data: agenciesData } = useAgencies({ per_page: 500, order_by: 'name', order_dir: 'ASC' });
  const { data: locationsData } = useLocations({ per_page: 500, order_by: 'name', order_dir: 'ASC' });
  const { data: industriesData } = useIndustries({ per_page: 500, order_by: 'name', order_dir: 'ASC' });
  const { data: businessTypesData } = useBusinessTypes({ per_page: 500, order_by: 'name', order_dir: 'ASC' });

  const agenciesList = agenciesData?.data ?? [];
  const locationsList = locationsData?.data ?? [];
  const industriesList = industriesData?.data ?? [];
  const businessTypesList = businessTypesData?.data ?? [];

  // Set initial agency filter from URL slug (once)
  const initialAgency = slug ? agenciesList.find((a) => a.slug === slug) : undefined;
  useEffect(() => {
    if (initialAgency && !selectedAgencyId) {
      setSelectedAgencyId(String(initialAgency.id));
    }
  }, [initialAgency]);

  // Keep filters in sync with the URL so searches arriving from elsewhere (the homepage
  // keyword search and advanced search) and browser back/forward navigation both show
  // the right results. The :id route param covers /browse/business-types/licenses/:id.
  const urlQ = searchParams.get("q") || "";
  const urlLocation = searchParams.get("location_id") || "";
  const urlIndustry = searchParams.get("industry_id") || "";
  const urlBusinessType = searchParams.get("business_type_id") || id || "";
  const urlActivities = searchParams.get("activity_ids") || "";
  useEffect(() => {
    setQ(urlQ);
    setDebouncedQ(urlQ);
    setSelectedLocationId(urlLocation);
    setSelectedIndustryId(urlIndustry);
    setSelectedBusinessTypeId(urlBusinessType);
    setSelectedActivityIds(urlActivities);
    setPage(1);
  }, [urlQ, urlLocation, urlIndustry, urlBusinessType, urlActivities]);

  // The advanced search writes to the query string; the effect above then syncs state,
  // keeping the URL the single source of truth so results stay shareable.
  const applyAdvancedSearch = (values: AdvancedSearchValues) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(values)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setSearchParams(next);
  };

  // Fetch licenses with server-side pagination
  const { data: licensesData, isLoading } = useLicenses({
    page,
    per_page: PAGE_SIZE,
    search: debouncedQ || undefined,
    agency_id: selectedAgencyId ? Number(selectedAgencyId) : undefined,
    location_id: selectedLocationId ? Number(selectedLocationId) : undefined,
    industry_id: selectedIndustryId ? Number(selectedIndustryId) : undefined,
    business_type_id: selectedBusinessTypeId ? Number(selectedBusinessTypeId) : undefined,
    activity_ids: selectedActivityIds || undefined,
  });

  const visible = licensesData?.data ?? [];
  const total = licensesData?.total ?? 0;
  const totalPages = licensesData?.total_pages ?? 1;
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;

  const clearAll = () => {
    setSelectedAgencyId("");
    setSelectedLocationId("");
    setSelectedIndustryId("");
    setSelectedBusinessTypeId("");
    setSelectedActivityIds("");
    setQ("");
    setDebouncedQ("");
    setPage(1);
    // Also drop the query string, or a later advanced search would resurrect it.
    if (Array.from(searchParams.keys()).length > 0) setSearchParams(new URLSearchParams());
  };

  const activeFilters = [
    ...(selectedAgencyId ? [{ group: "Agency", name: agenciesList.find((a) => String(a.id) === selectedAgencyId)?.name || selectedAgencyId, clear: () => { setSelectedAgencyId(""); setPage(1); } }] : []),
    ...(selectedLocationId ? [{ group: "Jurisdiction", name: locationsList.find((l) => String(l.id) === selectedLocationId)?.name || selectedLocationId, clear: () => { setSelectedLocationId(""); setPage(1); } }] : []),
    ...(selectedIndustryId ? [{ group: "Industry", name: industriesList.find((i) => String(i.id) === selectedIndustryId)?.name || selectedIndustryId, clear: () => { setSelectedIndustryId(""); setPage(1); } }] : []),
    ...(selectedBusinessTypeId ? [{ group: "Business Type", name: businessTypesList.find((b) => String(b.id) === selectedBusinessTypeId)?.name || selectedBusinessTypeId, clear: () => { setSelectedBusinessTypeId(""); setPage(1); } }] : []),
    ...(selectedActivityIds ? [{ group: "Activities", name: `${selectedActivityIds.split(",").filter(Boolean).length} selected`, clear: () => { setSelectedActivityIds(""); setPage(1); } }] : []),
  ];

  // pagination window
  const pageNumbers = (() => {
    const nums: (number | "…")[] = [];
    const max = totalPages;
    const c = currentPage;
    const push = (n: number | "…") => nums.push(n);
    push(1);
    if (c > 4) push("…");
    for (let i = Math.max(2, c - 1); i <= Math.min(max - 1, c + 1); i++) push(i);
    if (c < max - 3) push("…");
    if (max > 1) push(max);
    return nums;
  })();

  return (
    <PublicLayout>
      <PageHeader
        eyebrow="License Directory"
        title={initialAgency ? `Licences issued by ${initialAgency.name}` : "Filter Licenses"}
        description="Filter by agency, jurisdiction, business type or industry to find the licences relevant to your business."
        breadcrumbs={[{ label: "Home", to: "/" }, { label: "Browse" }, { label: "Licences" }]}
      />

      <section className="container-page py-12">
        <div>
          {/* Filter dropdowns */}
          <div className="bg-white border border-sand-200 rounded-2xl p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Filter size={14} className="text-copper-600" /> Filter Licenses
              </div>
              {activeFilters.length > 0 && (
                <button onClick={clearAll} className="text-xs text-copper-600 hover:underline">
                  Clear all filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <FilterDropdown
                label="Agency"
                options={agenciesList.map((a) => ({ id: String(a.id), name: a.name }))}
                value={selectedAgencyId}
                onChange={(v) => { setSelectedAgencyId(v); setPage(1); }}
              />
              <FilterDropdown
                label="Jurisdiction"
                options={locationsList.map((l) => ({ id: String(l.id), name: l.name }))}
                value={selectedLocationId}
                onChange={(v) => { setSelectedLocationId(v); setPage(1); }}
              />
              <FilterDropdown
                label="Business Type"
                options={businessTypesList.map((b) => ({ id: String(b.id), name: b.name }))}
                value={selectedBusinessTypeId}
                onChange={(v) => { setSelectedBusinessTypeId(v); setPage(1); }}
              />
              <FilterDropdown
                label="Industry"
                options={industriesList.map((i) => ({ id: String(i.id), name: i.name }))}
                value={selectedIndustryId}
                onChange={(v) => { setSelectedIndustryId(v); setPage(1); }}
              />
            </div>

            {/* Active filter chips */}
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-sand-100">
                {activeFilters.map((f, i) => (
                  <button
                    key={i}
                    onClick={f.clear}
                    className="inline-flex items-center gap-2 bg-copper-50 text-copper-700 border border-copper-500/30 rounded-full px-3 py-1.5 text-xs font-medium hover:bg-copper-100"
                  >
                    <span className="text-copper-600/70">{f.group}:</span> {f.name}
                    <X size={12} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cascading advanced search — Industry narrows Business Type, which narrows Activities */}
          <AdvancedLicenseSearch
            className="mb-4"
            values={{
              location_id: selectedLocationId,
              industry_id: selectedIndustryId,
              business_type_id: selectedBusinessTypeId,
              activity_ids: selectedActivityIds,
            }}
            onApply={applyAdvancedSearch}
          />

          {/* Search bar */}
          <div className="flex items-center gap-3 bg-white border border-sand-200 rounded-full px-4 h-12 mb-4 shadow-soft">
            <Search size={16} className="text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search licences by name or keyword…"
              className="flex-1 bg-transparent outline-none text-sm"
            />
            {isLoading && <Loader2 size={16} className="animate-spin text-muted-foreground" />}
          </div>

            {/* Table */}
            <div className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
              <div className="hidden md:grid grid-cols-[60px_1fr_280px_60px] gap-4 px-6 py-4 bg-sand-100/60 border-b border-sand-200 text-xs font-semibold uppercase tracking-wider text-earth-900">
                <div>#</div>
                <div>License Name</div>
                <div>Issuing Agency</div>
                <div></div>
              </div>

              {visible.length === 0 ? (
                <div className="px-6 py-16 text-center text-muted-foreground">
                  No licenses match your filters.
                </div>
              ) : (
                <ul className="divide-y divide-sand-100">
                  {visible.map((l: any, idx: number) => {
                    const rowNum = start + idx + 1;
                    return (
                      <li key={l.id}>
                        <Link
                          to={`/license/id/${l.id}`}
                          className="grid md:grid-cols-[60px_1fr_280px_60px] gap-4 px-6 py-5 items-start hover:bg-sand-50 transition-colors group"
                        >
                          <div className="font-serif text-lg text-copper-600 tabular-nums">{rowNum}</div>
                          <div>
                            <h3 className="font-serif text-base font-medium text-earth-900 group-hover:text-primary transition-colors">
                              {l.name}
                            </h3>
                            {l.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{l.description}</p>
                            )}
                          </div>
                          <div className="text-sm text-foreground/80 md:pt-1">{l.agency_name || l.agency_id}</div>
                          <div className="md:flex md:justify-end md:pt-1">
                            <ArrowRight size={16} className="text-muted-foreground group-hover:text-copper-600 group-hover:translate-x-1 transition-all" />
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Pagination + summary */}
            <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <p className="text-sm text-muted-foreground tabular-nums">
                Showing <span className="font-semibold text-foreground">{total === 0 ? 0 : start + 1}</span> to{" "}
                <span className="font-semibold text-foreground">{Math.min(start + PAGE_SIZE, total)}</span> of{" "}
                <span className="font-semibold text-foreground">{total}</span> Licenses
              </p>

              <nav className="flex items-center gap-1">
                <button
                  onClick={() => setPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3 h-9 rounded-lg border border-sand-200 bg-white text-sm font-medium hover:border-copper-500/40 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={14} /> Previous
                </button>
                {pageNumbers.map((n, i) =>
                  n === "…" ? (
                    <span key={i} className="px-2 text-muted-foreground">…</span>
                  ) : (
                    <button
                      key={i}
                      onClick={() => setPage(n)}
                      className={`min-w-9 h-9 px-3 rounded-lg text-sm font-medium tabular-nums transition-colors ${
                        n === currentPage
                          ? "bg-earth-900 text-sand-50 border border-earth-900"
                          : "bg-white border border-sand-200 hover:border-copper-500/40"
                      }`}
                    >
                      {n}
                    </button>
                  )
                )}
                <button
                  onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-3 h-9 rounded-lg border border-sand-200 bg-white text-sm font-medium hover:border-copper-500/40 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next <ChevronRight size={14} />
                </button>
              </nav>
            </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default BrowseLicenses;

import { Link, useParams } from "react-router-dom";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocations } from "@/hooks/use-locations";
import { useIndustries } from "@/hooks/use-industries";
import { useBusinessTypes } from "@/hooks/use-businesstypes";
import { useActivities } from "@/hooks/use-activities";
import { useAgencies } from "@/hooks/use-agencies";
import { useState } from "react";

interface ListPageProps {
  title: string;
  description: string;
  eyebrow: string;
  items: { id: string; name: string; count?: number; meta?: string }[];
  linkBase: string;
  linkFn?: (id: string) => string;
}

const ListPage = ({ title, description, eyebrow, items, linkBase, linkFn }: ListPageProps) => (
  <PublicLayout>
    <PageHeader
      eyebrow={eyebrow}
      title={title}
      description={description}
      breadcrumbs={[{ label: "Home", to: "/" }, { label: "Browse" }, { label: title }]}
    />
    <section className="container-page py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((it) => (
          <Link
            key={it.id}
            to={linkFn ? linkFn(it.id) : `${linkBase}/${it.id}`}
            className="group bg-white border border-sand-200 rounded-2xl p-6 hover:border-copper-500/40 hover:shadow-soft transition-all flex items-center justify-between gap-4"
          >
            <div>
              <div className="font-serif text-lg font-medium group-hover:text-primary transition-colors">{it.name}</div>
              {it.meta && <div className="text-xs text-muted-foreground mt-1">{it.meta}</div>}
              {it.count !== undefined && (
                <div className="text-xs text-muted-foreground mt-1 tabular-nums">{it.count} licences</div>
              )}
            </div>
            <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </Link>
        ))}
      </div>
    </section>
  </PublicLayout>
);

export const BrowseJurisdictions = () => {
  const { data } = useLocations({ per_page: 100, order_by: 'name', order_dir: 'ASC' });
  const items = (data?.data ?? []).map((l) => ({ id: String(l.id), name: l.name }));
  return (
    <ListPage
      eyebrow="By Location"
      title="Jurisdictions"
      description="Discover licences by province and district."
      items={items}
      linkBase="/browse/locations/license"
    />
  );
};

export const BrowseIndustries = () => {
  const { data } = useIndustries({ per_page: 100, order_by: 'name', order_dir: 'ASC' });
  const items = (data?.data ?? []).map((i) => ({ id: String(i.id), name: i.name, count: i.license_count }));
  return (
    <ListPage
      eyebrow="By Industry"
      title="Industries"
      description="Explore industries and the licences that govern them."
      items={items}
      linkFn={(id) => `/browse/licenses?industry_id=${id}`}
      linkBase="/browse/licenses"
    />
  );
};

export const BrowseBusinessTypes = () => {
  const { data, isLoading } = useBusinessTypes({ per_page: 200, order_by: 'name', order_dir: 'ASC' });
  const businessTypes = data?.data ?? [];
  
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  
  const totalPages = Math.ceil(businessTypes.length / itemsPerPage);
  const currentPage = Math.min(page, totalPages || 1);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTypes = businessTypes.slice(startIndex, endIndex);

  // Generate page numbers for pagination
  const pageNumbers = (() => {
    const nums: (number | "…")[] = [];
    const max = totalPages;
    const c = currentPage;
    const push = (n: number | "…") => nums.push(n);
    
    if (max <= 7) {
      for (let i = 1; i <= max; i++) push(i);
    } else {
      push(1);
      if (c > 4) push("…");
      for (let i = Math.max(2, c - 1); i <= Math.min(max - 1, c + 1); i++) push(i);
      if (c < max - 3) push("…");
      if (max > 1) push(max);
    }
    return nums;
  })();

  return (
    <PublicLayout>
      <PageHeader
        eyebrow="By Business Type"
        title="Business Types & Activities"
        description="Browse licences organized by business type categories."
        breadcrumbs={[{ label: "Home", to: "/" }, { label: "Browse" }, { label: "Business Types" }]}
      />
      <section className="container-page py-12">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-copper-600" />
          </div>
        ) : (
          <>
            <div className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
              {/* Table Header */}
              <div className="hidden lg:grid grid-cols-[2fr_2fr_2fr_1fr_1fr] gap-4 px-6 py-4 bg-sand-100/60 border-b border-sand-200 text-xs font-semibold uppercase tracking-wider text-earth-900">
                <div>Business Type</div>
                <div>Business Activities</div>
                <div>Industry</div>
                <div className="text-center">No. of Licenses</div>
                <div className="text-center">View Licenses</div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-sand-100">
                {paginatedTypes.map((bt) => (
                  <div key={bt.id} className="grid lg:grid-cols-[2fr_2fr_2fr_1fr_1fr] gap-4 px-6 py-5 hover:bg-sand-50 transition-colors">
                    {/* Column 1: Business Type Name */}
                    <div className="font-medium text-earth-900">
                      <div className="lg:hidden text-xs text-muted-foreground mb-1 uppercase tracking-wider">Business Type</div>
                      {bt.name}
                    </div>

                    {/* Column 2: Business Activities */}
                    <div>
                      <div className="lg:hidden text-xs text-muted-foreground mb-1 uppercase tracking-wider">Business Activities</div>
                      {bt.activities && bt.activities.length > 0 ? (
                        <ul className="text-sm text-muted-foreground space-y-0.5">
                          {bt.activities.slice(0, 3).map((activity) => (
                            <li key={activity.id} className="flex items-start gap-1.5">
                              <span className="text-copper-600 mt-1">•</span>
                              <span>{activity.name}</span>
                            </li>
                          ))}
                          {bt.activities.length > 3 && (
                            <li className="text-xs text-copper-600 italic">+{bt.activities.length - 3} more</li>
                          )}
                        </ul>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">None</span>
                      )}
                    </div>

                    {/* Column 3: Industries */}
                    <div>
                      <div className="lg:hidden text-xs text-muted-foreground mb-1 uppercase tracking-wider">Industry</div>
                      {bt.industries && bt.industries.length > 0 ? (
                        <ul className="text-sm text-muted-foreground space-y-0.5">
                          {bt.industries.slice(0, 3).map((industry) => (
                            <li key={industry.id} className="flex items-start gap-1.5">
                              <span className="text-copper-600 mt-1">•</span>
                              <span>{industry.name}</span>
                            </li>
                          ))}
                          {bt.industries.length > 3 && (
                            <li className="text-xs text-copper-600 italic">+{bt.industries.length - 3} more</li>
                          )}
                        </ul>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">None</span>
                      )}
                    </div>

                    {/* Column 4: License Count */}
                    <div className="text-center">
                      <div className="lg:hidden text-xs text-muted-foreground mb-1 uppercase tracking-wider">No. of Licenses</div>
                      <span className="inline-flex items-center justify-center min-w-[2.5rem] h-10 px-3 rounded-lg bg-sand-100 text-earth-900 font-semibold tabular-nums">
                        {bt.license_count || 0}
                      </span>
                    </div>

                    {/* Column 5: View Licenses Link */}
                    <div className="flex items-center justify-center">
                      <div className="lg:hidden text-xs text-muted-foreground mb-1 uppercase tracking-wider">View Licenses</div>
                      {bt.license_count > 0 ? (
                        <Link
                          to={`/browse/business-types/licenses/${bt.id}`}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-copper-600 hover:text-copper-900 transition-colors"
                        >
                          <span>View License(s)</span>
                          <ArrowRight size={14} />
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">—</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <p className="text-sm text-muted-foreground tabular-nums">
                  Showing <span className="font-semibold text-foreground">{startIndex + 1}</span> to{" "}
                  <span className="font-semibold text-foreground">{Math.min(endIndex, businessTypes.length)}</span> of{" "}
                  <span className="font-semibold text-foreground">{businessTypes.length}</span> Business Types
                </p>

                <nav className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 h-9 rounded-lg border border-sand-200 bg-white text-sm font-medium hover:border-copper-500/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                    className="flex items-center gap-1 px-3 h-9 rounded-lg border border-sand-200 bg-white text-sm font-medium hover:border-copper-500/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </section>
    </PublicLayout>
  );
};

export const BrowseActivities = () => {
  const { data } = useActivities({ per_page: 100, order_by: 'name', order_dir: 'ASC' });
  const items = (data?.data ?? []).map((a) => ({ id: String(a.id), name: a.name, count: a.license_count }));
  return (
    <ListPage
      eyebrow="By Activity"
      title="Business Activities"
      description="Economic activities that may require licensing."
      items={items}
      linkBase="/browse/licenses"
    />
  );
};

export const BrowseAgencies = () => {
  const { data } = useAgencies({ per_page: 100, order_by: 'name', order_dir: 'ASC' });
  const agenciesList = data?.data ?? [];
  return (
    <PublicLayout>
      <PageHeader
        eyebrow="Issuing Bodies"
        title="Government Agencies"
        description="Government bodies that issue and manage business licences."
        breadcrumbs={[{ label: "Home", to: "/" }, { label: "Agencies" }]}
      />
      <section className="container-page py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agenciesList.map((a) => (
            <Link
              key={a.id}
              to={`/browse/licenses-agency/${a.slug}`}
              className="group bg-white border border-sand-200 rounded-2xl p-6 hover:border-copper-500/40 hover:shadow-soft transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-serif text-lg font-medium group-hover:text-primary transition-colors">{a.name}</h3>
                  <div className="text-xs text-muted-foreground mt-1.5">{a.email}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
};

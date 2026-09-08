import { Link } from "react-router-dom";
import { ArrowRight, Loader2, Building2 } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useIndustries } from "@/hooks/use-industries";

const sectorCodes: Record<string, string> = {
  "Agriculture & Farming": "Ag",
  "Mining & Extraction": "Mn",
  "Trade & Commerce": "Tr",
  "Tourism & Hospitality": "To",
  "Manufacturing": "Mf",
  "Logistics & Transport": "Lt",
  "Health & Pharmaceuticals": "Hp",
  "Financial Services": "Fs",
  "Energy & Utilities": "En",
  "Telecommunications": "Tc",
};

export const ListIndustries = () => {
  const { data: industriesData, isLoading } = useIndustries({ per_page: 100, order_by: 'name', order_dir: 'ASC' });

  const industries = (industriesData?.data ?? []).map((ind) => ({
    id: ind.id,
    code: sectorCodes[ind.name] || ind.name.substring(0, 2).toUpperCase(),
    name: ind.name,
    description: ind.description || `Licenses related to ${ind.name}.`,
    license_count: ind.license_count ?? 0,
  }));

  return (
    <PublicLayout>
      <PageHeader
        title="All Industries & Sectors"
        description="Browse all business sectors and industries to find licenses relevant to your enterprise."
        breadcrumbs={[
          { label: "Home", to: "/" },
          { label: "Browse", to: "/browse/licenses" },
          { label: "Industries" },
        ]}
      />

      <section className="container-page py-16">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-copper-600" size={32} />
          </div>
        ) : industries.length === 0 ? (
          <div className="text-center py-20">
            <Building2 size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="font-serif text-2xl font-medium mb-2">No industries found</h3>
            <p className="text-muted-foreground">There are currently no industries available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {industries.map((industry) => (
              <Link
                key={industry.id}
                to={`/browse/licenses?industry_id=${industry.id}`}
                className="group bg-white p-6 rounded-2xl border border-sand-200 hover:border-copper-500/40 hover:shadow-card transition-all flex flex-col h-full"
              >
                <div className="size-12 rounded-xl bg-copper-50 flex items-center justify-center text-copper-600 font-serif text-xl mb-4 group-hover:bg-copper-500 group-hover:text-white transition-colors">
                  {industry.code}
                </div>
                <h3 className="font-serif text-lg font-medium mb-2">{industry.name}</h3>
                <p className="text-sm text-muted-foreground mb-6 flex-grow leading-relaxed line-clamp-3">
                  {industry.description}
                </p>
                <div className="flex items-center justify-between border-t border-sand-100 pt-4 mt-auto">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Active Licenses
                  </span>
                  <span className="text-sm font-medium tabular-nums">{industry.license_count}</span>
                </div>
                <div className="mt-3 flex items-center gap-1 text-sm font-medium text-copper-600 group-hover:text-copper-900 transition-colors">
                  View licenses <ArrowRight size={14} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </PublicLayout>
  );
};

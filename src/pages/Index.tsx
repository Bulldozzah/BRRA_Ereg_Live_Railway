import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, FileText, Building2, MapPin, Briefcase, MessageSquare, Calendar, Loader2, Layers, Search } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { AdvancedLicenseSearch } from "@/components/search/AdvancedLicenseSearch";
import { EregistryHero } from "@/components/ui/eregistry-hero";
import { HeroSlideshow } from "@/components/ui/HeroSlideshow";
import heroAgriculture from "@/assets/hero/agriculture.jpg";
import heroGlencore from "@/assets/hero/glencore-mine.jpg";
import heroGrainSilos from "@/assets/hero/grain-silos.jpg";
import heroKafueFlyover from "@/assets/hero/kafue-flyover.jpg";
import heroKazungula from "@/assets/hero/kazungula-bridge.jpg";
import heroLusakaCbd from "@/assets/hero/lusaka-cbd.jpg";
import heroLusakaFountain from "@/assets/hero/lusaka-fountain.jpg";
import heroSiomaElephants from "@/assets/hero/sioma-elephants.jpg";
import heroVictoriaFalls from "@/assets/hero/victoria-falls.jpg";
import heroZambeziElephant from "@/assets/hero/zambezi-elephant.jpg";
import heroCopperMining from "@/assets/hero/copper-mining.jpg";
import heroAgroExpo from "@/assets/hero/agro-expo.jpg";
import heroZambiaWildlife from "@/assets/hero/zambia-wildlife.jpg";

const heroImages = [
  heroVictoriaFalls,
  heroKazungula,
  heroLusakaCbd,
  heroAgriculture,
  heroGlencore,
  heroKafueFlyover,
  heroSiomaElephants,
  heroGrainSilos,
  heroZambeziElephant,
  heroLusakaFountain,
  heroCopperMining,
  heroAgroExpo,
  heroZambiaWildlife,
];
import { useIndustries } from "@/hooks/use-industries";
import { useRegulations } from "@/hooks/use-regulations";
import { useHomepageCounts } from "@/hooks/use-stats";
import { stripHtml } from "@/lib/strip-html";

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

const Index = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/browse/licenses?q=${encodeURIComponent(q)}` : "/browse/licenses");
  };
  const { data: industriesData } = useIndustries({ per_page: 4, order_by: 'name', order_dir: 'ASC' });
  const { data: regulationsData } = useRegulations({ per_page: 2, order_by: 'id', order_dir: 'DESC' });
  const { data: countsData } = useHomepageCounts();
  const counts = countsData?.data;
  const sectors = (industriesData?.data ?? []).map((ind) => ({
    code: sectorCodes[ind.name] || ind.name.substring(0, 2),
    title: ind.name,
    desc: ind.description || `Licences related to ${ind.name}.`,
    count: ind.license_count ?? 0,
  }));

  const consultations = (regulationsData?.data ?? []).map((r) => {
    const closing = r.closing_date ? new Date(r.closing_date) : null;
    const daysLeft = closing ? Math.max(0, Math.ceil((closing.getTime() - Date.now()) / 86400000)) : 0;
    return {
      id: String(r.id),
      agency: r.agency_name || 'Government Agency',
      title: r.title,
      desc: stripHtml(r.description),
      days: daysLeft,
    };
  });

  const quickLinks = [
    { label: "All Licenses", onClick: () => navigate("/browse/licenses"), icon: FileText, count: counts?.licenses },
    { label: "By Jurisdiction", onClick: () => navigate("/browse/jurisdictions"), icon: MapPin, count: counts?.jurisdictions },
    { label: "By Activity", onClick: () => navigate("/browse/listactivities"), icon: Briefcase, count: undefined as number | undefined },
    { label: "Business Types", onClick: () => navigate("/browse/business-types"), icon: Layers, count: counts?.business_types },
    { label: "Startup Procedures", onClick: () => navigate("/business-procedures"), icon: Building2, count: undefined as number | undefined },
  ];

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-primary-deep">
        {/* Background slideshow */}
        <HeroSlideshow images={heroImages} />
        <div className="container-page py-20 md:py-28 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-medium text-primary-foreground/90 backdrop-blur-sm mb-6">
              🇿🇲 Republic of Zambia — Business Licensing Portal
            </div>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-primary-foreground mb-6">
              Zambia's Business Licensing{" "}
              <span className="text-accent">Information Portal</span>
            </h1>
            <p className="text-base md:text-lg text-primary-foreground/80 leading-relaxed max-w-2xl mb-8">
              Businesses operating in Zambia are typically required to obtain one or more licenses and permits, depending on the activities of their enterprise. Use the tools below to find the licenses you need to start and run your business.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => navigate("/browse/licenses")}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-accent-foreground font-semibold hover:bg-accent/90 transition-colors shadow-card"
              >
                Find Licenses <ArrowRight size={16} />
              </button>
              <button
                onClick={() => navigate("/browse/listindustries")}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/10 border border-white/20 text-primary-foreground font-semibold hover:bg-white/15 transition-colors backdrop-blur-sm"
              >
                Browse Sectors
              </button>
            </div>
          </div>
        </div>

        {/* Decorative glow — right half */}
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-30 pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 70% 50%, hsl(var(--sky-500) / 0.35) 0%, transparent 60%)",
            }}
          />
        </div>
      </section>

      {/* Actor / Quick-Link Cards — overlap the hero */}
      <section className="container-page relative z-10 -mt-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.label}
                onClick={link.onClick}
                className="group bg-white rounded-2xl border border-sand-200 p-5 text-left hover:border-copper-500/40 hover:shadow-card transition-all flex flex-col gap-3"
              >
                <div className="size-10 rounded-lg bg-copper-50 text-copper-600 flex items-center justify-center group-hover:bg-copper-500 group-hover:text-white transition-colors">
                  <Icon size={18} />
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-serif text-sm font-semibold leading-tight">{link.label}</span>
                  {typeof link.count === "number" && (
                    <span className="text-lg font-bold tabular-nums text-muted-foreground">{link.count}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Keyword search — jumps straight to the license directory with results */}
        <form
          onSubmit={handleSearch}
          className="mt-4 flex items-center gap-3 bg-white border border-sand-200 rounded-full pl-4 pr-1.5 h-14 shadow-card"
        >
          <Search size={18} className="text-muted-foreground shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search licences by name or keyword…"
            aria-label="Search licences by name or keyword"
            className="flex-1 bg-transparent outline-none text-sm min-w-0"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 h-11 rounded-full bg-copper-500 text-white font-semibold text-sm hover:bg-copper-600 transition-colors shrink-0"
          >
            Search <ArrowRight size={14} />
          </button>
        </form>
      </section>


      {/* Sectors */}
      <section className="bg-sand-100 py-24 border-y border-sand-200">
        <div className="container-page">
          <div className="flex items-baseline justify-between mb-12 flex-wrap gap-4">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl font-medium tracking-tight">Browse by sector</h2>
              <p className="text-muted-foreground mt-2">Discover licenses applicable to your industry.</p>
            </div>
            <Link to="/browse/listindustries" className="text-sm font-semibold text-copper-600 hover:text-copper-900 transition-colors inline-flex items-center gap-1">
              View all industries <ArrowRight size={14} />
            </Link>
          </div>

          <AdvancedLicenseSearch />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {sectors.map((s) => (
              <Link
                key={s.code}
                to="/browse/licenses"
                className="group bg-white p-8 rounded-2xl border border-sand-200 hover:border-copper-500/40 hover:shadow-card transition-all flex flex-col h-full"
              >
                <div className="size-12 rounded-xl bg-copper-50 flex items-center justify-center text-copper-600 font-serif text-xl mb-6 group-hover:bg-copper-500 group-hover:text-white transition-colors">
                  {s.code}
                </div>
                <h3 className="font-serif text-xl font-medium mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground mb-8 flex-grow leading-relaxed">{s.desc}</p>
                <div className="flex items-center justify-between border-t border-sand-100 pt-4 mt-auto">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Licenses</span>
                  <span className="text-sm font-medium tabular-nums">{s.count}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Notice & Comment */}
      <section className="container-page py-24">
        <div className="grid lg:grid-cols-[1fr_2fr] gap-16">
          <div>
            <div className="inline-block px-3 py-1 bg-copper-50 text-copper-600 text-xs font-bold uppercase tracking-wider rounded-full mb-6">
              Public Consultation
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-medium tracking-tight text-balance mb-6">
              Shape the rules that govern your industry.
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Review proposed regulatory changes before they become law. Your feedback ensures our business
              environment remains fair and practical.
            </p>
            <Link to="/notices" className="inline-flex items-center gap-2 text-copper-600 font-semibold hover:text-copper-900 transition-colors">
              View all open consultations <ArrowRight size={16} />
            </Link>
          </div>

          <div className="flex flex-col gap-4">
            {consultations.map((c) => (
              <article key={c.id} className="bg-white border border-sand-200 p-6 md:p-8 rounded-2xl hover:border-copper-500/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{c.agency}</div>
                  <h3 className="font-serif text-xl font-medium mb-2">
                    <Link to={`/notices/regulation/${c.id}`} className="hover:text-primary transition-colors">{c.title}</Link>
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{c.desc}</p>
                </div>
                <div className="shrink-0 flex flex-col items-start md:items-end gap-3">
                  <span className="inline-flex items-center bg-sand-100 text-foreground text-xs font-medium px-3 py-1.5 rounded-full">
                    <Calendar size={12} className="mr-1.5" />
                    Closes in {c.days} days
                  </span>
                  <Link to={`/notices/regulation/${c.id}`} className="text-sm font-semibold hover:text-primary transition-colors inline-flex items-center gap-1">
                    Read & Comment <MessageSquare size={14} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

    </PublicLayout>
  );
};

export default Index;

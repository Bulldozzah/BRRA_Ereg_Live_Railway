import { Link } from "react-router-dom";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Mail, Phone, MapPin, Globe, ChevronRight } from "lucide-react";

const mostViewed = [
  { label: "Passport", to: "/browse/licenses?q=passport" },
  { label: "Green National Registration Card (NRC)", to: "/browse/licenses?q=nrc" },
  { label: "Business Levy Certificate", to: "/browse/licenses?q=business+levy" },
  { label: "Mining Licences", to: "/browse/licenses?q=mining" },
  { label: "Mineral Trading Permit", to: "/browse/licenses?q=mineral+trading" },
];

const recentUpdates = [
  { label: "Business Levy", to: "/browse/licenses?q=business+levy" },
  { label: "Micro or Small Business Enterprises — Vubwi", to: "/browse/licenses?q=vubwi" },
  { label: "Micro or Small Business Enterprises — Chama", to: "/browse/licenses?q=chama" },
  { label: "Micro or Small Business Enterprises — Sinda", to: "/browse/licenses?q=sinda" },
  { label: "Liquor Licensing Forms & Fees — All Provinces", to: "/browse/licenses?q=liquor" },
];

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-3">
    <h2 className="font-serif text-2xl md:text-3xl font-medium text-earth-900">{title}</h2>
    <div className="text-foreground/85 leading-relaxed space-y-3">{children}</div>
  </section>
);

const SidebarList = ({ title, items }: { title: string; items: { label: string; to: string }[] }) => (
  <div className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
    <div className="px-5 py-4 bg-copper-50/60 border-b border-sand-200">
      <h3 className="font-serif text-lg font-medium text-earth-900">{title}</h3>
    </div>
    <ul className="divide-y divide-sand-100">
      {items.map((it) => (
        <li key={it.label}>
          <Link
            to={it.to}
            className="flex items-center justify-between gap-3 px-5 py-3 text-sm hover:bg-sand-50 hover:text-primary transition-colors"
          >
            <span>{it.label}</span>
            <ChevronRight size={14} className="shrink-0 text-copper-600" />
          </Link>
        </li>
      ))}
      <li>
        <Link to="/browse/licenses" className="block px-5 py-3 text-sm font-semibold text-copper-600 hover:bg-sand-50">
          View More →
        </Link>
      </li>
    </ul>
  </div>
);

export const AboutPage = () => (
  <PublicLayout>
    <PageHeader
      eyebrow="About the Agency"
      title="Business Regulatory Review Agency"
      description="A specialized Government agency working to improve Zambia's regulatory environment for business development and growth."
      breadcrumbs={[{ label: "Home", to: "/" }, { label: "About" }]}
    />

    <section className="container-page py-12 grid lg:grid-cols-[1fr_340px] gap-10">
      <article className="space-y-10">
        <Section title="Background">
          <p>
            The Business Regulatory Review Agency (BRRA) was established in 2014 as part of the Private Sector
            Development Reform Programme (PSDRP) with the goal of reducing the cost of doing business and creating an
            environment conducive for business development and growth.
          </p>
          <p>
            The BRRA is a specialized Government agency established under the Business Regulatory Act No. 3 of 2014.
            It became operational in January 2016.
          </p>
        </Section>

        <Section title="Mandate">
          <p>
            The Business Regulatory Review Agency is mandated to administer the Business Regulatory Act. The Act has
            introduced a set of principles, procedures and minimum requirements for the introduction of regulatory
            measures.
          </p>
        </Section>

        <div className="grid md:grid-cols-2 gap-5">
          <div className="bg-gradient-to-br from-copper-50 to-sand-100 border border-copper-500/20 rounded-2xl p-6">
            <div className="text-xs font-bold uppercase tracking-wider text-copper-600 mb-3">Mission</div>
            <p className="font-serif text-lg italic text-earth-900 leading-relaxed">
              “To improve the regulatory environment, quality of regulations and lessen the regulatory burden for
              sustainable business development and growth.”
            </p>
          </div>
          <div className="bg-earth-900 text-sand-50 rounded-2xl p-6">
            <div className="text-xs font-bold uppercase tracking-wider text-copper-500 mb-3">Vision</div>
            <p className="font-serif text-lg italic leading-relaxed">
              “To be an indispensable ally of the Zambian businesses that fosters a world class business environment.”
            </p>
          </div>
        </div>

        <Section title="Objectives">
          <p>Arising from its functions, the objectives for which the BRRA was established are:</p>
          <ol className="space-y-3 mt-4">
            {[
              "To improve the quality of regulation by ensuring that businesses are regulated in a fair, equitable and transparent manner and for specific and legitimate reasons (better regulation);",
              "To ensure consistent regulation, curb red tape and abuse of regulatory powers and that businesses have a say in their regulation;",
              "To ensure that regulatory bodies discharge their functions effectively and efficiently and in a coordinated manner;",
              "To ease and reduce the cost of compliance with regulation and ultimately, foster a pro-business, transparent, simpler and cost effective regulatory regime;",
              "Give a voice to businesses in how they are regulated.",
            ].map((obj, i) => (
              <li key={i} className="flex gap-4 bg-white border border-sand-200 rounded-xl p-4">
                <span className="font-serif text-2xl font-medium text-copper-600 leading-none shrink-0 w-8">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-sm leading-relaxed">{obj}</span>
              </li>
            ))}
          </ol>
        </Section>

        <Section title="Contact the Agency">
          <div className="bg-white border border-sand-200 rounded-2xl p-6 grid sm:grid-cols-2 gap-5 not-prose">
            {[
              { icon: MapPin, label: "Address", value: "Plot No. 2251 Fairley Road, Ridgeway, Lusaka. P.O. Box 50593, Lusaka–Zambia" },
              { icon: Phone, label: "General Line", value: "+260 211 259165" },
              { icon: Phone, label: "Call Centre", value: "+260 211 259165" },
              { icon: Globe, label: "Website", value: "www.brra.org.zm" },
            ].map((c) => (
              <div key={c.label} className="flex items-start gap-3">
                <div className="size-9 rounded-lg bg-copper-50 text-copper-600 flex items-center justify-center shrink-0">
                  <c.icon size={16} />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</div>
                  <div className="text-sm font-medium mt-0.5">{c.value}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </article>

      <aside className="space-y-6 lg:sticky lg:top-28 self-start">
        <SidebarList title="Most Viewed" items={mostViewed} />
        <SidebarList title="Recent Updates" items={recentUpdates} />

        <div className="bg-sand-100 rounded-2xl p-6">
          <h3 className="font-serif text-lg font-medium mb-2">Newsletter</h3>
          <p className="text-sm text-muted-foreground mb-4">Sign up for updates from BRRA.</p>
          <form className="space-y-2.5">
            <input
              type="email"
              placeholder="your@email.com"
              className="w-full border border-sand-200 rounded-lg px-4 py-2.5 text-sm bg-white"
            />
            <button
              type="button"
              className="w-full bg-earth-900 text-sand-50 rounded-lg py-2.5 text-sm font-medium hover:bg-earth-800 transition-colors"
            >
              Subscribe
            </button>
          </form>
        </div>

        <div className="bg-white border border-sand-200 rounded-2xl p-6">
          <h3 className="font-serif text-lg font-medium mb-3">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/contactus" className="hover:text-primary flex items-center gap-2"><Mail size={14} className="text-copper-600" /> Contact Us</Link></li>
            <li><Link to="/faqs" className="hover:text-primary flex items-center gap-2"><ChevronRight size={14} className="text-copper-600" /> FAQs</Link></li>
            <li><Link to="/browse/agencies" className="hover:text-primary flex items-center gap-2"><ChevronRight size={14} className="text-copper-600" /> Useful Links</Link></li>
            <li><Link to="/policy/privacy" className="hover:text-primary flex items-center gap-2"><ChevronRight size={14} className="text-copper-600" /> Privacy Policy</Link></li>
          </ul>
        </div>
      </aside>
    </section>
  </PublicLayout>
);

export default AboutPage;

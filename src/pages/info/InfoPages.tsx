import { Link, useParams } from "react-router-dom";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useNewsList, useNewsArticle, useFAQs, usePageBySlug, useProcedures, useProcedureBySlug, useSubmitFeedback } from "@/hooks/use-content";
import { ChevronDown, Mail, Phone, MapPin, Loader2 } from "lucide-react";
import { useState } from "react";
import { stripHtml } from "@/lib/strip-html";

export const NewsList = () => {
  const { data: newsData, isLoading } = useNewsList({ per_page: 25 });
  const articles = newsData?.data ?? [];
  return (
    <PublicLayout>
      <PageHeader
        eyebrow="Newsroom"
        title="Latest news & announcements"
        description="Updates from the eRegistry team, partner agencies and policy makers."
        breadcrumbs={[{ label: "Home", to: "/" }, { label: "News" }]}
      />
      <section className="container-page py-12">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-copper-600" size={32} /></div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((n) => (
              <Link key={n.id} to={`/news/article/${n.id}`} className="group bg-white border border-sand-200 rounded-2xl overflow-hidden hover:border-copper-500/40 hover:shadow-soft transition-all">
                <div className="aspect-[16/9] bg-gradient-to-br from-copper-100 via-sand-100 to-copper-50 group-hover:scale-105 transition-transform duration-700" />
                <div className="p-6">
                  <div className="flex items-center gap-3 text-xs mb-3">
                    <span className="font-semibold uppercase tracking-wider text-copper-600">News</span>
                    <span className="text-muted-foreground tabular-nums">{new Date(n.created).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <h3 className="font-serif text-lg font-medium mb-2 group-hover:text-primary transition-colors">{n.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{stripHtml(n.article)?.substring(0, 150)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </PublicLayout>
  );
};

export const NewsArticle = () => {
  const { id } = useParams();
  const { data: articleResponse, isLoading } = useNewsArticle(id);
  const article = articleResponse?.data;

  if (isLoading) {
    return <PublicLayout><div className="container-page py-32 flex justify-center"><Loader2 className="animate-spin text-copper-600" size={32} /></div></PublicLayout>;
  }
  if (!article) {
    return <PublicLayout><div className="container-page py-32 text-center"><h1 className="font-serif text-3xl font-medium mb-3">Article not found</h1><Link to="/news/articles" className="text-copper-600 hover:underline">Back to news</Link></div></PublicLayout>;
  }

  return (
    <PublicLayout>
      <PageHeader
        eyebrow="News"
        title={article.title}
        breadcrumbs={[{ label: "Home", to: "/" }, { label: "News", to: "/news/articles" }, { label: article.title }]}
      />
      <article className="container-page py-12 max-w-3xl">
        <div className="text-sm text-muted-foreground mb-8">{new Date(article.created).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
        <div className="aspect-[16/8] bg-gradient-to-br from-copper-100 via-sand-100 to-copper-50 rounded-2xl mb-10" />
        <div className="prose prose-stone max-w-none text-foreground/90 leading-relaxed space-y-4" dangerouslySetInnerHTML={{ __html: article.article }} />
      </article>
    </PublicLayout>
  );
};

export const FAQsPage = ({ namespace = "eregistry" as "eregistry" | "notice" }) => {
  const [open, setOpen] = useState<number | null>(0);
  const site = namespace === "notice" ? 1 : 2;
  const { data: faqsResponse, isLoading } = useFAQs(site);
  const faqsList = faqsResponse?.data ?? [];

  return (
    <PublicLayout>
      <PageHeader
        eyebrow="Help Centre"
        title={namespace === "notice" ? "Notice & Comment FAQs" : "Frequently asked questions"}
        description="Common questions about using the eRegistry portal."
        breadcrumbs={[{ label: "Home", to: "/" }, { label: "FAQs" }]}
      />
      <section className="container-page py-12 grid lg:grid-cols-[1fr_320px] gap-10 max-w-5xl">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-copper-600" size={32} /></div>
        ) : (
          <div className="space-y-3">
            {faqsList.map((f) => (
              <div key={f.id} className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpen(open === f.id ? null : f.id)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="font-serif text-lg font-medium">{f.question}</span>
                  <ChevronDown size={18} className={`shrink-0 transition-transform ${open === f.id ? "rotate-180" : ""}`} />
                </button>
                {open === f.id && (
                  <div className="px-6 pb-6 text-muted-foreground leading-relaxed border-t border-sand-100 pt-4">{f.answer}</div>
                )}
              </div>
            ))}
          </div>
        )}

        <aside className="bg-sand-100 rounded-2xl p-6 h-fit">
          <h3 className="font-serif text-lg font-medium mb-2">Can't find your answer?</h3>
          <p className="text-sm text-muted-foreground mb-4">Submit your question and our team will respond.</p>
          <form className="space-y-3">
            <input className="w-full border border-sand-200 rounded-lg px-4 py-2.5 text-sm bg-white" placeholder="Email" />
            <textarea rows={3} className="w-full border border-sand-200 rounded-lg px-4 py-2.5 text-sm bg-white" placeholder="Your question…" />
            <button type="button" className="w-full bg-earth-900 text-sand-50 rounded-lg py-2.5 text-sm font-medium hover:bg-earth-800 transition-colors">
              Submit question
            </button>
          </form>
        </aside>
      </section>
    </PublicLayout>
  );
};

export const ContactPage = () => (
  <PublicLayout>
    <PageHeader
      eyebrow="Get in touch"
      title="Contact us"
      description="Reach out to the eRegistry support team or any of our partner agencies."
      breadcrumbs={[{ label: "Home", to: "/" }, { label: "Contact" }]}
    />
    <section className="container-page py-12 grid lg:grid-cols-[1fr_360px] gap-10 max-w-5xl">
      <form className="bg-white border border-sand-200 rounded-2xl p-8 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Full name</label>
            <input className="w-full border border-sand-200 rounded-lg px-4 py-2.5 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Email</label>
            <input type="email" className="w-full border border-sand-200 rounded-lg px-4 py-2.5 text-sm" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Subject</label>
          <input className="w-full border border-sand-200 rounded-lg px-4 py-2.5 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Message</label>
          <textarea rows={6} className="w-full border border-sand-200 rounded-lg px-4 py-2.5 text-sm" />
        </div>
        <button type="button" className="bg-gradient-to-b from-copper-500 to-copper-600 text-white rounded-xl px-6 py-3 font-medium hover:from-copper-600 transition-colors">
          Send message
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
    </section>
  </PublicLayout>
);

export const StaticPage = () => {
  const { slug, id } = useParams();
  const key = slug ?? id ?? "page";
  const { data: pageResponse, isLoading } = usePageBySlug(key);
  const page = pageResponse?.data;

  if (isLoading) {
    return <PublicLayout><div className="container-page py-32 flex justify-center"><Loader2 className="animate-spin text-copper-600" size={32} /></div></PublicLayout>;
  }

  const title = page?.page_title ?? key;
  return (
    <PublicLayout>
      <PageHeader title={title} breadcrumbs={[{ label: "Home", to: "/" }, { label: title }]} />
      <article className="container-page py-12 max-w-3xl prose prose-stone leading-relaxed text-foreground/90 space-y-4">
        {page?.page_content ? (
          <div dangerouslySetInnerHTML={{ __html: page.page_content }} />
        ) : (
          <p>This page has no content yet. It can be managed via the admin console under slug <code>{key}</code>.</p>
        )}
      </article>
    </PublicLayout>
  );
};

export const BusinessProcedures = () => {
  const { data: procResponse, isLoading } = useProcedures();
  const procedures = procResponse?.data?.procedures ?? [];
  const categories = procResponse?.data?.categories ?? [];

  return (
    <PublicLayout>
      <PageHeader
        eyebrow="Step-by-step"
        title="Business startup procedures"
        description="Guided procedures for common business setup pathways in Zambia."
        breadcrumbs={[{ label: "Home", to: "/" }, { label: "Procedures" }]}
      />
      <section className="container-page py-12">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-copper-600" size={32} /></div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {procedures.map((p, i) => (
              <Link key={p.id} to={`/business-procedures/details/${p.slug || p.id}`} className="group bg-white border border-sand-200 rounded-2xl p-6 hover:border-copper-500/40 hover:shadow-soft transition-all">
                <div className="text-xs text-muted-foreground mb-2">Procedure #{i + 1}</div>
                <h3 className="font-serif text-lg font-medium group-hover:text-primary transition-colors">{p.name}</h3>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{stripHtml(p.description)?.substring(0, 120)}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </PublicLayout>
  );
};

export const NotFoundPage = () => (
  <PublicLayout>
    <section className="container-page py-32 text-center">
      <div className="font-serif text-7xl font-medium text-copper-600 mb-4">404</div>
      <h1 className="font-serif text-3xl font-medium mb-3">Page not found</h1>
      <p className="text-muted-foreground mb-8">The page you're looking for doesn't exist or has moved.</p>
      <Link to="/" className="inline-block bg-earth-900 text-sand-50 rounded-full px-6 py-3 text-sm font-medium hover:bg-earth-800 transition-colors">
        Return home
      </Link>
    </section>
  </PublicLayout>
);

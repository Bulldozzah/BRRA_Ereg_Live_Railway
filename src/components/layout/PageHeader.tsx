import { Link } from "react-router-dom";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  breadcrumbs?: { label: string; to?: string }[];
}

export const PageHeader = ({ eyebrow, title, description, breadcrumbs }: PageHeaderProps) => (
  <section className="border-b border-blue-700 bg-blue-500">
    <div className="container-page py-12 md:py-16">
      {breadcrumbs && (
        <nav className="text-sm text-white/90 mb-6 flex items-center gap-2 flex-wrap">
          {breadcrumbs.map((b, i) => (
            <span key={i} className="flex items-center gap-2">
              {b.to ? (
                <Link to={b.to} className="hover:text-white transition-colors">{b.label}</Link>
              ) : (
                <span>{b.label}</span>
              )}
              {i < breadcrumbs.length - 1 && <span className="text-white/40">/</span>}
            </span>
          ))}
        </nav>
      )}
      {eyebrow && (
        <div className="inline-block px-3 py-1 bg-white text-blue-500 text-xs font-bold uppercase tracking-wider rounded-full mb-4">
          {eyebrow}
        </div>
      )}
      <h1 className="font-serif text-4xl md:text-5xl font-medium tracking-tight text-balance text-gold-500 mb-4">{title}</h1>
      {description && <p className="text-lg text-white/70 max-w-2xl leading-relaxed">{description}</p>}
    </div>
  </section>
);

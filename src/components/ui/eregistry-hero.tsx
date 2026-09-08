import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavigationItem {
  label: string;
  href?: string;
  hasDropdown?: boolean;
  onClick?: () => void;
}

interface SectorCard {
  image: string;
  category: string;
  title: string;
  onClick?: () => void;
}

interface QuickLink {
  label: string;
  onClick: () => void;
  icon?: React.ComponentType<any>;
  count?: number;
}

interface EregistryHeroProps {
  showHeader?: boolean;
  logo?: React.ReactNode;
  navigation?: NavigationItem[];
  ctaButton?: { label: string; onClick: () => void };
  eyebrow?: string;
  title: string;
  subtitle: string;
  primaryAction?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
  quickLinks?: QuickLink[];
  disclaimer?: string;
  socialProof?: { avatars: string[]; text: string };
  sectors?: SectorCard[];
  className?: string;
}

export function EregistryHero({
  showHeader = false,
  logo = "eRegistry",
  navigation = [],
  ctaButton,
  eyebrow,
  title,
  subtitle,
  primaryAction,
  secondaryAction,
  quickLinks = [],
  disclaimer,
  socialProof,
  sectors = [],
  className,
}: EregistryHeroProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden bg-gradient-to-b from-sand-50 via-sand-50 to-sand-100 border-b border-sand-200",
        className,
      )}
    >
      {/* Decorative copper glow */}
      <div className="pointer-events-none absolute -top-40 -right-32 size-[520px] rounded-full bg-copper-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 size-[420px] rounded-full bg-copper-50 blur-3xl" />

      {/* Header (optional — hidden by default since SiteHeader is global) */}
      {showHeader && (
      <header className="container-page relative z-10 flex items-center justify-between py-6">
        <div className="flex items-center gap-2 font-serif text-2xl font-medium tracking-tight">
          <span className="inline-block size-2.5 rounded-full bg-copper-500" />
          {logo}
        </div>

        <nav className="hidden md:flex items-center gap-8">
          {navigation.map((item, i) => (
            <button
              key={i}
              onClick={item.onClick}
              className="inline-flex items-center gap-1 text-sm text-foreground/80 hover:text-copper-600 transition-colors"
            >
              {item.label}
              {item.hasDropdown && <ChevronDown size={14} />}
            </button>
          ))}
        </nav>

        {ctaButton && (
          <button
            onClick={ctaButton.onClick}
            className="hidden md:inline-flex items-center gap-2 bg-foreground text-sand-50 px-5 py-2.5 rounded-full text-sm font-medium hover:bg-copper-900 transition-colors"
          >
            {ctaButton.label}
            <ArrowRight size={14} />
          </button>
        )}
      </header>
      )}

      {/* Hero content */}
      <div className="container-page relative z-10 pt-6 md:pt-10 pb-8 md:pb-12 text-center">
        {eyebrow && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-block px-3 py-1 bg-copper-50 text-copper-600 text-xs font-bold uppercase tracking-wider rounded-full mb-6"
          >
            {eyebrow}
          </motion.div>
        )}

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="font-serif text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight text-balance max-w-4xl mx-auto"
        >
          {title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
        >
          {subtitle}
        </motion.p>

        {(primaryAction || secondaryAction || quickLinks.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-10 flex flex-col items-center gap-4"
          >
            {/* Primary and Secondary Actions */}
            {(primaryAction || secondaryAction) && (
              <div className="flex flex-wrap items-center justify-center gap-3">
                {primaryAction && (
                  <button
                    onClick={primaryAction.onClick}
                    className="inline-flex items-center gap-2 bg-gradient-to-b from-copper-500 to-copper-600 text-white px-7 py-3.5 rounded-xl font-medium hover:from-copper-600 hover:to-copper-900 transition-colors shadow-card"
                  >
                    {primaryAction.label}
                    <ArrowRight size={16} />
                  </button>
                )}
                {secondaryAction && (
                  <button
                    onClick={secondaryAction.onClick}
                    className="inline-flex items-center gap-2 bg-white border border-sand-200 text-foreground px-7 py-3.5 rounded-xl font-medium hover:border-copper-500/40 hover:text-copper-600 transition-colors"
                  >
                    {secondaryAction.label}
                  </button>
                )}
              </div>
            )}

            {/* Quick Links */}
            {quickLinks.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-3">
                {quickLinks.map((link, idx) => {
                  const Icon = link.icon;
                  return (
                    <button
                      key={idx}
                      onClick={link.onClick}
                      className="inline-flex items-center gap-2 bg-white border border-sand-200 text-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:border-copper-500/40 hover:text-copper-600 transition-colors"
                    >
                      {Icon && <Icon size={14} />}
                      <span className="flex items-center gap-2">
                        {link.count !== undefined && (
                          <span className="font-bold text-copper-600 tabular-nums">{link.count}</span>
                        )}
                        {link.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {disclaimer && (
          <p className="mt-4 text-xs text-muted-foreground">{disclaimer}</p>
        )}

        {socialProof && (
          <div className="mt-10 flex items-center justify-center gap-4">
            <div className="flex -space-x-3">
              {socialProof.avatars.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  className="size-9 rounded-full border-2 border-sand-50 object-cover"
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">{socialProof.text}</span>
          </div>
        )}
      </div>

      {/* Scrolling sector cards */}
      {sectors.length > 0 && (
        <div className="relative pb-16 md:pb-20">
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-r from-sand-100 to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-l from-sand-100 to-transparent z-10" />

          <motion.div
            className="flex gap-6 w-max"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 40, ease: "linear", repeat: Infinity }}
          >
            {[...sectors, ...sectors].map((s, i) => (
              <button
                key={i}
                onClick={s.onClick}
                className="relative shrink-0 w-[400px] h-[250px] rounded-2xl overflow-hidden border border-sand-200 shadow-soft group text-left"
              >
                <img
                  src={s.image}
                  alt={s.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-earth-900/85 via-earth-900/20 to-transparent" />
                <div className="absolute inset-0 p-5 flex flex-col justify-end text-sand-50">
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-copper-100 mb-2">
                    {s.category}
                  </span>
                  <h3 className="font-serif text-xl md:text-2xl font-medium leading-snug">
                    {s.title}
                  </h3>
                </div>
              </button>
            ))}
          </motion.div>
        </div>
      )}
    </section>
  );
}

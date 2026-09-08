import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useLicense } from "@/hooks/use-licenses";
import { api } from "@/services/api";
import {
  Calendar, Clock, Coins, MapPin, Building2, FileDown, Printer,
  ExternalLink, ArrowLeft, CheckCircle2, Loader2, Mail, Phone,
  Globe, MapPinned, FileText, BookOpen
} from "lucide-react";

// Fixed field IDs from licensefixedfield table
const FIELD_IDS = {
  LICENSE_NO: 6,
  AGENCY: 20,
  PURPOSE: 3,
  JURISDICTION: 19,
  APPLICATION_FEE: 7,
  LICENSE_FEE: 8,
  MAX_PROCESSING_TIME: 9,
  GAZETTED_ON: 10,
  RELATED_WEBSITES: 11,
  VALIDITY: 12,
  ENACTMENT: 13,
  CONTACT_OFFICE: 15,
  RESOLUTION_CRITERIA: 16,
};

const stripHtml = (html: string) => {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
};

const InfoRow = ({ label, value, html }: { label: string; value?: string | null; html?: boolean }) => {
  if (!value) return null;
  return (
    <div className="py-3 border-b border-sand-100 last:border-0">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      {html ? (
        <div className="text-sm prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: value }} />
      ) : (
        <div className="text-sm">{value}</div>
      )}
    </div>
  );
};

const LicenseDetail = () => {
  const { id } = useParams();
  const { data: licResponse, isLoading } = useLicense(id);
  const lic = licResponse?.data as any;
  const [activeTab, setActiveTab] = useState<"details" | "legal" | "agency">("details");
  const containerRef = useRef<HTMLDivElement>(null);

  const trackClick = useCallback((url: string) => {
    if (!lic) return;
    const payload = { license_id: lic.id, license_name: lic.name, agency_id: lic.agency_id, url };
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
    try {
      navigator.sendBeacon(
        `${baseUrl}/link-clicks`,
        new Blob([JSON.stringify(payload)], { type: 'application/json' })
      );
    } catch (e) {
      api.post('/link-clicks', payload).catch(() => {});
    }
  }, [lic?.id, lic?.name, lic?.agency_id]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a[href]') as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.href;
      if (href && (href.startsWith('http://') || href.startsWith('https://')) && !href.includes(window.location.host)) {
        trackClick(href);
      }
    };
    el.addEventListener('click', handler);
    return () => el.removeEventListener('click', handler);
  }, [trackClick]);

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="container-page py-32 flex justify-center">
          <Loader2 className="animate-spin text-copper-600" size={32} />
        </div>
      </PublicLayout>
    );
  }

  if (!lic) {
    return (
      <PublicLayout>
        <div className="container-page py-32 text-center">
          <h1 className="font-serif text-3xl font-medium mb-3">License not found</h1>
          <Link to="/browse/licenses" className="text-copper-600 hover:underline">Back to all licences</Link>
        </div>
      </PublicLayout>
    );
  }

  // Build set of shown fixed field IDs
  const shownFieldIds = new Set((lic.fixed_fields ?? []).map((f: any) => f.id));
  const isFieldShown = (fieldId: number) => shownFieldIds.size === 0 || shownFieldIds.has(fieldId);

  const requirements = lic.requirements ?? [];
  const statutes = lic.statutes ?? [];
  const downloads = lic.downloads ?? [];
  const fieldData = lic.field_data ?? [];
  const agency = lic.agency;
  const agencyOffices = lic.agency_offices ?? [];

  const tabs = [
    { key: "details" as const, label: "Details", icon: FileText },
    { key: "legal" as const, label: "Legal Basis", icon: BookOpen },
    { key: "agency" as const, label: "Issuing Agency", icon: Building2 },
  ];

  return (
    <PublicLayout>
      <PageHeader
        eyebrow={lic.agency_name || "Licence"}
        title={lic.name}
        description={lic.description || ""}
        breadcrumbs={[
          { label: "Home", to: "/" },
          { label: "Licences", to: "/browse/licenses" },
          { label: lic.name },
        ]}
      />

      <section className="container-page py-12" ref={containerRef}>
        <Link to="/browse/licenses" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8">
          <ArrowLeft size={14} /> Back to all licences
        </Link>

        {/* Tab navigation */}
        <div className="flex gap-1 bg-sand-100 rounded-xl p-1 mb-8 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-white text-earth-900 shadow-sm"
                  : "text-muted-foreground hover:text-earth-900"
              }`}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-10">
          {/* Main content — tab panels */}
          <div>
            {/* ==================== TAB 1: DETAILS ==================== */}
            {activeTab === "details" && (
              <div className="space-y-8">
                {/* Quick facts bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {isFieldShown(FIELD_IDS.MAX_PROCESSING_TIME) && lic.max_processing_time && (
                    <div className="bg-white border border-sand-200 rounded-xl p-4">
                      <Clock size={16} className="text-copper-600 mb-2" />
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">Processing Time</div>
                      <div className="text-sm font-medium mt-1">{lic.max_processing_time}</div>
                    </div>
                  )}
                  {isFieldShown(FIELD_IDS.VALIDITY) && lic.validity && (
                    <div className="bg-white border border-sand-200 rounded-xl p-4">
                      <Calendar size={16} className="text-copper-600 mb-2" />
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">Validity</div>
                      <div className="text-sm font-medium mt-1">{lic.validity}</div>
                    </div>
                  )}
                  {isFieldShown(FIELD_IDS.JURISDICTION) && lic.location_name && (
                    <div className="bg-white border border-sand-200 rounded-xl p-4">
                      <MapPin size={16} className="text-copper-600 mb-2" />
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">Jurisdiction</div>
                      <div className="text-sm font-medium mt-1">{lic.location_name}</div>
                    </div>
                  )}
                  {isFieldShown(FIELD_IDS.AGENCY) && lic.agency_name && (
                    <div className="bg-white border border-sand-200 rounded-xl p-4">
                      <Building2 size={16} className="text-copper-600 mb-2" />
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">Issuing Agency</div>
                      <div className="text-sm font-medium mt-1">{lic.agency_name}</div>
                    </div>
                  )}
                </div>

                {/* Fee sections — full width to accommodate HTML tables / fee grids */}
                {isFieldShown(FIELD_IDS.APPLICATION_FEE) && lic.application_fee && (
                  <div className="bg-white border border-sand-200 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Coins size={16} className="text-copper-600" />
                      <h2 className="font-serif text-xl font-medium">Application Fee</h2>
                    </div>
                    <div className="text-sm prose prose-sm max-w-none [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-sand-200 [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-sand-200 [&_th]:px-3 [&_th]:py-2 [&_th]:bg-sand-50 [&_th]:text-left [&_th]:font-semibold [&_tr:nth-child(even)]:bg-sand-50/50" dangerouslySetInnerHTML={{ __html: lic.application_fee }} />
                  </div>
                )}
                {isFieldShown(FIELD_IDS.LICENSE_FEE) && lic.license_fee && (
                  <div className="bg-white border border-sand-200 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Coins size={16} className="text-copper-600" />
                      <h2 className="font-serif text-xl font-medium">License Fee</h2>
                    </div>
                    <div className="text-sm prose prose-sm max-w-none overflow-x-auto [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-sand-200 [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-sand-200 [&_th]:px-3 [&_th]:py-2 [&_th]:bg-sand-50 [&_th]:text-left [&_th]:font-semibold [&_tr:nth-child(even)]:bg-sand-50/50" dangerouslySetInnerHTML={{ __html: lic.license_fee }} />
                  </div>
                )}

                {/* License Number */}
                {isFieldShown(FIELD_IDS.LICENSE_NO) && lic.license_no && (
                  <InfoRow label="License Number" value={lic.license_no} />
                )}

                {/* Purpose */}
                {isFieldShown(FIELD_IDS.PURPOSE) && (lic.purpose || lic.description) && (
                  <div className="bg-white border border-sand-200 rounded-2xl p-6">
                    <h2 className="font-serif text-xl font-medium mb-3">Purpose</h2>
                    <div className="text-sm text-muted-foreground leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: lic.purpose || lic.description }} />
                  </div>
                )}

                {/* Requirements */}
                {requirements.length > 0 && (
                  <div className="bg-white border border-sand-200 rounded-2xl p-6">
                    <h2 className="font-serif text-xl font-medium mb-4">License Requirements</h2>
                    {lic.requirements_text ? (
                      <div className="text-sm prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: lic.requirements_text }} />
                    ) : (
                      <ul className="space-y-2.5">
                        {requirements.map((r: any) => (
                          <li key={r.id} className="flex items-start gap-3 text-sm">
                            <CheckCircle2 size={18} className="text-copper-600 shrink-0 mt-0.5" />
                            <span dangerouslySetInnerHTML={{ __html: r.description }} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Additional fixed fields */}
                <div className="bg-white border border-sand-200 rounded-2xl p-6 space-y-0">
                  {isFieldShown(FIELD_IDS.GAZETTED_ON) && lic.gazetted_on && (
                    <InfoRow label="Gazetted On" value={new Date(lic.gazetted_on).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })} />
                  )}
                  {isFieldShown(FIELD_IDS.ENACTMENT) && lic.enactment && (
                    <InfoRow label="Enactment" value={lic.enactment} />
                  )}
                  {isFieldShown(FIELD_IDS.CONTACT_OFFICE) && lic.contact_office && (
                    <InfoRow label="Contact Office" value={lic.contact_office} html />
                  )}
                  {isFieldShown(FIELD_IDS.RESOLUTION_CRITERIA) && lic.resolution_criteria && (
                    <InfoRow label="Resolution Criteria" value={lic.resolution_criteria} html />
                  )}
                  {isFieldShown(FIELD_IDS.RELATED_WEBSITES) && lic.related_websites && (
                    <InfoRow label="Related Websites" value={lic.related_websites} html />
                  )}
                </div>

                {/* Custom / dynamic fields */}
                {fieldData.length > 0 && (
                  <div className="bg-white border border-sand-200 rounded-2xl p-6">
                    <h2 className="font-serif text-xl font-medium mb-4">Additional Information</h2>
                    <div className="space-y-0">
                      {fieldData.map((fd: any) => (
                        <InfoRow key={fd.id} label={fd.fieldlabel} value={fd.fielddata} html />
                      ))}
                    </div>
                  </div>
                )}

                {/* Downloads */}
                {downloads.length > 0 && (
                  <div className="bg-white border border-sand-200 rounded-2xl p-6">
                    <h2 className="font-serif text-xl font-medium mb-4">Download Forms / Info</h2>
                    <div className="space-y-2">
                      {downloads.map((d: any) => (
                        <a key={d.id} href={d.filepath || "#"} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl border border-sand-200 p-4 hover:border-copper-500/40 transition-colors">
                          <div className="flex items-center gap-3">
                            <FileDown size={18} className="text-copper-600" />
                            <span className="text-sm font-medium">{d.name || "Download"}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">PDF</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ==================== TAB 2: LEGAL BASIS ==================== */}
            {activeTab === "legal" && (
              <div className="space-y-8">
                {/* Principle & subsidiary legislation */}
                {(lic.principle_legislation || lic.subsidiary_legislation) && (
                  <div className="bg-white border border-sand-200 rounded-2xl p-6">
                    <h2 className="font-serif text-xl font-medium mb-4">Legislation</h2>
                    <div className="space-y-3">
                      {lic.principle_legislation && (
                        <div className="flex items-start gap-3 p-4 border border-sand-200 rounded-xl">
                          <BookOpen size={18} className="text-copper-600 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Principle Legislation</div>
                            <div className="text-sm font-medium">{lic.principle_legislation}</div>
                          </div>
                        </div>
                      )}
                      {lic.subsidiary_legislation && (
                        <div className="flex items-start gap-3 p-4 border border-sand-200 rounded-xl">
                          <BookOpen size={18} className="text-copper-600 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Subsidiary Legislation</div>
                            <div className="text-sm font-medium">{lic.subsidiary_legislation}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Statutes */}
                {statutes.length > 0 ? (
                  <div className="bg-white border border-sand-200 rounded-2xl p-6">
                    <h2 className="font-serif text-xl font-medium mb-4">Statutes & Legal References</h2>
                    <div className="space-y-4">
                      {statutes.map((s: any) => (
                        <div key={s.id} className="border border-sand-200 rounded-xl p-5">
                          <h3 className="font-medium text-sm mb-3">{s.name}</h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                            {s.statute_no && (
                              <div>
                                <div className="text-xs text-muted-foreground">Statute No.</div>
                                <div className="font-medium">{s.statute_no}</div>
                              </div>
                            )}
                            {s.chapter && (
                              <div>
                                <div className="text-xs text-muted-foreground">Chapter</div>
                                <div className="font-medium">{s.chapter}</div>
                              </div>
                            )}
                            {s.section && (
                              <div>
                                <div className="text-xs text-muted-foreground">Section</div>
                                <div className="font-medium">{s.section}</div>
                              </div>
                            )}
                            {s.issued_by && (
                              <div>
                                <div className="text-xs text-muted-foreground">Issued By</div>
                                <div className="font-medium">{s.issued_by}</div>
                              </div>
                            )}
                            {s.issued_on && (
                              <div>
                                <div className="text-xs text-muted-foreground">Issued On</div>
                                <div className="font-medium">{new Date(s.issued_on).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</div>
                              </div>
                            )}
                            {s.valid_from && (
                              <div>
                                <div className="text-xs text-muted-foreground">Valid From</div>
                                <div className="font-medium">{new Date(s.valid_from).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</div>
                              </div>
                            )}
                            {s.valid_to && (
                              <div>
                                <div className="text-xs text-muted-foreground">Valid To</div>
                                <div className="font-medium">{new Date(s.valid_to).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-sand-200 rounded-2xl p-6 text-center text-muted-foreground">
                    No statutes or legal references recorded for this licence.
                  </div>
                )}

                {/* Requirements in legal tab as well */}
                {requirements.length > 0 && (
                  <div className="bg-white border border-sand-200 rounded-2xl p-6">
                    <h2 className="font-serif text-xl font-medium mb-4">License Requirements</h2>
                    <ul className="space-y-2.5">
                      {requirements.map((r: any) => (
                        <li key={r.id} className="flex items-start gap-3 text-sm">
                          <CheckCircle2 size={18} className="text-copper-600 shrink-0 mt-0.5" />
                          <span dangerouslySetInnerHTML={{ __html: r.description }} />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* ==================== TAB 3: ISSUING AGENCY ==================== */}
            {activeTab === "agency" && (
              <div className="space-y-8">
                {agency ? (
                  <>
                    {/* Head Office */}
                    <div className="bg-white border border-sand-200 rounded-2xl p-6">
                      <h2 className="font-serif text-xl font-medium mb-1">{agency.name}</h2>
                      {agency.acronym && <div className="text-sm text-muted-foreground mb-5">{agency.acronym}</div>}
                      {!agency.acronym && <div className="mb-5" />}

                      <div className="space-y-4">
                        {agency.telephone && (
                          <div className="flex items-center gap-3 text-sm">
                            <Phone size={16} className="text-copper-600 shrink-0" />
                            <span>{agency.telephone}</span>
                          </div>
                        )}
                        {agency.fax && (
                          <div className="flex items-center gap-3 text-sm">
                            <Phone size={16} className="text-muted-foreground shrink-0" />
                            <span>Fax: {agency.fax}</span>
                          </div>
                        )}
                        {agency.email && (
                          <div className="flex items-center gap-3 text-sm">
                            <Mail size={16} className="text-copper-600 shrink-0" />
                            <a href={`mailto:${agency.email}`} className="text-copper-600 hover:underline">{agency.email}</a>
                          </div>
                        )}
                        {agency.website && (
                          <div className="flex items-center gap-3 text-sm">
                            <Globe size={16} className="text-copper-600 shrink-0" />
                            <a href={agency.website} target="_blank" rel="noreferrer" className="text-copper-600 hover:underline">{agency.website}</a>
                          </div>
                        )}
                        {agency.address && (
                          <div className="flex items-start gap-3 text-sm">
                            <MapPinned size={16} className="text-copper-600 shrink-0 mt-0.5" />
                            <div dangerouslySetInnerHTML={{ __html: agency.address }} />
                          </div>
                        )}
                        {agency.postal_address && (
                          <div className="flex items-start gap-3 text-sm">
                            <Mail size={16} className="text-muted-foreground shrink-0 mt-0.5" />
                            <div><span className="text-muted-foreground">Postal:</span> {agency.postal_address}</div>
                          </div>
                        )}
                        {agency.hours && (
                          <div className="flex items-center gap-3 text-sm">
                            <Clock size={16} className="text-copper-600 shrink-0" />
                            <span>{agency.hours}</span>
                          </div>
                        )}
                        {agency.location_name && (
                          <div className="flex items-center gap-3 text-sm">
                            <MapPin size={16} className="text-copper-600 shrink-0" />
                            <span>{agency.location_name}</span>
                          </div>
                        )}
                      </div>

                      {/* Map link if coordinates available */}
                      {agency.latitude && agency.longitude && (
                        <a
                          href={`https://www.google.com/maps?q=${agency.latitude},${agency.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 mt-5 text-sm text-copper-600 hover:text-copper-900 font-medium"
                        >
                          <MapPinned size={14} /> View on Google Maps
                        </a>
                      )}
                    </div>

                    {/* Branch Offices */}
                    {agencyOffices.length > 0 && (
                      <div>
                        <h2 className="font-serif text-xl font-medium mb-4">Branch Offices</h2>
                        <div className="space-y-4">
                          {agencyOffices.map((office: any) => (
                            <div key={office.id} className="bg-white border border-sand-200 rounded-2xl p-5">
                              <h3 className="font-medium text-sm mb-3">{office.name}</h3>
                              <div className="space-y-2.5">
                                {office.tel && (
                                  <div className="flex items-center gap-3 text-sm">
                                    <Phone size={14} className="text-copper-600 shrink-0" />
                                    <span>{office.tel}</span>
                                  </div>
                                )}
                                {office.email && (
                                  <div className="flex items-center gap-3 text-sm">
                                    <Mail size={14} className="text-copper-600 shrink-0" />
                                    <a href={`mailto:${office.email}`} className="text-copper-600 hover:underline">{office.email}</a>
                                  </div>
                                )}
                                {office.website && (
                                  <div className="flex items-center gap-3 text-sm">
                                    <Globe size={14} className="text-copper-600 shrink-0" />
                                    <a href={office.website} target="_blank" rel="noreferrer" className="text-copper-600 hover:underline">{office.website}</a>
                                  </div>
                                )}
                                {office.address && (
                                  <div className="flex items-start gap-3 text-sm">
                                    <MapPinned size={14} className="text-copper-600 shrink-0 mt-0.5" />
                                    <span>{office.address}</span>
                                  </div>
                                )}
                                {office.postal_address && (
                                  <div className="flex items-center gap-3 text-sm">
                                    <Mail size={14} className="text-muted-foreground shrink-0" />
                                    <span>Postal: {office.postal_address}</span>
                                  </div>
                                )}
                                {office.hours && (
                                  <div className="flex items-center gap-3 text-sm">
                                    <Clock size={14} className="text-copper-600 shrink-0" />
                                    <span>{office.hours}</span>
                                  </div>
                                )}
                                {office.latitude && office.longitude && (
                                  <a
                                    href={`https://www.google.com/maps?q=${office.latitude},${office.longitude}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 text-xs text-copper-600 hover:text-copper-900 font-medium mt-1"
                                  >
                                    <MapPinned size={12} /> Directions
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-white border border-sand-200 rounded-2xl p-6 text-center text-muted-foreground">
                    No agency information available for this licence.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar — always visible */}
          <aside className="space-y-4">
            <div className="bg-white border border-sand-200 rounded-2xl p-6 lg:sticky lg:top-24">
              <div className="space-y-4 mb-6">
                {lic.agency_name && (
                  <div className="flex items-start gap-3">
                    <div className="size-9 rounded-lg bg-copper-50 text-copper-600 flex items-center justify-center shrink-0"><Building2 size={16} /></div>
                    <div className="min-w-0">
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">Issuing Agency</div>
                      <div className="text-sm font-medium">{lic.agency_name}</div>
                    </div>
                  </div>
                )}
                {lic.location_name && (
                  <div className="flex items-start gap-3">
                    <div className="size-9 rounded-lg bg-copper-50 text-copper-600 flex items-center justify-center shrink-0"><MapPin size={16} /></div>
                    <div className="min-w-0">
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">Jurisdiction</div>
                      <div className="text-sm font-medium">{lic.location_name}</div>
                    </div>
                  </div>
                )}
                {lic.validity && (
                  <div className="flex items-start gap-3">
                    <div className="size-9 rounded-lg bg-copper-50 text-copper-600 flex items-center justify-center shrink-0"><Calendar size={16} /></div>
                    <div className="min-w-0">
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">Validity</div>
                      <div className="text-sm font-medium">{lic.validity}</div>
                    </div>
                  </div>
                )}
                {lic.max_processing_time && (
                  <div className="flex items-start gap-3">
                    <div className="size-9 rounded-lg bg-copper-50 text-copper-600 flex items-center justify-center shrink-0"><Clock size={16} /></div>
                    <div className="min-w-0">
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">Processing Time</div>
                      <div className="text-sm font-medium">{lic.max_processing_time}</div>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div className="size-9 rounded-lg bg-copper-50 text-copper-600 flex items-center justify-center shrink-0"><ExternalLink size={16} /></div>
                  <div className="min-w-0">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Views</div>
                    <div className="text-sm font-medium tabular-nums">{lic.views ?? 0}</div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <button className="w-full bg-gradient-to-b from-copper-500 to-copper-600 text-white rounded-xl py-3 font-medium hover:from-copper-600 transition-colors">
                  Start Application
                </button>
                <Link
                  to={`/printlicense/id/${id}`}
                  className="w-full inline-flex items-center justify-center gap-2 border border-sand-200 rounded-xl py-3 font-medium text-sm hover:bg-sand-100 transition-colors"
                >
                  <Printer size={14} /> Print summary
                </Link>
              </div>
            </div>

            <div className="bg-sand-100 rounded-2xl p-6">
              <h3 className="font-serif text-lg font-medium mb-2">Need help?</h3>
              <p className="text-sm text-muted-foreground mb-4">Talk to a licensing officer about your application.</p>
              <Link to="/contactus" className="text-sm font-semibold text-copper-600 hover:text-copper-900">
                Contact support →
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </PublicLayout>
  );
};

export default LicenseDetail;

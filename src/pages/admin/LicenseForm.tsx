import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Check, Upload, X, Plus, Trash2,
  FileText, BookOpen, Settings2, ClipboardList, Download, Eye,
  Loader2, AlertCircle,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAgencies } from "@/hooks/use-agencies";
import { useLocations } from "@/hooks/use-locations";
import { useActivities } from "@/hooks/use-activities";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/services/api";
import type { ApiResponse } from "@/types/database";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface FixedField {
  id: number;
  fieldid: number;
  fieldlabel: string;
  showed: boolean | null;
  required: boolean | null;
}

interface CustomField {
  id: number;
  fieldlabel: string;
  fieldtype: number; // 1=text, 2=dropdown, 3=textarea
  fieldorder: number;
  choices: { id: number; choicename: string }[];
}

interface DownloadItem {
  name: string;
  issuing_body: string;
  file: File | null;
}

interface SubsidiaryItem {
  name: string;
  file: File | null;
}

type TabKey = "details" | "legal" | "additional" | "requirements" | "downloads" | "review";

const TAB_CONFIG: { key: TabKey; label: string; icon: typeof FileText }[] = [
  { key: "details", label: "License Details", icon: FileText },
  { key: "legal", label: "Legal Basis", icon: BookOpen },
  { key: "additional", label: "Additional Details", icon: Settings2 },
  { key: "requirements", label: "Requirements", icon: ClipboardList },
  { key: "downloads", label: "Downloads", icon: Download },
  { key: "review", label: "Review & Submit", icon: Eye },
];

// Fixed field IDs matching the database licensefixedfield.fieldid values
const FIELD_MAP: Record<number, string> = {
  1: "purpose",
  2: "description",
  3: "license_no",
  4: "application_fee",
  5: "license_fee",
  6: "max_processing_time",
  7: "gazetted_on",
  8: "related_websites",
  9: "validity",
  10: "enactment",
  11: "gazetting_ref",
  12: "contact_office",
  13: "resolution_criteria",
  14: "universal",
  15: "location_id",
  16: "activities",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const LicenseForm = () => {
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id: string }>();
  const isEditMode = !!editId;
  const { toast } = useToast();
  const [loadingLicense, setLoadingLicense] = useState(false);

  // Fetch reference data
  const { data: agencyData } = useAgencies({ per_page: 200, order_by: "name", order_dir: "ASC" });
  const { data: locationData } = useLocations({ per_page: 200, order_by: "name", order_dir: "ASC" });
  const { data: activityData } = useActivities({ per_page: 500, order_by: "name", order_dir: "ASC" });

  const agencies = useMemo(() => agencyData?.data ?? [], [agencyData]);
  const locations = useMemo(() => locationData?.data ?? [], [locationData]);
  const activities = useMemo(() => activityData?.data ?? [], [activityData]);

  // Fetch fixed fields & custom fields
  const [fixedFields, setFixedFields] = useState<FixedField[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);

  useEffect(() => {
    api.get<ApiResponse<FixedField[]>>("/license-admin/fixed-fields").then((r) => {
      if (r.data) setFixedFields(r.data);
    }).catch(() => {});
    api.get<ApiResponse<CustomField[]>>("/license-admin/custom-fields").then((r) => {
      if (r.data) setCustomFields(r.data);
    }).catch(() => {});
  }, []);

  // Load existing license data in edit mode
  useEffect(() => {
    if (!editId) return;
    setLoadingLicense(true);
    api.get<ApiResponse<any>>(`/license-admin/${editId}/show`).then((r) => {
      const d = r.data;
      if (!d) return;
      setName(d.name || "");
      setKeywords(d.keywords || "");
      setPurpose(d.purpose || "");
      setDescription(d.description || "");
      setLicenseNo(d.license_no || "");
      setApplicationFee(d.application_fee || "");
      setLicenseFee(d.license_fee || "");
      setMaxProcessingTime(d.max_processing_time || "");
      setGazettedOn(d.gazetted_on ? d.gazetted_on.substring(0, 10) : "");
      setRelatedWebsites(d.related_websites || "");
      setValidity(d.validity || "");
      setEnactment(d.enactment ? d.enactment.substring(0, 10) : "");
      setGazettingRef(d.gazetting_ref || "");
      setContactOffice(d.contact_office || "");
      setResolutionCriteria(d.resolution_criteria || "");
      setUniversal(!!d.universal);
      setLocationId(d.location_id ? String(d.location_id) : "");
      setAgencyId(d.agency_id ? String(d.agency_id) : "");
      setPrincipleLegislation(d.principle_legislation || "");
      setSubsidiaryLegislation(d.subsidiary_legislation || "");
      setRequirements(d.requirements || "");
      if (d.activities && d.activities.length > 0) {
        setSelectedActivities(d.activities.map((a: any) => a.id));
      }
      if (d.field_data && d.field_data.length > 0) {
        const cfv: Record<string, string> = {};
        d.field_data.forEach((fd: any) => { cfv[String(fd.field_id)] = fd.fielddata || ""; });
        setCustomFieldValues(cfv);
      }
    }).catch((err) => {
      toast({ title: "Error", description: "Failed to load license data: " + err.message, variant: "destructive" });
    }).finally(() => setLoadingLicense(false));
  }, [editId]);

  // Tab state
  const [activeTab, setActiveTab] = useState<TabKey>("details");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Tab 1: License Details
  const [name, setName] = useState("");
  const [keywords, setKeywords] = useState("");
  const [purpose, setPurpose] = useState("");
  const [description, setDescription] = useState("");
  const [licenseNo, setLicenseNo] = useState("");
  const [applicationFee, setApplicationFee] = useState("");
  const [licenseFee, setLicenseFee] = useState("");
  const [maxProcessingTime, setMaxProcessingTime] = useState("");
  const [gazettedOn, setGazettedOn] = useState("");
  const [relatedWebsites, setRelatedWebsites] = useState("");
  const [validity, setValidity] = useState("");
  const [enactment, setEnactment] = useState("");
  const [gazettingRef, setGazettingRef] = useState("");
  const [contactOffice, setContactOffice] = useState("");
  const [resolutionCriteria, setResolutionCriteria] = useState("");
  const [universal, setUniversal] = useState(false);
  const [locationId, setLocationId] = useState("");
  const [agencyId, setAgencyId] = useState("");
  const [selectedActivities, setSelectedActivities] = useState<number[]>([]);
  const [activitySearch, setActivitySearch] = useState("");

  // Tab 2: Legal Basis
  const [principleLegislation, setPrincipleLegislation] = useState("");
  const [principleLegislationFile, setPrincipleLegislationFile] = useState<File | null>(null);
  const [subsidiaryLegislation, setSubsidiaryLegislation] = useState("");
  const [subsidiaryItems, setSubsidiaryItems] = useState<SubsidiaryItem[]>([]);

  // Tab 3: Custom field values
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});

  // Tab 4: Requirements
  const [requirements, setRequirements] = useState("");

  // Tab 5: Downloads
  const [downloadItems, setDownloadItems] = useState<DownloadItem[]>([]);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  const isFieldShown = useCallback(
    (fieldId: number) => {
      if (fixedFields.length === 0) return true;
      const ff = fixedFields.find((f) => f.fieldid === fieldId);
      return ff ? !!ff.showed : false;
    },
    [fixedFields]
  );

  const isFieldRequired = useCallback(
    (fieldId: number) => {
      const ff = fixedFields.find((f) => f.fieldid === fieldId);
      return ff ? !!ff.required : false;
    },
    [fixedFields]
  );

  const hasCustomFields = customFields.length > 0;

  const visibleTabs = useMemo(() => {
    return TAB_CONFIG.filter((t) => {
      if (t.key === "additional") return hasCustomFields;
      return true;
    });
  }, [hasCustomFields]);

  const tabIndex = visibleTabs.findIndex((t) => t.key === activeTab);

  const goNext = () => {
    if (tabIndex < visibleTabs.length - 1) {
      setActiveTab(visibleTabs[tabIndex + 1].key);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  const goPrev = () => {
    if (tabIndex > 0) {
      setActiveTab(visibleTabs[tabIndex - 1].key);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const toggleActivity = (id: number) =>
    setSelectedActivities((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------
  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "License name is required";
    if (!keywords.trim()) e.keywords = "Keywords are required";
    if (!agencyId) e.agency_id = "Agency is required";
    if (!contactOffice.trim() && isFieldShown(12)) e.contact_office = "Contact office is required";
    if (isFieldRequired(1) && !purpose.trim()) e.purpose = "Purpose is required";
    if (isFieldRequired(2) && !description.trim()) e.description = "Description is required";
    return e;
  };

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------
  const handleSubmit = async (asDraft: boolean) => {
    if (!asDraft) {
      const validationErrors = validate();
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        setActiveTab("details");
        toast({ title: "Validation Error", description: "Please fill in all required fields.", variant: "destructive" });
        return;
      }
    }
    setErrors({});
    setSubmitting(true);

    try {
      const fd = new FormData();
      fd.append("save_as_draft", asDraft ? "true" : "false");
      fd.append("name", name);
      fd.append("keywords", keywords);
      fd.append("purpose", purpose);
      fd.append("description", description);
      fd.append("license_no", licenseNo);
      fd.append("application_fee", applicationFee);
      fd.append("license_fee", licenseFee);
      fd.append("max_processing_time", maxProcessingTime);
      fd.append("gazetted_on", gazettedOn);
      fd.append("related_websites", relatedWebsites);
      fd.append("validity", validity);
      fd.append("enactment", enactment);
      fd.append("gazetting_ref", gazettingRef);
      fd.append("contact_office", contactOffice);
      fd.append("resolution_criteria", resolutionCriteria);
      fd.append("universal", universal ? "true" : "false");
      if (locationId) fd.append("location_id", locationId);
      if (agencyId) fd.append("agency_id", agencyId);
      if (selectedActivities.length > 0) fd.append("activity_ids", JSON.stringify(selectedActivities));
      fd.append("principle_legislation", principleLegislation);
      fd.append("subsidiary_legislation", subsidiaryLegislation);
      fd.append("requirements", requirements);

      if (principleLegislationFile) {
        fd.append("principle_legislation_file", principleLegislationFile);
      }

      // Custom fields
      if (Object.keys(customFieldValues).length > 0) {
        fd.append("custom_fields", JSON.stringify(customFieldValues));
      }

      // Subsidiary items
      if (subsidiaryItems.length > 0) {
        fd.append("subsidiary_items", JSON.stringify(subsidiaryItems.map((s) => ({ name: s.name }))));
        subsidiaryItems.forEach((s) => {
          if (s.file) fd.append("subsidiary_files", s.file);
        });
      }

      // Download items
      if (downloadItems.length > 0) {
        fd.append("download_items", JSON.stringify(downloadItems.map((d) => ({ name: d.name, issuing_body: d.issuing_body }))));
        downloadItems.forEach((d) => {
          if (d.file) fd.append("download_files", d.file);
        });
      }

      if (isEditMode) {
        await api.putFormData(`/license-admin/${editId}/update`, fd);
      } else {
        await api.postFormData("/license-admin/create", fd);
      }

      toast({
        title: isEditMode
          ? "License updated successfully"
          : asDraft ? "License saved as draft" : "License submitted for approval",
        description: `"${name}" has been ${isEditMode ? "updated" : asDraft ? "saved" : "submitted"} successfully.`,
      });
      navigate(isEditMode ? `/login-admin/managelicenses/${editId}/show` : "/login-admin/managelicenses");
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to save license", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Reusable field components
  // ---------------------------------------------------------------------------
  const inputCls = (field?: string) =>
    `w-full h-11 px-3 rounded-lg border bg-white outline-none text-sm transition-colors ${
      field && errors[field]
        ? "border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/20"
        : "border-sand-200 focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20"
    }`;

  const textareaCls = (field?: string) =>
    `w-full px-3 py-2.5 rounded-lg border bg-white outline-none text-sm resize-y min-h-[100px] transition-colors ${
      field && errors[field]
        ? "border-destructive focus:ring-2 focus:ring-destructive/20"
        : "border-sand-200 focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20"
    }`;

  const Label = ({ text, required, fieldId }: { text: string; required?: boolean; fieldId?: number }) => (
    <label className="text-sm font-medium block mb-1.5">
      {text}
      {(required || (fieldId !== undefined && isFieldRequired(fieldId))) && (
        <span className="text-copper-600 ml-0.5">*</span>
      )}
    </label>
  );

  const FieldError = ({ field }: { field: string }) =>
    errors[field] ? <p className="text-xs text-destructive mt-1.5 flex items-center gap-1"><AlertCircle size={12} />{errors[field]}</p> : null;

  // ---------------------------------------------------------------------------
  // TAB 1: License Details
  // ---------------------------------------------------------------------------
  const renderDetailsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-serif text-lg font-medium mb-1">Core Information</h3>
        <p className="text-sm text-muted-foreground mb-5">Basic details about the license.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Name - always shown */}
        <div className="md:col-span-2">
          <Label text="License Name" required />
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Liquor License" className={inputCls("name")} />
          <FieldError field="name" />
        </div>

        {/* Keywords - always shown */}
        <div className="md:col-span-2">
          <Label text="Keywords" required />
          <textarea value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="Search keywords, comma separated" rows={2} className={textareaCls("keywords")} />
          <FieldError field="keywords" />
        </div>

        {/* Agency - always shown */}
        <div>
          <Label text="Issuing Agency" required />
          <select value={agencyId} onChange={(e) => setAgencyId(e.target.value)} className={inputCls("agency_id")}>
            <option value="">Select agency…</option>
            {agencies.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <FieldError field="agency_id" />
        </div>

        {/* Jurisdiction */}
        {isFieldShown(15) && (
          <div>
            <Label text="Jurisdiction" fieldId={15} />
            <select value={locationId} onChange={(e) => setLocationId(e.target.value)} className={inputCls()}>
              <option value="">Select jurisdiction…</option>
              {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
        )}

        {/* Purpose */}
        {isFieldShown(1) && (
          <div className="md:col-span-2">
            <Label text="Purpose" fieldId={1} />
            <textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} rows={3} className={textareaCls("purpose")} placeholder="What is the purpose of this license?" />
            <FieldError field="purpose" />
          </div>
        )}

        {/* Description */}
        {isFieldShown(2) && (
          <div className="md:col-span-2">
            <Label text="Description" fieldId={2} />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={textareaCls("description")} placeholder="Full description of the license" />
            <FieldError field="description" />
          </div>
        )}

        {/* License No */}
        {isFieldShown(3) && (
          <div>
            <Label text="License No" fieldId={3} />
            <input value={licenseNo} onChange={(e) => setLicenseNo(e.target.value)} className={inputCls()} placeholder="Official license number" />
          </div>
        )}

        {/* Application Fee */}
        {isFieldShown(4) && (
          <div>
            <Label text="Application Fee" fieldId={4} />
            <input value={applicationFee} onChange={(e) => setApplicationFee(e.target.value)} className={inputCls()} placeholder="e.g. ZMW 500" />
          </div>
        )}

        {/* License Fee */}
        {isFieldShown(5) && (
          <div className="md:col-span-2">
            <Label text="License Fee" fieldId={5} />
            <textarea value={licenseFee} onChange={(e) => setLicenseFee(e.target.value)} rows={2} className={textareaCls()} placeholder="License fee details (can include HTML tables)" />
          </div>
        )}

        {/* Max Processing Time */}
        {isFieldShown(6) && (
          <div>
            <Label text="Max Processing Time" fieldId={6} />
            <input value={maxProcessingTime} onChange={(e) => setMaxProcessingTime(e.target.value)} className={inputCls()} placeholder="e.g. 14 working days" />
          </div>
        )}

        {/* Gazetted On */}
        {isFieldShown(7) && (
          <div>
            <Label text="Gazetted On" fieldId={7} />
            <input type="date" value={gazettedOn} onChange={(e) => setGazettedOn(e.target.value)} className={inputCls()} />
          </div>
        )}

        {/* Related Websites */}
        {isFieldShown(8) && (
          <div className="md:col-span-2">
            <Label text="Related Websites" fieldId={8} />
            <textarea value={relatedWebsites} onChange={(e) => setRelatedWebsites(e.target.value)} rows={2} className={textareaCls()} placeholder="Related URLs" />
          </div>
        )}

        {/* Validity */}
        {isFieldShown(9) && (
          <div>
            <Label text="Validity" fieldId={9} />
            <input value={validity} onChange={(e) => setValidity(e.target.value)} className={inputCls()} placeholder="e.g. 1 year" />
          </div>
        )}

        {/* Enactment */}
        {isFieldShown(10) && (
          <div>
            <Label text="Enactment" fieldId={10} />
            <input type="date" value={enactment} onChange={(e) => setEnactment(e.target.value)} className={inputCls()} />
          </div>
        )}

        {/* Gazetting Ref */}
        {isFieldShown(11) && (
          <div>
            <Label text="Gazetting Reference" fieldId={11} />
            <input value={gazettingRef} onChange={(e) => setGazettingRef(e.target.value)} className={inputCls()} placeholder="Gazette reference number" />
          </div>
        )}

        {/* Contact Office */}
        {isFieldShown(12) && (
          <div className="md:col-span-2">
            <Label text="Contact Office" required />
            <textarea value={contactOffice} onChange={(e) => setContactOffice(e.target.value)} rows={3} className={textareaCls("contact_office")} placeholder="Contact office details" />
            <FieldError field="contact_office" />
          </div>
        )}

        {/* Resolution Criteria */}
        {isFieldShown(13) && (
          <div className="md:col-span-2">
            <Label text="Resolution Criteria" fieldId={13} />
            <textarea value={resolutionCriteria} onChange={(e) => setResolutionCriteria(e.target.value)} rows={3} className={textareaCls()} placeholder="Dispute resolution criteria" />
          </div>
        )}

        {/* Universal */}
        {isFieldShown(14) && (
          <div className="md:col-span-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <span className={`size-5 rounded border flex items-center justify-center shrink-0 transition-colors ${universal ? "bg-copper-500 border-copper-500 text-white" : "border-sand-300 bg-white"}`}>
                {universal && <Check size={14} />}
              </span>
              <input type="checkbox" checked={universal} onChange={(e) => setUniversal(e.target.checked)} className="sr-only" />
              <span className="text-sm font-medium">Universal (applicable across all jurisdictions)</span>
            </label>
          </div>
        )}
      </div>

      {/* Activities multi-select */}
      {isFieldShown(16) && (
        <div className="border-t border-sand-200 pt-6">
          <Label text="Business Activities" fieldId={16} />
          <p className="text-sm text-muted-foreground mb-3">Select which business activities this license applies to.</p>
          <input
            value={activitySearch}
            onChange={(e) => setActivitySearch(e.target.value)}
            placeholder="Search activities…"
            className="w-full h-10 px-3 rounded-lg border border-sand-200 bg-white outline-none text-sm mb-3 focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20"
          />
          <div className="border border-sand-200 rounded-xl max-h-56 overflow-y-auto divide-y divide-sand-100">
            {activities
              .filter((a) => a.name.toLowerCase().includes(activitySearch.toLowerCase()))
              .map((a) => {
                const checked = selectedActivities.includes(a.id);
                return (
                  <label key={a.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-sand-50 cursor-pointer text-sm">
                    <span className={`size-4 rounded border flex items-center justify-center shrink-0 ${checked ? "bg-copper-500 border-copper-500 text-white" : "border-sand-300 bg-white"}`}>
                      {checked && <Check size={12} />}
                    </span>
                    <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggleActivity(a.id)} />
                    <span className="truncate">{a.name}</span>
                  </label>
                );
              })}
          </div>
          {selectedActivities.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedActivities.map((id) => {
                const a = activities.find((x) => x.id === id);
                return a ? (
                  <span key={id} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-copper-50 text-copper-700 border border-copper-500/20">
                    {a.name}
                    <button type="button" onClick={() => toggleActivity(id)} className="hover:text-copper-900"><X size={12} /></button>
                  </span>
                ) : null;
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ---------------------------------------------------------------------------
  // TAB 2: Legal Basis
  // ---------------------------------------------------------------------------
  const renderLegalTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-serif text-lg font-medium mb-1">Legal Basis</h3>
        <p className="text-sm text-muted-foreground mb-5">Legislation and statutory references.</p>
      </div>

      <div>
        <Label text="Principle Legislation" required />
        <input value={principleLegislation} onChange={(e) => setPrincipleLegislation(e.target.value)} className={inputCls()} placeholder="e.g. Liquor Licensing Act, Cap 167" />
      </div>

      <div>
        <Label text="Principle Legislation Attachment" />
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 px-4 h-11 rounded-lg border border-sand-200 bg-white hover:bg-sand-50 cursor-pointer text-sm font-medium transition-colors">
            <Upload size={14} /> Choose File
            <input type="file" accept=".pdf,.doc,.docx" className="sr-only" onChange={(e) => setPrincipleLegislationFile(e.target.files?.[0] ?? null)} />
          </label>
          <span className="text-sm text-muted-foreground truncate">{principleLegislationFile ? principleLegislationFile.name : "No file selected"}</span>
          {principleLegislationFile && (
            <button type="button" onClick={() => setPrincipleLegislationFile(null)} className="p-1.5 rounded-md hover:bg-sand-100 text-muted-foreground"><X size={14} /></button>
          )}
        </div>
      </div>

      <div>
        <Label text="Subsidiary Legislation" />
        <textarea value={subsidiaryLegislation} onChange={(e) => setSubsidiaryLegislation(e.target.value)} rows={3} className={textareaCls()} placeholder="Subsidiary legislation text" />
      </div>

      {/* Subsidiary legislation attachments - dynamic collection */}
      <div className="border-t border-sand-200 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-medium">Subsidiary Legislation Attachments</h4>
            <p className="text-xs text-muted-foreground">Upload supporting statutory documents.</p>
          </div>
          <button
            type="button"
            onClick={() => setSubsidiaryItems((s) => [...s, { name: "", file: null }])}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-copper-600 hover:text-copper-900"
          >
            <Plus size={14} /> Add Attachment
          </button>
        </div>
        {subsidiaryItems.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No subsidiary legislation attachments added.</p>
        ) : (
          <div className="space-y-4">
            {subsidiaryItems.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-4 border border-sand-200 rounded-xl bg-sand-50/50">
                <div className="flex-1 space-y-3">
                  <input
                    value={item.name}
                    onChange={(e) => {
                      const next = [...subsidiaryItems];
                      next[i] = { ...next[i], name: e.target.value };
                      setSubsidiaryItems(next);
                    }}
                    placeholder="Name of subsidiary legislation"
                    className={inputCls()}
                  />
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-2 px-3 h-9 rounded-lg border border-sand-200 bg-white hover:bg-sand-50 cursor-pointer text-xs font-medium">
                      <Upload size={12} /> Upload
                      <input type="file" accept=".pdf,.doc,.docx" className="sr-only" onChange={(e) => {
                        const next = [...subsidiaryItems];
                        next[i] = { ...next[i], file: e.target.files?.[0] ?? null };
                        setSubsidiaryItems(next);
                      }} />
                    </label>
                    <span className="text-xs text-muted-foreground truncate">{item.file ? item.file.name : "No file"}</span>
                  </div>
                </div>
                <button type="button" onClick={() => setSubsidiaryItems((s) => s.filter((_, idx) => idx !== i))} className="p-2 rounded-lg hover:bg-sand-200 text-muted-foreground mt-1">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // TAB 3: Additional Details (Custom Fields)
  // ---------------------------------------------------------------------------
  const renderAdditionalTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-serif text-lg font-medium mb-1">Additional Details</h3>
        <p className="text-sm text-muted-foreground mb-5">Agency-specific custom fields.</p>
      </div>
      {customFields.map((cf) => (
        <div key={cf.id}>
          <Label text={cf.fieldlabel} />
          {cf.fieldtype === 1 && (
            <input
              value={customFieldValues[cf.id] || ""}
              onChange={(e) => setCustomFieldValues((v) => ({ ...v, [cf.id]: e.target.value }))}
              className={inputCls()}
              placeholder={cf.fieldlabel}
            />
          )}
          {cf.fieldtype === 2 && (
            <select
              value={customFieldValues[cf.id] || ""}
              onChange={(e) => setCustomFieldValues((v) => ({ ...v, [cf.id]: e.target.value }))}
              className={inputCls()}
            >
              <option value="">Select…</option>
              {cf.choices.map((c) => <option key={c.id} value={c.choicename}>{c.choicename}</option>)}
            </select>
          )}
          {cf.fieldtype === 3 && (
            <textarea
              value={customFieldValues[cf.id] || ""}
              onChange={(e) => setCustomFieldValues((v) => ({ ...v, [cf.id]: e.target.value }))}
              rows={3}
              className={textareaCls()}
              placeholder={cf.fieldlabel}
            />
          )}
        </div>
      ))}
      {customFields.length === 0 && (
        <p className="text-sm text-muted-foreground italic">No custom fields configured.</p>
      )}
    </div>
  );

  // ---------------------------------------------------------------------------
  // TAB 4: Requirements
  // ---------------------------------------------------------------------------
  const renderRequirementsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-serif text-lg font-medium mb-1">Requirements</h3>
        <p className="text-sm text-muted-foreground mb-5">List of requirements for this license.</p>
      </div>
      <div>
        <Label text="Requirements" />
        <textarea
          value={requirements}
          onChange={(e) => setRequirements(e.target.value)}
          rows={12}
          className={textareaCls()}
          placeholder="Enter the requirements for obtaining this license. You can use HTML formatting."
        />
        <p className="text-xs text-muted-foreground mt-2">Supports HTML formatting for lists, tables, etc.</p>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // TAB 5: Downloads
  // ---------------------------------------------------------------------------
  const renderDownloadsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-serif text-lg font-medium mb-1">Download Forms / Info</h3>
        <p className="text-sm text-muted-foreground mb-5">Attach downloadable forms and information documents.</p>
      </div>

      <button
        type="button"
        onClick={() => setDownloadItems((d) => [...d, { name: "", issuing_body: "", file: null }])}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-copper-600 hover:text-copper-900"
      >
        <Plus size={14} /> Add Download
      </button>

      {downloadItems.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">No downloads added yet.</p>
      ) : (
        <div className="space-y-4">
          {downloadItems.map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-4 border border-sand-200 rounded-xl bg-sand-50/50">
              <div className="flex-1 space-y-3">
                <div className="grid md:grid-cols-2 gap-3">
                  <input
                    value={item.name}
                    onChange={(e) => {
                      const next = [...downloadItems];
                      next[i] = { ...next[i], name: e.target.value };
                      setDownloadItems(next);
                    }}
                    placeholder="Document name"
                    className={inputCls()}
                  />
                  <input
                    value={item.issuing_body}
                    onChange={(e) => {
                      const next = [...downloadItems];
                      next[i] = { ...next[i], issuing_body: e.target.value };
                      setDownloadItems(next);
                    }}
                    placeholder="Issuing body"
                    className={inputCls()}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 px-3 h-9 rounded-lg border border-sand-200 bg-white hover:bg-sand-50 cursor-pointer text-xs font-medium">
                    <Upload size={12} /> Upload File
                    <input type="file" className="sr-only" onChange={(e) => {
                      const next = [...downloadItems];
                      next[i] = { ...next[i], file: e.target.files?.[0] ?? null };
                      setDownloadItems(next);
                    }} />
                  </label>
                  <span className="text-xs text-muted-foreground truncate">{item.file ? item.file.name : "No file"}</span>
                </div>
              </div>
              <button type="button" onClick={() => setDownloadItems((d) => d.filter((_, idx) => idx !== i))} className="p-2 rounded-lg hover:bg-sand-200 text-muted-foreground mt-1">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ---------------------------------------------------------------------------
  // TAB 6: Review & Submit
  // ---------------------------------------------------------------------------
  const selectedAgency = agencies.find((a) => a.id === Number(agencyId));
  const selectedLocation = locations.find((l) => l.id === Number(locationId));

  const renderReviewTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-serif text-lg font-medium mb-1">Review & Submit</h3>
        <p className="text-sm text-muted-foreground mb-5">Review the information below before submitting.</p>
      </div>

      {/* License Details */}
      <div className="border border-sand-200 rounded-xl overflow-hidden">
        <div className="bg-sand-50 px-5 py-3 border-b border-sand-200">
          <h4 className="text-sm font-medium flex items-center gap-2"><FileText size={14} /> License Details</h4>
        </div>
        <div className="p-5 space-y-3 text-sm">
          <ReviewRow label="License Name" value={name} />
          <ReviewRow label="Keywords" value={keywords} />
          <ReviewRow label="Agency" value={selectedAgency?.name} />
          {locationId && <ReviewRow label="Jurisdiction" value={selectedLocation?.name} />}
          {purpose && <ReviewRow label="Purpose" value={purpose} />}
          {description && <ReviewRow label="Description" value={description} html />}
          {licenseNo && <ReviewRow label="License No" value={licenseNo} />}
          {applicationFee && <ReviewRow label="Application Fee" value={applicationFee} />}
          {licenseFee && <ReviewRow label="License Fee" value={licenseFee} html />}
          {maxProcessingTime && <ReviewRow label="Max Processing Time" value={maxProcessingTime} />}
          {gazettedOn && <ReviewRow label="Gazetted On" value={gazettedOn} />}
          {validity && <ReviewRow label="Validity" value={validity} />}
          {enactment && <ReviewRow label="Enactment" value={enactment} />}
          {gazettingRef && <ReviewRow label="Gazetting Reference" value={gazettingRef} />}
          {contactOffice && <ReviewRow label="Contact Office" value={contactOffice} html />}
          {resolutionCriteria && <ReviewRow label="Resolution Criteria" value={resolutionCriteria} html />}
          {universal && <ReviewRow label="Universal" value="Yes" />}
          {selectedActivities.length > 0 && (
            <ReviewRow label="Activities" value={selectedActivities.map((id) => activities.find((a) => a.id === id)?.name).filter(Boolean).join(", ")} />
          )}
        </div>
      </div>

      {/* Legal Basis */}
      <div className="border border-sand-200 rounded-xl overflow-hidden">
        <div className="bg-sand-50 px-5 py-3 border-b border-sand-200">
          <h4 className="text-sm font-medium flex items-center gap-2"><BookOpen size={14} /> Legal Basis</h4>
        </div>
        <div className="p-5 space-y-3 text-sm">
          <ReviewRow label="Principle Legislation" value={principleLegislation} />
          {principleLegislationFile && <ReviewRow label="Attachment" value={principleLegislationFile.name} />}
          {subsidiaryLegislation && <ReviewRow label="Subsidiary Legislation" value={subsidiaryLegislation} />}
          {subsidiaryItems.length > 0 && (
            <ReviewRow label="Subsidiary Attachments" value={subsidiaryItems.map((s) => s.name || "(unnamed)").join(", ")} />
          )}
        </div>
      </div>

      {/* Custom Fields */}
      {hasCustomFields && Object.keys(customFieldValues).some((k) => customFieldValues[k]) && (
        <div className="border border-sand-200 rounded-xl overflow-hidden">
          <div className="bg-sand-50 px-5 py-3 border-b border-sand-200">
            <h4 className="text-sm font-medium flex items-center gap-2"><Settings2 size={14} /> Additional Details</h4>
          </div>
          <div className="p-5 space-y-3 text-sm">
            {customFields.map((cf) => {
              const val = customFieldValues[cf.id];
              return val ? <ReviewRow key={cf.id} label={cf.fieldlabel} value={val} /> : null;
            })}
          </div>
        </div>
      )}

      {/* Requirements */}
      {requirements && (
        <div className="border border-sand-200 rounded-xl overflow-hidden">
          <div className="bg-sand-50 px-5 py-3 border-b border-sand-200">
            <h4 className="text-sm font-medium flex items-center gap-2"><ClipboardList size={14} /> Requirements</h4>
          </div>
          <div className="p-5 text-sm">
            <div dangerouslySetInnerHTML={{ __html: requirements }} />
          </div>
        </div>
      )}

      {/* Downloads */}
      {downloadItems.length > 0 && (
        <div className="border border-sand-200 rounded-xl overflow-hidden">
          <div className="bg-sand-50 px-5 py-3 border-b border-sand-200">
            <h4 className="text-sm font-medium flex items-center gap-2"><Download size={14} /> Downloads</h4>
          </div>
          <div className="p-5 space-y-2 text-sm">
            {downloadItems.map((d, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-sand-100 last:border-0">
                <span className="font-medium">{d.name || "(unnamed)"}</span>
                <span className="text-muted-foreground">{d.issuing_body}{d.file ? ` — ${d.file.name}` : ""}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Validation warnings */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
          <div className="flex items-center gap-2 text-destructive font-medium text-sm mb-2">
            <AlertCircle size={16} /> Validation Errors
          </div>
          <ul className="text-sm text-destructive space-y-1 list-disc pl-5">
            {Object.entries(errors).map(([k, v]) => <li key={k}>{v}</li>)}
          </ul>
        </div>
      )}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <AdminLayout>
      <div className="max-w-5xl">
        <Link
          to={isEditMode ? `/login-admin/managelicenses/${editId}/show` : "/login-admin/managelicenses"}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft size={14} /> {isEditMode ? "Back to License" : "Back to Licences"}
        </Link>

        <div className="mb-8">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{isEditMode ? "Edit Licence" : "Add New Licence"}</div>
          <h1 className="font-serif text-3xl md:text-4xl font-medium tracking-tight">{isEditMode ? `Edit: ${name || "Loading…"}` : "Create a new Business Licence"}</h1>
          <p className="text-muted-foreground mt-1">{isEditMode ? "Update the licence details below and submit your changes." : "Complete all tabs below then submit for approval or save as draft."}</p>
        </div>

        {loadingLicense && (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-copper-500" />
            <span className="ml-3 text-muted-foreground">Loading licence data…</span>
          </div>
        )}

        {/* Tab navigation */}
        <div className="flex gap-1 bg-sand-100 rounded-xl p-1 mb-8 overflow-x-auto">
          {visibleTabs.map((tab, i) => {
            const active = tab.key === activeTab;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  active
                    ? "bg-white text-copper-600 shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-sand-200/50"
                }`}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{i + 1}</span>
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="bg-white border border-sand-200 rounded-2xl p-6 md:p-8">
          {activeTab === "details" && renderDetailsTab()}
          {activeTab === "legal" && renderLegalTab()}
          {activeTab === "additional" && renderAdditionalTab()}
          {activeTab === "requirements" && renderRequirementsTab()}
          {activeTab === "downloads" && renderDownloadsTab()}
          {activeTab === "review" && renderReviewTab()}

          {/* Navigation & Submit */}
          <div className="border-t border-sand-200 mt-8 pt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex gap-3">
              {tabIndex > 0 && (
                <button type="button" onClick={goPrev} className="inline-flex items-center gap-2 border border-sand-200 rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-sand-100 transition-colors">
                  <ArrowLeft size={14} /> Previous
                </button>
              )}
            </div>

            <div className="flex gap-3">
              {activeTab === "review" ? (
                <>
                  {!isEditMode && (
                    <button
                      type="button"
                      onClick={() => handleSubmit(true)}
                      disabled={submitting}
                      className="inline-flex items-center justify-center gap-2 border border-sand-200 rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-sand-100 transition-colors disabled:opacity-50"
                    >
                      {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
                      Save as Draft
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSubmit(false)}
                    disabled={submitting}
                    className="inline-flex items-center justify-center gap-2 bg-gradient-to-b from-copper-500 to-copper-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:from-copper-600 transition-colors disabled:opacity-50"
                  >
                    {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    {isEditMode ? "Update License" : "Submit for Approval"}
                  </button>
                </>
              ) : (
                <button type="button" onClick={goNext} className="inline-flex items-center gap-2 bg-gradient-to-b from-copper-500 to-copper-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:from-copper-600 transition-colors">
                  Next <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

// ---------------------------------------------------------------------------
// Review Row helper
// ---------------------------------------------------------------------------
const ReviewRow = ({ label, value, html }: { label: string; value?: string | null; html?: boolean }) => {
  if (!value) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 py-2 border-b border-sand-100 last:border-0">
      <span className="text-muted-foreground shrink-0 sm:w-44">{label}</span>
      {html ? (
        <div className="flex-1 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: value }} />
      ) : (
        <span className="flex-1 font-medium">{value}</span>
      )}
    </div>
  );
};

export default LicenseForm;

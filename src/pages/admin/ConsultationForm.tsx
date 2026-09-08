import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Check, Loader2, AlertCircle, FileText,
  Settings2, Upload, Eye, MessageSquare,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAgencies } from "@/hooks/use-agencies";
import { useIndustries } from "@/hooks/use-industries";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/services/api";
import type { ApiResponse } from "@/types/database";

const REGULATION_TYPES: Record<number, string> = {
  1: "Law",
  2: "By Law",
  3: "Instructions",
  4: "Decision",
  5: "Codes and Standards",
  6: "Forward Planning",
  7: "RIA",
  8: "Policy",
  9: "Other",
};

const STAGES: Record<number, string> = {
  1: "Open",
  2: "Close",
  3: "Closed",
};

type TabKey = "details" | "more" | "settings";

const TAB_CONFIG: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "details", label: "Details", icon: FileText },
  { key: "more", label: "More Details", icon: MessageSquare },
  { key: "settings", label: "Settings", icon: Settings2 },
];

const ConsultationForm = () => {
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id: string }>();
  const isEditMode = !!editId;
  const { toast } = useToast();

  const { data: agencyData } = useAgencies({ per_page: 200, order_by: "name", order_dir: "ASC" });
  const { data: industryData } = useIndustries({ per_page: 200, order_by: "name", order_dir: "ASC" });
  const agencies = agencyData?.data ?? [];
  const industries = industryData?.data ?? [];

  const [activeTab, setActiveTab] = useState<TabKey>("details");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Tab 1: Core Details
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [expectedOutcome, setExpectedOutcome] = useState("");
  const [agencyId, setAgencyId] = useState("");
  const [industryId, setIndustryId] = useState("");
  const [regulationType, setRegulationType] = useState(1);
  const [consultationStage, setConsultationStage] = useState(1);

  // Tab 2: More Details
  const [closingDate, setClosingDate] = useState("");
  const [specificInstructions, setSpecificInstructions] = useState("");
  const [supportingMaterials, setSupportingMaterials] = useState("");
  const [offlineConsultations, setOfflineConsultations] = useState("");
  const [keywords, setKeywords] = useState("");
  const [tags, setTags] = useState("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);

  // Tab 3: Settings
  const [published, setPublished] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [isLoginRequired, setIsLoginRequired] = useState(false);
  const [reviewComments, setReviewComments] = useState(true);
  const [enableAttachments, setEnableAttachments] = useState(true);
  const [fileSize, setFileSize] = useState(5);
  const [fileType, setFileType] = useState("pdf, doc, docx, jpg, png");

  // Load existing data in edit mode
  useEffect(() => {
    if (!editId) return;
    setLoading(true);
    api.get<ApiResponse<any>>(`/regulations/${editId}`)
      .then((r) => {
        const d = r.data;
        if (!d) return;
        setTitle(d.title || "");
        setDescription(d.description || "");
        setExpectedOutcome(d.expected_outcome || "");
        setAgencyId(d.agency_id ? String(d.agency_id) : "");
        setIndustryId(d.industry_id ? String(d.industry_id) : "");
        setRegulationType(d.regulation_type || 1);
        setConsultationStage(d.consultation_stage || 1);
        setClosingDate(d.closing_date || "");
        setSpecificInstructions(d.specific_instructions || "");
        setSupportingMaterials(d.supporting_materials || "");
        setOfflineConsultations(d.offline_consultations || "");
        setKeywords(d.keywords || "");
        setTags(d.tags || "");
        setPublished(!!d.published);
        setIsPublic(d.is_public !== 0);
        setIsLoginRequired(!!d.is_login_required);
        setReviewComments(d.review_comments !== 0);
        setEnableAttachments(d.enable_attachments !== 0);
        setFileSize(d.file_size || 5);
        setFileType(d.file_type || "pdf, doc, docx, jpg, png");
      })
      .catch((err) => {
        toast({ title: "Error", description: "Failed to load consultation: " + err.message, variant: "destructive" });
      })
      .finally(() => setLoading(false));
  }, [editId]);

  const tabIndex = TAB_CONFIG.findIndex((t) => t.key === activeTab);
  const goNext = () => {
    if (tabIndex < TAB_CONFIG.length - 1) {
      setActiveTab(TAB_CONFIG[tabIndex + 1].key);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  const goPrev = () => {
    if (tabIndex > 0) {
      setActiveTab(TAB_CONFIG[tabIndex - 1].key);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Title is required";
    else if (title.trim().length < 2) e.title = "Title must be at least 2 characters";
    if (!agencyId) e.agency_id = "Agency is required";
    if (!industryId) e.industry_id = "Industry is required";
    return e;
  };

  const handleSubmit = async () => {
    const validation = validate();
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      setActiveTab("details");
      toast({ title: "Validation Error", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      const payload = {
        title: title.trim(),
        description: description || null,
        expected_outcome: expectedOutcome || null,
        agency_id: Number(agencyId),
        industry_id: Number(industryId),
        regulation_type: regulationType,
        consultation_stage: consultationStage,
        closing_date: closingDate || null,
        specific_instructions: specificInstructions || null,
        supporting_materials: supportingMaterials || null,
        offline_consultations: offlineConsultations || null,
        keywords: keywords || null,
        tags: tags || null,
        published,
        is_public: isPublic,
        is_login_required: isLoginRequired,
        review_comments: reviewComments,
        enable_attachments: enableAttachments,
        file_size: fileSize,
        file_type: fileType || null,
      };

      if (isEditMode) {
        await api.put<ApiResponse<any>>(`/regulations/${editId}`, payload);
        toast({ title: "Consultation updated", description: `"${title}" has been updated successfully.` });
      } else {
        await api.post<ApiResponse<any>>("/regulations", payload);
        toast({ title: "Consultation created", description: `"${title}" has been created successfully.` });
      }
      navigate("/login-admin/manageregulations");
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to save consultation", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = (field?: string) =>
    `w-full h-11 px-3 rounded-lg border bg-white outline-none text-sm transition-colors ${
      field && errors[field]
        ? "border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/20"
        : "border-sand-200 focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20"
    }`;

  const textareaCls = (field?: string) =>
    `w-full px-3 py-2.5 rounded-lg border bg-white outline-none text-sm resize-y min-h-[120px] transition-colors ${
      field && errors[field]
        ? "border-destructive focus:ring-2 focus:ring-destructive/20"
        : "border-sand-200 focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20"
    }`;

  const FieldError = ({ field }: { field: string }) =>
    errors[field] ? (
      <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
        <AlertCircle size={12} /> {errors[field]}
      </p>
    ) : null;

  const renderDetailsTab = () => (
    <div className="space-y-5">
      <div>
        <label className="text-sm font-medium block mb-1.5">Title <span className="text-copper-600">*</span></label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls("title")} placeholder="Consultation title" />
        <FieldError field="title" />
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <label className="text-sm font-medium block mb-1.5">Agency <span className="text-copper-600">*</span></label>
          <select value={agencyId} onChange={(e) => setAgencyId(e.target.value)} className={inputCls("agency_id")}>
            <option value="">Select agency…</option>
            {agencies.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <FieldError field="agency_id" />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1.5">Industry <span className="text-copper-600">*</span></label>
          <select value={industryId} onChange={(e) => setIndustryId(e.target.value)} className={inputCls("industry_id")}>
            <option value="">Select industry…</option>
            {industries.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
          <FieldError field="industry_id" />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <label className="text-sm font-medium block mb-1.5">Regulation Type</label>
          <select value={regulationType} onChange={(e) => setRegulationType(Number(e.target.value))} className={inputCls()}>
            {Object.entries(REGULATION_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium block mb-1.5">Consultation Stage</label>
          <select value={consultationStage} onChange={(e) => setConsultationStage(Number(e.target.value))} className={inputCls()}>
            {Object.entries(STAGES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium block mb-1.5">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={textareaCls()} rows={4} placeholder="Detailed description of the consultation…" />
      </div>

      <div>
        <label className="text-sm font-medium block mb-1.5">Expected Outcome</label>
        <textarea value={expectedOutcome} onChange={(e) => setExpectedOutcome(e.target.value)} className={textareaCls()} rows={3} placeholder="What results are expected from this consultation?" />
      </div>
    </div>
  );

  const renderMoreTab = () => (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <label className="text-sm font-medium block mb-1.5">Closing Date</label>
          <input type="datetime-local" value={closingDate} onChange={(e) => setClosingDate(e.target.value)} className={inputCls()} />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1.5">Keywords <span className="text-muted-foreground text-xs">(comma-separated)</span></label>
          <input value={keywords} onChange={(e) => setKeywords(e.target.value)} className={inputCls()} placeholder="tax, reform, policy" />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium block mb-1.5">Tags <span className="text-muted-foreground text-xs">(comma-separated)</span></label>
        <input value={tags} onChange={(e) => setTags(e.target.value)} className={inputCls()} placeholder="zambia, business, 2024" />
      </div>

      <div>
        <label className="text-sm font-medium block mb-1.5">Specific Instructions</label>
        <textarea value={specificInstructions} onChange={(e) => setSpecificInstructions(e.target.value)} className={textareaCls()} rows={3} placeholder="Instructions for respondents…" />
      </div>

      <div>
        <label className="text-sm font-medium block mb-1.5">Supporting Materials</label>
        <textarea value={supportingMaterials} onChange={(e) => setSupportingMaterials(e.target.value)} className={textareaCls()} rows={3} placeholder="Describe any additional materials…" />
      </div>

      <div>
        <label className="text-sm font-medium block mb-1.5">Offline Consultations</label>
        <textarea value={offlineConsultations} onChange={(e) => setOfflineConsultations(e.target.value)} className={textareaCls()} rows={3} placeholder="Venues, meetings, physical consultation locations…" />
      </div>

      <div>
        <label className="text-sm font-medium block mb-1.5">Main Document</label>
        <label className="flex items-center gap-3 border border-dashed border-sand-300 rounded-xl p-4 cursor-pointer hover:bg-sand-50 transition-colors">
          <Upload size={18} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{documentFile ? documentFile.name : "Click to upload consultation document"}</span>
          <input type="file" className="hidden" onChange={(e) => setDocumentFile(e.target.files?.[0] || null)} />
        </label>
      </div>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-5">
        <div className="flex items-center gap-3 bg-sand-50 rounded-xl p-4">
          <input id="pub" type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="rounded border-sand-300 w-5 h-5" />
          <label htmlFor="pub" className="text-sm font-medium">Publish immediately</label>
        </div>
        <div className="flex items-center gap-3 bg-sand-50 rounded-xl p-4">
          <input id="public" type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="rounded border-sand-300 w-5 h-5" />
          <label htmlFor="public" className="text-sm font-medium">Public visibility</label>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="flex items-center gap-3 bg-sand-50 rounded-xl p-4">
          <input id="login" type="checkbox" checked={isLoginRequired} onChange={(e) => setIsLoginRequired(e.target.checked)} className="rounded border-sand-300 w-5 h-5" />
          <label htmlFor="login" className="text-sm font-medium">Require login to comment</label>
        </div>
        <div className="flex items-center gap-3 bg-sand-50 rounded-xl p-4">
          <input id="review" type="checkbox" checked={reviewComments} onChange={(e) => setReviewComments(e.target.checked)} className="rounded border-sand-300 w-5 h-5" />
          <label htmlFor="review" className="text-sm font-medium">Review comments before publishing</label>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="flex items-center gap-3 bg-sand-50 rounded-xl p-4">
          <input id="attach" type="checkbox" checked={enableAttachments} onChange={(e) => setEnableAttachments(e.target.checked)} className="rounded border-sand-300 w-5 h-5" />
          <label htmlFor="attach" className="text-sm font-medium">Enable comment attachments</label>
        </div>
        <div>
          <label className="text-sm font-medium block mb-1.5">Max attachment size (MB)</label>
          <input type="number" min={1} max={800} value={fileSize} onChange={(e) => setFileSize(Number(e.target.value))} className={inputCls()} />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium block mb-1.5">Allowed file types</label>
        <input value={fileType} onChange={(e) => setFileType(e.target.value)} className={inputCls()} placeholder="pdf, doc, docx, jpg, png" />
      </div>
    </div>
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-copper-500" />
          <span className="ml-3 text-muted-foreground">Loading consultation…</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <Link
          to="/login-admin/manageregulations"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft size={14} /> Back to Consultations
        </Link>

        <div className="mb-6">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
            {isEditMode ? "Edit Consultation" : "Add New Consultation"}
          </div>
          <h1 className="font-serif text-3xl font-medium tracking-tight">
            {isEditMode ? `Edit: ${title || "Loading…"}` : "Add New Consultation"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEditMode ? "Update the consultation details below." : "Create a new public consultation for feedback."}
          </p>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-1 bg-sand-100 rounded-xl p-1 mb-6 overflow-x-auto">
          {TAB_CONFIG.map((tab) => {
            const active = tab.key === activeTab;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  active ? "bg-white text-copper-600 shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-sand-200/50"
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="bg-white border border-sand-200 rounded-2xl p-6 md:p-8">
          {activeTab === "details" && renderDetailsTab()}
          {activeTab === "more" && renderMoreTab()}
          {activeTab === "settings" && renderSettingsTab()}

          <div className="border-t border-sand-200 mt-8 pt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex gap-3">
              {tabIndex > 0 && (
                <button type="button" onClick={goPrev} className="inline-flex items-center gap-2 border border-sand-200 rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-sand-100 transition-colors">
                  <ArrowLeft size={14} /> Previous
                </button>
              )}
            </div>
            <div className="flex gap-3">
              {tabIndex < TAB_CONFIG.length - 1 ? (
                <button type="button" onClick={goNext} className="inline-flex items-center gap-2 bg-gradient-to-b from-copper-500 to-copper-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:from-copper-600 transition-colors">
                  Next <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 bg-gradient-to-b from-copper-500 to-copper-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:from-copper-600 transition-colors disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  {isEditMode ? "Update Consultation" : "Create Consultation"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ConsultationForm;

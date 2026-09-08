import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, CheckCircle2, XCircle, Clock, FileText, BookOpen,
  Settings2, ClipboardList, Download, History, AlertTriangle,
  Loader2, Eye, ExternalLink, Shield, ChevronDown, ChevronUp,
  Pencil, EyeOff, Globe,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/services/api";
import type { ApiResponse } from "@/types/database";

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------
const STATUS_MAP: Record<number, { label: string; cls: string }> = {
  1: { label: "Published", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  2: { label: "Draft", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  3: { label: "Pending Assessment", cls: "bg-sky-50 text-sky-700 border-sky-200" },
  4: { label: "Unpublished", cls: "bg-stone-100 text-stone-700 border-stone-200" },
  5: { label: "Needs Corrections", cls: "bg-red-50 text-red-700 border-red-200" },
};

const statusBadge = (status: number) => {
  const s = STATUS_MAP[status] || { label: `Status ${status}`, cls: "bg-stone-100 text-stone-700 border-stone-200" };
  return <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${s.cls}`}>{s.label}</span>;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const LicenseShow = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: response, isLoading } = useQuery({
    queryKey: ["license-admin-show", id],
    queryFn: () => api.get<ApiResponse<any>>(`/license-admin/${id}/show`),
    enabled: !!id,
  });

  const lic = response?.data;

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReasons, setRejectReasons] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [expandHistory, setExpandHistory] = useState(false);
  const [expandTasks, setExpandTasks] = useState(false);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------
  const handleApprove = async () => {
    if (!confirm("Are you sure you want to approve this license?")) return;
    setSubmitting(true);
    try {
      const result = await api.post<ApiResponse<any>>(`/license-admin/${id}/approve`, {
        stage_id: lic.stage_id,
        user_id: 1,
      });
      toast({
        title: "License Approved",
        description: result.data?.message || "License has been approved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["license-admin-show", id] });
      queryClient.invalidateQueries({ queryKey: ["licenses"] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReasons.trim()) {
      toast({ title: "Rejection reasons required", description: "Please provide reasons for rejection.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const result = await api.post<ApiResponse<any>>(`/license-admin/${id}/reject`, {
        reasons: rejectReasons,
        user_id: 1,
      });
      toast({
        title: "License Rejected",
        description: result.data?.message || "License has been rejected and sent back for corrections.",
      });
      setShowRejectModal(false);
      setRejectReasons("");
      queryClient.invalidateQueries({ queryKey: ["license-admin-show", id] });
      queryClient.invalidateQueries({ queryKey: ["licenses"] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnpublish = async () => {
    if (!confirm("Are you sure you want to unpublish this license? It will be removed from public view.")) return;
    setSubmitting(true);
    try {
      const result = await api.post<ApiResponse<any>>(`/license-admin/${id}/unpublish`, { user_id: 1 });
      toast({
        title: "License Unpublished",
        description: result.data?.message || "License has been removed from public view.",
      });
      queryClient.invalidateQueries({ queryKey: ["license-admin-show", id] });
      queryClient.invalidateQueries({ queryKey: ["license-admin-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["licenses"] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async () => {
    if (!confirm("Are you sure you want to publish this license? It will become publicly visible.")) return;
    setSubmitting(true);
    try {
      const result = await api.post<ApiResponse<any>>(`/license-admin/${id}/publish`, { user_id: 1 });
      toast({
        title: "License Published",
        description: result.data?.message || "License is now publicly visible.",
      });
      queryClient.invalidateQueries({ queryKey: ["license-admin-show", id] });
      queryClient.invalidateQueries({ queryKey: ["license-admin-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["licenses"] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Loading / Error states
  // ---------------------------------------------------------------------------
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-copper-500" />
          <span className="ml-3 text-muted-foreground">Loading license…</span>
        </div>
      </AdminLayout>
    );
  }

  if (!lic) {
    return (
      <AdminLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">License not found.</p>
          <Link to="/login-admin/managelicenses" className="text-copper-600 hover:underline mt-2 inline-block">← Back to licences</Link>
        </div>
      </AdminLayout>
    );
  }

  const workflow = lic.workflow;
  const licStatus = Number(lic.status);
  const showAssessButtons = lic.show_assessment_buttons && workflow?.type === "assess";
  const showPublishButtons = workflow?.type === "publish" && licStatus === 1;
  const showUnpublishButtons = workflow?.type === "unpublish" && licStatus === 4;
  const showEditButton = licStatus === 2 || licStatus === 5 || (showPublishButtons);
  const history: any[] = lic.history || [];
  const tasks: any[] = lic.tasks || [];
  const activities: any[] = lic.activities || [];
  const downloads: any[] = lic.downloads || [];
  const fieldData: any[] = lic.field_data || [];
  const lastRejection = lic.last_rejection;

  return (
    <AdminLayout>
      <div className="max-w-5xl">
        {/* Back link */}
        <Link
          to="/login-admin/managelicenses"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft size={14} /> Back to Licences
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-2">
              {statusBadge(Number(lic.status))}
              {workflow && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-sand-100 text-muted-foreground border border-sand-200 font-medium">
                  Stage: {workflow.title}
                </span>
              )}
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-medium tracking-tight">{lic.name}</h1>
            <p className="text-muted-foreground mt-1">
              {lic.agency_name && <>Issued by <span className="font-medium text-foreground">{lic.agency_name}</span></>}
              {lic.location_name && <> · {lic.location_name}</>}
              {lic.license_no && <> · #{lic.license_no}</>}
            </p>
          </div>
          <Link
            to={`/license/id/${lic.id}`}
            target="_blank"
            className="inline-flex items-center gap-2 text-sm text-copper-600 hover:text-copper-800 shrink-0"
          >
            <Eye size={14} /> Public view <ExternalLink size={12} />
          </Link>
        </div>

        {/* Rejection banner */}
        {Number(lic.status) === 5 && lastRejection && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="text-red-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-red-800">Corrections Required</h4>
                <p className="text-sm text-red-700 mt-1">{lastRejection.task_description || "This license was rejected. Please review the feedback and resubmit."}</p>
              </div>
            </div>
          </div>
        )}

        {/* Assessment buttons (Approve/Reject) */}
        {showAssessButtons && (
          <div className="bg-sand-50 border border-sand-200 rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <Shield size={18} className="text-copper-600" />
                <div>
                  <h4 className="text-sm font-semibold">Review Action Required</h4>
                  <p className="text-xs text-muted-foreground">
                    This license is at the <span className="font-medium">{workflow?.title}</span> stage.
                    {workflow?.task_description && <> — {workflow.task_description}</>}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 bg-emerald-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => setShowRejectModal(true)}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 bg-red-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  <XCircle size={14} /> Reject
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Published license actions (Edit / Unpublish) */}
        {showPublishButtons && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <Globe size={18} className="text-emerald-600" />
                <div>
                  <h4 className="text-sm font-semibold text-emerald-800">Published License</h4>
                  <p className="text-xs text-emerald-700">This license is live and publicly visible. You can edit it or unpublish it.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Link
                  to={`/login-admin/managelicenses/${id}/edit`}
                  className="inline-flex items-center gap-2 bg-copper-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-copper-700 transition-colors"
                >
                  <Pencil size={14} /> Edit
                </Link>
                <button
                  type="button"
                  onClick={handleUnpublish}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 bg-stone-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-stone-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <EyeOff size={14} />}
                  Unpublish
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Unpublished license actions (Publish) */}
        {showUnpublishButtons && (
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <EyeOff size={18} className="text-stone-600" />
                <div>
                  <h4 className="text-sm font-semibold text-stone-800">Unpublished License</h4>
                  <p className="text-xs text-stone-600">This license is not publicly visible. You can publish it to make it live again.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 bg-emerald-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
                  Publish
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit button for Draft / Corrections */}
        {(licStatus === 2 || licStatus === 5) && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <Pencil size={18} className="text-amber-600" />
                <div>
                  <h4 className="text-sm font-semibold text-amber-800">
                    {licStatus === 2 ? "Draft License" : "Corrections Required"}
                  </h4>
                  <p className="text-xs text-amber-700">
                    {licStatus === 2
                      ? "This license is a draft. Edit and submit it for review."
                      : "This license needs corrections. Edit and resubmit."
                    }
                  </p>
                </div>
              </div>
              <Link
                to={`/login-admin/managelicenses/${id}/edit`}
                className="inline-flex items-center gap-2 bg-copper-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-copper-700 transition-colors"
              >
                <Pencil size={14} /> Edit License
              </Link>
            </div>
          </div>
        )}

        {/* License details card */}
        <div className="space-y-6">
          {/* Core details */}
          <Card title="License Details" icon={FileText}>
            <div className="space-y-3 text-sm">
              <Row label="Name" value={lic.name} />
              <Row label="Keywords" value={lic.keywords} />
              <Row label="Agency" value={lic.agency_name} />
              {lic.location_name && <Row label="Jurisdiction" value={lic.location_name} />}
              {lic.purpose && <Row label="Purpose" value={lic.purpose} html />}
              {lic.description && <Row label="Description" value={lic.description} html />}
              {lic.license_no && <Row label="License No" value={lic.license_no} />}
              {lic.application_fee && <Row label="Application Fee" value={lic.application_fee} />}
              {lic.license_fee && <Row label="License Fee" value={lic.license_fee} html />}
              {lic.max_processing_time && <Row label="Max Processing Time" value={lic.max_processing_time} />}
              {lic.gazetted_on && <Row label="Gazetted On" value={lic.gazetted_on} />}
              {lic.validity && <Row label="Validity" value={lic.validity} />}
              {lic.enactment && <Row label="Enactment" value={lic.enactment} />}
              {lic.gazetting_ref && <Row label="Gazetting Ref" value={lic.gazetting_ref} />}
              {lic.contact_office && <Row label="Contact Office" value={lic.contact_office} html />}
              {lic.resolution_criteria && <Row label="Resolution Criteria" value={lic.resolution_criteria} html />}
              {lic.universal ? <Row label="Universal" value="Yes" /> : null}
              {activities.length > 0 && (
                <Row label="Activities" value={activities.map((a: any) => a.name).join(", ")} />
              )}
            </div>
          </Card>

          {/* Legal Basis */}
          {(lic.principle_legislation || lic.subsidiary_legislation) && (
            <Card title="Legal Basis" icon={BookOpen}>
              <div className="space-y-3 text-sm">
                {lic.principle_legislation && <Row label="Principle Legislation" value={lic.principle_legislation} />}
                {lic.principle_legislation_attachment && (
                  <Row label="Attachment" value={
                    <a href={`/uploads/${lic.principle_legislation_attachment}`} target="_blank" rel="noopener" className="text-copper-600 hover:underline inline-flex items-center gap-1">
                      {lic.principle_legislation_attachment} <ExternalLink size={12} />
                    </a>
                  } />
                )}
                {lic.subsidiary_legislation && <Row label="Subsidiary Legislation" value={lic.subsidiary_legislation} />}
              </div>
            </Card>
          )}

          {/* Custom fields */}
          {fieldData.length > 0 && (
            <Card title="Additional Details" icon={Settings2}>
              <div className="space-y-3 text-sm">
                {fieldData.map((f: any) => (
                  <Row key={f.id} label={f.fieldlabel} value={f.fielddata} />
                ))}
              </div>
            </Card>
          )}

          {/* Requirements */}
          {lic.requirements && (
            <Card title="Requirements" icon={ClipboardList}>
              <div className="prose prose-sm max-w-none text-sm" dangerouslySetInnerHTML={{ __html: lic.requirements }} />
            </Card>
          )}

          {/* Downloads */}
          {downloads.length > 0 && (
            <Card title="Downloads" icon={Download}>
              <div className="divide-y divide-sand-100">
                {downloads.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between py-3 text-sm">
                    <div>
                      <span className="font-medium">{d.name || "(unnamed)"}</span>
                      {d.issuing_body && <span className="text-muted-foreground ml-2">— {d.issuing_body}</span>}
                    </div>
                    {d.filepath && (
                      <a href={`/uploads/${d.filepath}`} target="_blank" rel="noopener" className="text-copper-600 hover:underline text-xs inline-flex items-center gap-1">
                        Download <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Application History */}
          <Card
            title="Application History"
            icon={History}
            collapsible
            expanded={expandHistory}
            onToggle={() => setExpandHistory(!expandHistory)}
            badge={String(history.length)}
          >
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No history records.</p>
            ) : (
              <div className="divide-y divide-sand-100">
                {history.map((h: any) => (
                  <div key={h.id} className="py-3 text-sm flex items-start gap-3">
                    <div className={`mt-1 size-2 rounded-full shrink-0 ${
                      h.action_type?.includes("Approved") ? "bg-emerald-500" :
                      h.action_type?.includes("Rejected") ? "bg-red-500" :
                      h.action_type?.includes("Draft") ? "bg-amber-500" :
                      "bg-sky-500"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{h.action_type}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {h.previous_stage_title && <>{h.previous_stage_title}</>}
                        {h.previous_stage_title && h.current_step_title && " → "}
                        {h.current_step_title && <>{h.current_step_title}</>}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">User #{h.user_id}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Tasks */}
          <Card
            title="Tasks"
            icon={ClipboardList}
            collapsible
            expanded={expandTasks}
            onToggle={() => setExpandTasks(!expandTasks)}
            badge={String(tasks.length)}
          >
            {tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No tasks assigned.</p>
            ) : (
              <div className="divide-y divide-sand-100">
                {tasks.map((t: any) => (
                  <div key={t.id} className="py-3 text-sm flex items-start gap-3">
                    <div className={`mt-1 shrink-0 ${
                      t.task_status === "complete"
                        ? "text-emerald-500"
                        : t.decline === 1 ? "text-red-500" : "text-amber-500"
                    }`}>
                      {t.task_status === "complete" ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">{t.task_status}</span>
                        {t.decline === 1 && <span className="text-xs px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-200">Rejection</span>}
                      </div>
                      {t.task_description && (
                        <p className="text-muted-foreground mt-0.5 line-clamp-2">{t.task_description}</p>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">
                        Assigned to #{t.assignee_id}
                        {t.task_start_date && <> · Started {new Date(t.task_start_date).toLocaleString()}</>}
                        {t.task_end_date && <> · Completed {new Date(t.task_end_date).toLocaleString()}</>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="border-b border-sand-200 px-6 py-4">
              <h3 className="font-serif text-xl font-medium">Reject License</h3>
              <p className="text-sm text-muted-foreground mt-1">Provide reasons for rejection. These will be sent back to the license creator.</p>
            </div>
            <div className="px-6 py-5">
              <label className="text-sm font-medium block mb-1.5">
                Rejection Reasons <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReasons}
                onChange={(e) => setRejectReasons(e.target.value)}
                rows={5}
                className="w-full px-3 py-2.5 rounded-lg border border-sand-200 bg-white outline-none text-sm resize-y min-h-[120px] focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20"
                placeholder="Explain what needs to be corrected…"
                autoFocus
              />
            </div>
            <div className="border-t border-sand-200 px-6 py-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setShowRejectModal(false); setRejectReasons(""); }}
                disabled={submitting}
                className="inline-flex items-center gap-2 border border-sand-200 rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-sand-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={submitting}
                className="inline-flex items-center gap-2 bg-red-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------
const Card = ({ title, icon: Icon, children, collapsible, expanded, onToggle, badge }: {
  title: string;
  icon: typeof FileText;
  children: React.ReactNode;
  collapsible?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  badge?: string;
}) => (
  <div className="border border-sand-200 rounded-xl overflow-hidden">
    <div
      className={`bg-sand-50 px-5 py-3 border-b border-sand-200 flex items-center justify-between ${collapsible ? "cursor-pointer hover:bg-sand-100" : ""}`}
      onClick={collapsible ? onToggle : undefined}
    >
      <h4 className="text-sm font-medium flex items-center gap-2">
        <Icon size={14} className="text-copper-600" /> {title}
        {badge && <span className="text-xs px-1.5 py-0.5 rounded-full bg-sand-200 text-muted-foreground">{badge}</span>}
      </h4>
      {collapsible && (expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
    </div>
    {(!collapsible || expanded) && <div className="p-5">{children}</div>}
  </div>
);

const Row = ({ label, value, html }: { label: string; value?: any; html?: boolean }) => {
  if (!value && value !== 0) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 py-2 border-b border-sand-100 last:border-0">
      <span className="text-muted-foreground shrink-0 sm:w-44">{label}</span>
      {typeof value === "string" && html ? (
        <div className="flex-1 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: value }} />
      ) : typeof value === "object" ? (
        <div className="flex-1">{value}</div>
      ) : (
        <span className="flex-1 font-medium">{value}</span>
      )}
    </div>
  );
};

export default LicenseShow;

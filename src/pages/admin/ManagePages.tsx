import { ManageTable, statusBadge } from "@/components/admin/ManageTable";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Activity, Calendar, FileText, MessageSquare, TrendingUp, Loader2, Plus, Search, Eye, Pencil, Filter, Download, MoreVertical, EyeOff, X, Check, Trash2, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useAgencies } from "@/hooks/use-agencies";
import { useLocations } from "@/hooks/use-locations";
import { useIndustries } from "@/hooks/use-industries";
import { useBusinessTypes } from "@/hooks/use-businesstypes";
import { useActivities } from "@/hooks/use-activities";
import { useRegulations } from "@/hooks/use-regulations";
import { useNewsList, useFAQs } from "@/hooks/use-content";
import { useDashboardStats } from "@/hooks/use-stats";
import { useToast } from "@/hooks/use-toast";
import type { ApiResponse } from "@/types/database";

const LICENSE_STATUS: Record<number, string> = {
  1: "Published",
  2: "Draft",
  3: "Pending Assessment",
  4: "Unpublished",
  5: "Needs Corrections",
};

const LICENSE_STATUS_BADGE: Record<string, string> = {
  Published: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Draft: "bg-amber-50 text-amber-700 border-amber-200",
  "Pending Assessment": "bg-sky-50 text-sky-700 border-sky-200",
  Unpublished: "bg-stone-100 text-stone-700 border-stone-200",
  "Needs Corrections": "bg-red-50 text-red-700 border-red-200",
};

const licenseStatusBadge = (status: number) => {
  const label = LICENSE_STATUS[status] || `Status ${status}`;
  const cls = LICENSE_STATUS_BADGE[label] || "bg-stone-100 text-stone-700 border-stone-200";
  return <span className={`text-xs px-2 py-1 rounded-full border font-medium ${cls}`}>{label}</span>;
};

export const ManageLicenses = () => {
  const [activeStage, setActiveStage] = useState<string>("all");
  const [q, setQ] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [batchAction, setBatchAction] = useState("");
  const { toast } = useToast();

  const { data: dashData, isLoading, refetch } = useQuery({
    queryKey: ["license-admin-dashboard", activeStage, page, q],
    queryFn: () =>
      api.get<ApiResponse<any>>("/license-admin/dashboard", {
        stage_id: activeStage,
        user_id: 1,
        page: String(page),
        limit: "25",
        q,
      }),
  });

  const dashboard = dashData?.data;
  const tabs: any[] = dashboard?.tabs || [];
  const licenses: any[] = dashboard?.licenses || [];
  const totalCount: number = dashboard?.total_count || 0;
  const selectedTab = dashboard?.selected_tab;
  const pagination = dashboard?.pagination || { page: 1, total: 0, total_pages: 1, limit: 25 };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQ(searchInput);
    setPage(1);
    setSelected(new Set());
  };

  const handleStageChange = (stage: string) => {
    setActiveStage(stage);
    setPage(1);
    setSelected(new Set());
    setQ("");
    setSearchInput("");
  };

  const toggleSelect = (id: number) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === licenses.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(licenses.map((l: any) => l.id)));
    }
  };

  const handlePublishSingle = async (id: number, name: string) => {
    if (!confirm(`Publish "${name}" to the public License Directory?`)) return;
    try {
      await api.post<ApiResponse<any>>(`/license-admin/${id}/publish`, { user_id: 1 });
      toast({ title: "Published", description: `"${name}" is now live in the License Directory.` });
      refetch();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to publish licence", variant: "destructive" });
    }
  };

  const handleBatchAction = async () => {
    if (!batchAction || selected.size === 0) return;
    const actionLabels: Record<string, string> = {
      publish: "publish",
      unpublish: "unpublish",
      delete: "delete",
      save_draft: "save as draft",
    };
    if (!confirm(`Are you sure you want to ${actionLabels[batchAction]} ${selected.size} licence(s)?`)) return;

    try {
      const result = await api.post<ApiResponse<any>>("/license-admin/batch", {
        ids: Array.from(selected),
        action: batchAction,
        user_id: 1,
      });
      toast({ title: "Success", description: result.data?.message || `Batch ${batchAction} completed.` });
      setSelected(new Set());
      setBatchAction("");
      refetch();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Batch action failed", variant: "destructive" });
    }
  };

  const pageNumbers = () => {
    const pages: number[] = [];
    const total = pagination.total_pages;
    const current = pagination.page;
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-3xl font-medium tracking-tight">Business Licences</h1>
          <p className="text-muted-foreground mt-1">Manage all licences across workflow stages and issuing authorities.</p>
        </div>
        <Link
          to="/login-admin/managelicenses/new"
          className="inline-flex items-center gap-2 bg-gradient-to-b from-copper-500 to-copper-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:from-copper-600 transition-colors"
        >
          <Plus size={16} /> Add new licence
        </Link>
      </div>

      {/* Workflow stage tabs */}
      <div className="flex items-center gap-1 border-b border-sand-200 mb-6 overflow-x-auto">
        <button
          onClick={() => handleStageChange("all")}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap inline-flex items-center gap-2 ${
            activeStage === "all"
              ? "border-copper-500 text-copper-600"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          My Licenses
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            activeStage === "all" ? "bg-copper-50 text-copper-600" : "bg-sand-100 text-muted-foreground"
          }`}>{totalCount}</span>
        </button>

        {tabs.map((tab: any) => (
          <button
            key={tab.id}
            onClick={() => handleStageChange(String(tab.id))}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap inline-flex items-center gap-2 ${
              activeStage === String(tab.id)
                ? "border-copper-500 text-copper-600"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.title}
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              activeStage === String(tab.id) ? "bg-copper-50 text-copper-600" : "bg-sand-100 text-muted-foreground"
            }`}>{tab.license_count ?? 0}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
        {/* Toolbar: Search + Batch Actions */}
        <div className="flex items-center gap-3 p-4 border-b border-sand-200 flex-wrap">
          <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 bg-sand-100 rounded-full px-4 h-10 max-w-md">
            <Search size={14} className="text-muted-foreground" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search licences…"
              className="flex-1 bg-transparent outline-none text-sm"
            />
            {q && (
              <button type="button" onClick={() => { setQ(""); setSearchInput(""); setPage(1); }} className="text-muted-foreground hover:text-foreground">
                <X size={14} />
              </button>
            )}
          </form>

          {selected.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">{selected.size} selected</span>
              <select
                value={batchAction}
                onChange={(e) => setBatchAction(e.target.value)}
                className="text-sm border border-sand-200 rounded-lg px-2 h-9 bg-white"
              >
                <option value="">Batch action…</option>
                <option value="publish">Publish</option>
                <option value="unpublish">Unpublish</option>
                <option value="save_draft">Save as Draft</option>
                <option value="delete">Delete</option>
              </select>
              <button
                onClick={handleBatchAction}
                disabled={!batchAction}
                className="inline-flex items-center gap-1.5 text-sm bg-copper-500 text-white rounded-lg px-3 h-9 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-copper-600 transition-colors"
              >
                <Check size={14} /> Apply
              </button>
            </div>
          )}

          {selectedTab && (
            <span className="text-xs px-3 py-1.5 rounded-full bg-sand-100 text-muted-foreground border border-sand-200">
              Stage: <span className="font-medium text-foreground">{selectedTab.title}</span> · Type: {selectedTab.type}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={20} className="animate-spin text-copper-500" />
            <span className="ml-3 text-sm text-muted-foreground">Loading licences…</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground bg-sand-100/50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium w-10">
                    <input
                      type="checkbox"
                      className="rounded border-sand-200"
                      checked={licenses.length > 0 && selected.size === licenses.length}
                      onChange={toggleAll}
                    />
                  </th>
                  <th className="text-left py-3 px-4 font-medium">Name</th>
                  <th className="text-left py-3 px-4 font-medium">Issuing Authority</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Stage</th>
                  <th className="text-left py-3 px-4 font-medium">Created</th>
                  <th className="text-right py-3 px-4 font-medium w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {licenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground">
                      {q ? "No licences match your search." : "No licences in this stage."}
                    </td>
                  </tr>
                ) : (
                  licenses.map((lic: any) => {
                    const status = Number(lic.status);
                    return (
                      <tr key={lic.id} className={`border-t border-sand-100 hover:bg-sand-100/40 ${selected.has(lic.id) ? "bg-copper-50/30" : ""}`}>
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            className="rounded border-sand-200"
                            checked={selected.has(lic.id)}
                            onChange={() => toggleSelect(lic.id)}
                          />
                        </td>
                        <td className="py-3 px-4">
                          <Link
                            to={`/login-admin/managelicenses/${lic.id}/show`}
                            className="font-medium text-copper-600 hover:underline"
                          >
                            {lic.name}
                          </Link>
                          <div className="text-xs text-muted-foreground">#{lic.id}</div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{lic.agency_name || "—"}</td>
                        <td className="py-3 px-4">{licenseStatusBadge(status)}</td>
                        <td className="py-3 px-4">
                          {lic.stage_title ? (
                            <span className="text-xs px-2 py-1 rounded-full bg-sand-100 text-sand-700 border border-sand-200">
                              {lic.stage_title}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-xs">
                          {lic.created ? new Date(lic.created).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            {/* Edit: Draft or Needs Corrections */}
                            {(status === 2 || status === 5) && (
                              <Link
                                to={`/login-admin/managelicenses/${lic.id}/edit`}
                                className="p-1.5 rounded-md hover:bg-sand-200 text-muted-foreground"
                                title="Edit"
                              >
                                <Pencil size={14} />
                              </Link>
                            )}
                            {/* Publish: any non-published license */}
                            {status !== 1 && (
                              <button
                                type="button"
                                onClick={() => handlePublishSingle(lic.id, lic.name)}
                                className="p-1.5 rounded-md hover:bg-emerald-50 text-emerald-600"
                                title="Publish to License Directory"
                              >
                                <Globe size={14} />
                              </button>
                            )}
                            {/* View: Published, Pending, Unpublished */}
                            <Link
                              to={`/login-admin/managelicenses/${lic.id}/show`}
                              className="p-1.5 rounded-md hover:bg-sand-200 text-muted-foreground"
                              title="View"
                            >
                              <Eye size={14} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-sand-200 text-sm text-muted-foreground">
          <span>
            Showing {licenses.length > 0 ? ((pagination.page - 1) * pagination.limit) + 1 : 0}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} licences
          </span>
          {pagination.total_pages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => { setPage((p) => Math.max(1, p - 1)); setSelected(new Set()); }}
                disabled={pagination.page <= 1}
                className="px-3 py-1.5 rounded-md border border-sand-200 hover:bg-sand-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {pageNumbers().map((p) => (
                <button
                  key={p}
                  onClick={() => { setPage(p); setSelected(new Set()); }}
                  className={`px-3 py-1.5 rounded-md ${
                    p === pagination.page
                      ? "bg-copper-50 text-copper-600 font-medium"
                      : "hover:bg-sand-100"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => { setPage((p) => Math.min(pagination.total_pages, p + 1)); setSelected(new Set()); }}
                disabled={pagination.page >= pagination.total_pages}
                className="px-3 py-1.5 rounded-md border border-sand-200 hover:bg-sand-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export const ManageAgencies = () => {
  const [activeView, setActiveView] = useState<string>("active");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["agencies-dashboard", activeView],
    queryFn: () =>
      api.get<ApiResponse<any>>("/agencies/dashboard", { view: activeView }),
  });

  const counts = data?.data?.counts ?? {};
  const items = data?.data?.items ?? [];

  const toggleSelect = (id: number) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === items.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map((r: any) => r.id)));
    }
  };

  const handleBatchDelete = async () => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    if (!confirm(`Are you sure you want to delete ${ids.length} issuing authority(ies)?`)) return;

    try {
      await api.post<ApiResponse<any>>("/agencies/batch", { ids });
      toast({ title: "Deleted", description: `${ids.length} issuing authority(ies) deleted successfully.` });
      setSelected(new Set());
      refetch();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to delete", variant: "destructive" });
    }
  };

  const handleDeleteSingle = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await api.delete<ApiResponse<any>>(`/agencies/${id}`);
      toast({ title: "Deleted", description: `"${name}" has been deleted.` });
      refetch();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to delete", variant: "destructive" });
    }
  };

  const tabs = [
    { key: "active", label: "Active", count: counts.active ?? 0 },
    { key: "deleted", label: "Deleted", count: counts.deleted ?? 0 },
  ];

  return (
    <AdminLayout>
      <div className="max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="font-serif text-3xl font-medium tracking-tight">Issuing Authorities</h1>
            <p className="text-muted-foreground mt-1">Government bodies and local authorities that issue licences.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login-admin/manageagencies/new"
              className="inline-flex items-center gap-2 bg-gradient-to-b from-copper-500 to-copper-600 text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:from-copper-600 transition-colors"
            >
              <Plus size={16} /> Add Issuing Authority
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 bg-sand-100 rounded-xl p-1 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => { setActiveView(tab.key); setSelected(new Set()); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeView === tab.key
                  ? "bg-white text-copper-600 shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-sand-200/50"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeView === tab.key ? "bg-copper-100 text-copper-700" : "bg-sand-200 text-sand-700"}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Batch actions */}
        {activeView === "active" && selected.size > 0 && (
          <div className="bg-sand-50 border border-sand-200 rounded-xl p-3 mb-4 flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{selected.size} selected</span>
            <button
              type="button"
              onClick={handleBatchDelete}
              className="h-9 px-4 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        )}

        {/* Table */}
        <div className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-copper-500" />
              <span className="ml-3 text-muted-foreground">Loading issuing authorities…</span>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No issuing authorities found.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-sand-50 border-b border-sand-200">
                  {activeView === "active" && (
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={items.length > 0 && selected.size === items.length}
                        onChange={toggleAll}
                        className="rounded border-sand-300"
                      />
                    </th>
                  )}
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground w-14">#</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Address</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground w-20">Offices</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground w-16">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row: any) => (
                  <tr key={row.id} className="border-b border-sand-100 hover:bg-sand-50/50 transition-colors">
                    {activeView === "active" && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(row.id)}
                          onChange={() => toggleSelect(row.id)}
                          className="rounded border-sand-300"
                        />
                      </td>
                    )}
                    <td className="px-4 py-3 text-muted-foreground">{row.id}</td>
                    <td className="px-4 py-3 font-medium">{row.title || row.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.address || "—"}</td>
                    <td className="px-4 py-3 text-center">
                      <Link
                        to={`/login-admin/manageagencies/${row.id}/offices`}
                        className="inline-flex items-center gap-1 text-sm text-copper-600 hover:underline"
                      >
                        {row.office_count ?? 0}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          to={`/login-admin/manageagencies/${row.id}/edit`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-sand-100 text-copper-600 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </Link>
                        {activeView === "active" && (
                          <button
                            type="button"
                            onClick={() => handleDeleteSingle(row.id, row.title || row.name)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export const ManageLocations = () => {
  const [showDeleted, setShowDeleted] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [batchAction, setBatchAction] = useState("");
  const { toast } = useToast();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["locations", showDeleted ? "deleted" : "active"],
    queryFn: () =>
      showDeleted
        ? api.get<ApiResponse<any[]>>("/locations/deleted/list")
        : api.get<ApiResponse<any>>("/locations?per_page=100"),
  });

  const rows = showDeleted
    ? (data?.data ?? [])
    : (data?.data?.data ?? data?.data ?? []);

  const toggleSelect = (id: number) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === rows.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(rows.map((r: any) => r.id)));
    }
  };

  const handleBatch = async () => {
    if (!batchAction || selected.size === 0) return;
    const ids = Array.from(selected);
    const actionLabel = batchAction === "unpublish" ? "unpublish" : "publish";
    if (!confirm(`Are you sure you want to ${actionLabel} the selected jurisdictions?`)) return;

    try {
      await api.post<ApiResponse<any>>("/locations/batch", { ids, action: batchAction });
      toast({ title: `Jurisdictions ${actionLabel}ed`, description: `${ids.length} item(s) ${actionLabel}ed successfully.` });
      setSelected(new Set());
      setBatchAction("");
      refetch();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || `Failed to ${actionLabel} jurisdictions`, variant: "destructive" });
    }
  };

  const handleUnpublishSingle = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to unpublish "${name}"?`)) return;
    try {
      await api.delete<ApiResponse<any>>(`/locations/${id}`);
      toast({ title: "Unpublished", description: `"${name}" has been unpublished.` });
      refetch();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to unpublish", variant: "destructive" });
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="font-serif text-3xl font-medium tracking-tight">Jurisdictions</h1>
            <p className="text-muted-foreground mt-1">Provinces, districts and other jurisdictions.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => { setShowDeleted(!showDeleted); setSelected(new Set()); }}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                showDeleted
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
              }`}
            >
              {showDeleted ? "Published Jurisdictions" : "Unpublished Jurisdictions"}
            </button>
            <Link
              to="/login-admin/managelocations/new"
              className="inline-flex items-center gap-2 bg-gradient-to-b from-copper-500 to-copper-600 text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:from-copper-600 transition-colors"
            >
              <Plus size={16} /> Add jurisdiction
            </Link>
          </div>
        </div>

        {/* Batch actions bar */}
        {!showDeleted && selected.size > 0 && (
          <div className="bg-sand-50 border border-sand-200 rounded-xl p-3 mb-4 flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{selected.size} selected</span>
            <select
              value={batchAction}
              onChange={(e) => setBatchAction(e.target.value)}
              className="h-9 px-3 rounded-lg border border-sand-200 bg-white text-sm"
            >
              <option value="">Select batch action…</option>
              <option value="unpublish">Unpublish</option>
            </select>
            <button
              type="button"
              onClick={handleBatch}
              disabled={!batchAction}
              className="h-9 px-4 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              Apply
            </button>
          </div>
        )}

        {showDeleted && selected.size > 0 && (
          <div className="bg-sand-50 border border-sand-200 rounded-xl p-3 mb-4 flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{selected.size} selected</span>
            <select
              value={batchAction}
              onChange={(e) => setBatchAction(e.target.value)}
              className="h-9 px-3 rounded-lg border border-sand-200 bg-white text-sm"
            >
              <option value="">Select batch action…</option>
              <option value="publish">Publish</option>
            </select>
            <button
              type="button"
              onClick={handleBatch}
              disabled={!batchAction}
              className="h-9 px-4 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              Apply
            </button>
          </div>
        )}

        {/* Table */}
        <div className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-copper-500" />
              <span className="ml-3 text-muted-foreground">Loading jurisdictions…</span>
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {showDeleted ? "No unpublished jurisdictions." : "No jurisdictions found."}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-sand-50 border-b border-sand-200">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={rows.length > 0 && selected.size === rows.length}
                      onChange={toggleAll}
                      className="rounded border-sand-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground w-14">#</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground w-24">Published</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground w-16">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row: any) => (
                  <tr key={row.id} className="border-b border-sand-100 hover:bg-sand-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(row.id)}
                        onChange={() => toggleSelect(row.id)}
                        className="rounded border-sand-300"
                      />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{row.id}</td>
                    <td className="px-4 py-3 font-medium">{row.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.category_name || "—"}</td>
                    <td className="px-4 py-3 text-center">
                      {row.deleted === 0 || row.deleted === false ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600">
                          <Check size={14} />
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-600">
                          <X size={14} />
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          to={`/login-admin/managelocations/${row.id}/edit`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-sand-100 text-copper-600 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </Link>
                        {!showDeleted && (
                          <button
                            type="button"
                            onClick={() => handleUnpublishSingle(row.id, row.name)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                            title="Unpublish"
                          >
                            <EyeOff size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export const ManageIndustries = () => {
  const { data } = useIndustries({ per_page: 100 });
  return (
    <ManageTable
      title="Industries"
      description="Industry classifications used to organise licences."
      newLabel="Add industry"
      columns={[
        { key: "name", label: "Industry", render: (r) => <span className="font-medium">{r.name}</span> },
        { key: "license_count", label: "Licences", render: (r) => <span className="tabular-nums">{r.license_count}</span> },
      ]}
      rows={data?.data ?? []}
    />
  );
};

export const ManageBusinessTypes = () => {
  const { data } = useBusinessTypes({ per_page: 100 });
  return (
    <ManageTable
      title="Business Types"
      description="Legal forms and structures businesses can register under."
      newLabel="Add new Business Type"
      newHref="/login-admin/managebusinesstypes/new"
      columns={[
        { key: "name", label: "Business Type", render: (r) => <span className="font-medium">{r.name}</span> },
        { key: "license_count", label: "Registered", render: (r) => <span className="tabular-nums">{r.license_count}</span> },
      ]}
      rows={data?.data ?? []}
    />
  );
};

export const ManageActivities = () => {
  const { data } = useActivities({ per_page: 100 });
  return (
    <ManageTable
      title="Business Activities"
      description="Economic activities businesses can be licensed to perform."
      newLabel="Add new Business Activity"
      newHref="/login-admin/manageactivities/new"
      columns={[
        { key: "name", label: "Activity", render: (r) => <span className="font-medium">{r.name}</span> },
        { key: "license_count", label: "Linked", render: (r) => <span className="tabular-nums">{r.license_count}</span> },
      ]}
      rows={data?.data ?? []}
    />
  );
};

export const ManageWorkflows = () => (
  <ManageTable
    title="Workflows"
    description="Configure approval stages for licence processing."
    newLabel="Add workflow"
    columns={[
      { key: "name", label: "Workflow" },
      { key: "stages", label: "Stages" },
      { key: "agency", label: "Issuing Authority" },
      { key: "status", label: "Status", render: (r) => statusBadge(r.status) },
    ]}
    rows={[
      { name: "Standard Trading Licence", stages: "Draft → Review → Approved → Published", agency: "LCC", status: "Active" },
      { name: "Tourism Operator Approval", stages: "Draft → Inspection → Approved", agency: "ZTA", status: "Active" },
      { name: "Mining Right Pipeline", stages: "Draft → EIA → Tech Review → Minister → Published", agency: "MMMD", status: "Active" },
    ]}
  />
);

export const ManageRegulations = () => {
  const [activeView, setActiveView] = useState<string>("all");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [batchAction, setBatchAction] = useState("");
  const { toast } = useToast();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["regulations-dashboard", activeView],
    queryFn: () =>
      api.get<ApiResponse<any>>("/regulations/dashboard", {
        view: activeView,
        user_id: 1,
      }),
  });

  const counts = data?.data?.counts ?? {};
  const items = data?.data?.items ?? [];

  const toggleSelect = (id: number) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === items.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map((r: any) => r.id)));
    }
  };

  const handleBatch = async () => {
    if (!batchAction || selected.size === 0) return;
    const ids = Array.from(selected);
    const actionLabel = batchAction === "unpublish" ? "unpublish" : "publish";
    if (!confirm(`Are you sure you want to ${actionLabel} the selected consultations?`)) return;

    try {
      await api.post<ApiResponse<any>>("/regulations/batch", { ids, action: batchAction });
      toast({ title: `Consultations ${actionLabel}ed`, description: `${ids.length} item(s) ${actionLabel}ed successfully.` });
      setSelected(new Set());
      setBatchAction("");
      refetch();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || `Failed to ${actionLabel} consultations`, variant: "destructive" });
    }
  };

  const handleUnpublishSingle = async (id: number, title: string) => {
    if (!confirm(`Are you sure you want to unpublish "${title}"?`)) return;
    try {
      await api.delete<ApiResponse<any>>(`/regulations/${id}`);
      toast({ title: "Unpublished", description: `"${title}" has been unpublished.` });
      refetch();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to unpublish", variant: "destructive" });
    }
  };

  const tabs = [
    { key: "all", label: "All", count: counts.all ?? 0 },
    { key: "open", label: "Open", count: counts.open ?? 0 },
    { key: "complete", label: "Completed", count: counts.complete ?? 0 },
    { key: "internal", label: "Internal", count: counts.internal ?? 0 },
    { key: "closing", label: "Closing Soon", count: 0 },
    { key: "unpublished", label: "Unpublished", count: counts.unpublished ?? 0 },
  ];

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    try {
      const dt = new Date(d);
      return dt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    } catch { return d; }
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="font-serif text-3xl font-medium tracking-tight">Consultations</h1>
            <p className="text-muted-foreground mt-1">Manage public consultations and feedback on regulations.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login-admin/manageregulations/new"
              className="inline-flex items-center gap-2 bg-gradient-to-b from-copper-500 to-copper-600 text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:from-copper-600 transition-colors"
            >
              <Plus size={16} /> Add Consultation
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 bg-sand-100 rounded-xl p-1 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => { setActiveView(tab.key); setSelected(new Set()); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeView === tab.key
                  ? "bg-white text-copper-600 shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-sand-200/50"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeView === tab.key ? "bg-copper-100 text-copper-700" : "bg-sand-200 text-sand-700"}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Batch actions */}
        {selected.size > 0 && (
          <div className="bg-sand-50 border border-sand-200 rounded-xl p-3 mb-4 flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{selected.size} selected</span>
            <select
              value={batchAction}
              onChange={(e) => setBatchAction(e.target.value)}
              className="h-9 px-3 rounded-lg border border-sand-200 bg-white text-sm"
            >
              <option value="">Select batch action…</option>
              {activeView === "unpublished" ? (
                <option value="publish">Publish</option>
              ) : (
                <option value="unpublish">Unpublish</option>
              )}
            </select>
            <button
              type="button"
              onClick={handleBatch}
              disabled={!batchAction}
              className={`h-9 px-4 rounded-lg text-white text-sm font-medium disabled:opacity-50 transition-colors ${
                batchAction === "publish" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
              }`}
            >
              Apply
            </button>
          </div>
        )}

        {/* Table */}
        <div className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-copper-500" />
              <span className="ml-3 text-muted-foreground">Loading consultations…</span>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No consultations found for this view.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-sand-50 border-b border-sand-200">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={items.length > 0 && selected.size === items.length}
                      onChange={toggleAll}
                      className="rounded border-sand-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground w-14">#</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Issuing Authority</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Closing Date</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground w-20">Published</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground w-20">Comments</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground w-16">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row: any) => (
                  <tr key={row.id} className="border-b border-sand-100 hover:bg-sand-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(row.id)}
                        onChange={() => toggleSelect(row.id)}
                        className="rounded border-sand-300"
                      />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{row.id}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{row.title}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{row.agency_name || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(row.closing_date)}</td>
                    <td className="px-4 py-3 text-center">
                      {row.published ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600">
                          <Check size={14} />
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-600">
                          <X size={14} />
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Link
                        to={`/regulations/${row.id}/comments`}
                        className="inline-flex items-center gap-1 text-sm text-copper-600 hover:underline"
                      >
                        {row.comment_count ?? 0} <MessageSquare size={12} />
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          to={`/login-admin/manageregulations/${row.id}/edit`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-sand-100 text-copper-600 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </Link>
                        {activeView !== "unpublished" && (
                          <button
                            type="button"
                            onClick={() => handleUnpublishSingle(row.id, row.title)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                            title="Unpublish"
                          >
                            <EyeOff size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export const ManageComments = () => {
  const [activeView, setActiveView] = useState<string>("all");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [batchAction, setBatchAction] = useState("");
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");
  const { toast } = useToast();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-comments", activeView, page, q],
    queryFn: () =>
      api.get<ApiResponse<any>>("/regulations/admin-comments", {
        view: activeView,
        page: String(page),
        limit: "25",
        q,
      }),
  });

  const counts = data?.data?.counts ?? {};
  const comments: any[] = data?.data?.comments ?? [];
  const pagination = data?.data?.pagination ?? { page: 1, total: 0, total_pages: 1, limit: 25 };

  const tabs = [
    { key: "all", label: "All", count: counts.all ?? 0 },
    { key: "pending", label: "Pending Review", count: counts.pending ?? 0 },
    { key: "approved", label: "Approved", count: counts.approved ?? 0 },
    { key: "abusive", label: "Abusive", count: counts.abusive ?? 0 },
  ];

  const toggleSelect = (id: number) => {
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleAll = () => {
    selected.size === comments.length ? setSelected(new Set()) : setSelected(new Set(comments.map((c: any) => c.id)));
  };

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setQ(searchInput); setPage(1); setSelected(new Set()); };

  const handleAction = async (commentId: number, action: string) => {
    try {
      await api.post<ApiResponse<any>>(`/regulations/admin-comments/${commentId}/${action}`, {});
      toast({ title: "Success", description: `Comment ${action === "approve" ? "approved" : action === "reject" ? "rejected" : "flagged"}.` });
      refetch();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Action failed", variant: "destructive" });
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!confirm("Delete this comment?")) return;
    try {
      await api.delete<ApiResponse<any>>(`/regulations/admin-comments/${commentId}`);
      toast({ title: "Deleted", description: "Comment deleted." });
      refetch();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Delete failed", variant: "destructive" });
    }
  };

  const handleBatch = async () => {
    if (!batchAction || selected.size === 0) return;
    if (!confirm(`${batchAction} ${selected.size} comment(s)?`)) return;
    try {
      const result = await api.post<ApiResponse<any>>("/regulations/admin-comments/batch", {
        ids: Array.from(selected), action: batchAction,
      });
      toast({ title: "Success", description: result.data?.message || "Batch action completed." });
      setSelected(new Set()); setBatchAction(""); refetch();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Batch action failed", variant: "destructive" });
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    try { return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); } catch { return d; }
  };

  const commentStatusBadge = (c: any) => {
    if (c.check_abusive) return <span className="text-xs px-2 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">Abusive</span>;
    if (c.pending_review) return <span className="text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Pending</span>;
    if (c.publish) return <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Approved</span>;
    return <span className="text-xs px-2 py-1 rounded-full bg-stone-100 text-stone-700 border border-stone-200">Hidden</span>;
  };

  const pageNumbers = () => {
    const pages: number[] = [];
    const total = pagination.total_pages;
    const current = pagination.page;
    for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) pages.push(i);
    return pages;
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="font-serif text-3xl font-medium tracking-tight">Moderate Comments</h1>
            <p className="text-muted-foreground mt-1">Review, approve or reject public submissions on consultations.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 bg-sand-100 rounded-xl p-1 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => { setActiveView(tab.key); setPage(1); setSelected(new Set()); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeView === tab.key ? "bg-white text-copper-600 shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-sand-200/50"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeView === tab.key ? "bg-copper-100 text-copper-700" : tab.key === "abusive" ? "bg-red-100 text-red-700" : tab.key === "pending" ? "bg-amber-100 text-amber-700" : "bg-sand-200 text-sand-700"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Batch + Search */}
        <div className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-3 p-4 border-b border-sand-200 flex-wrap">
            <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 bg-sand-100 rounded-full px-4 h-10 max-w-md">
              <Search size={14} className="text-muted-foreground" />
              <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search comments…" className="flex-1 bg-transparent outline-none text-sm" />
              {q && <button type="button" onClick={() => { setQ(""); setSearchInput(""); setPage(1); }} className="text-muted-foreground hover:text-foreground"><X size={14} /></button>}
            </form>

            {selected.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">{selected.size} selected</span>
                <select value={batchAction} onChange={(e) => setBatchAction(e.target.value)} className="text-sm border border-sand-200 rounded-lg px-2 h-9 bg-white">
                  <option value="">Batch action…</option>
                  <option value="approve">Approve</option>
                  <option value="reject">Reject</option>
                  <option value="delete">Delete</option>
                </select>
                <button onClick={handleBatch} disabled={!batchAction} className="inline-flex items-center gap-1.5 text-sm bg-copper-500 text-white rounded-lg px-3 h-9 font-medium disabled:opacity-50 hover:bg-copper-600 transition-colors">
                  <Check size={14} /> Apply
                </button>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={20} className="animate-spin text-copper-500" />
              <span className="ml-3 text-sm text-muted-foreground">Loading comments…</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground bg-sand-100/50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium w-10">
                      <input type="checkbox" className="rounded border-sand-200" checked={comments.length > 0 && selected.size === comments.length} onChange={toggleAll} />
                    </th>
                    <th className="text-left py-3 px-4 font-medium w-14">#</th>
                    <th className="text-left py-3 px-4 font-medium">Comment</th>
                    <th className="text-left py-3 px-4 font-medium">Consultation</th>
                    <th className="text-left py-3 px-4 font-medium">Date</th>
                    <th className="text-center py-3 px-4 font-medium w-20">Status</th>
                    <th className="text-right py-3 px-4 font-medium w-32">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {comments.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">{q ? "No comments match your search." : "No comments in this view."}</td></tr>
                  ) : (
                    comments.map((c: any) => (
                      <tr key={c.id} className={`border-t border-sand-100 hover:bg-sand-100/40 ${selected.has(c.id) ? "bg-copper-50/30" : ""}`}>
                        <td className="py-3 px-4">
                          <input type="checkbox" className="rounded border-sand-200" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)} />
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{c.id}</td>
                        <td className="py-3 px-4 max-w-xs">
                          <div className="line-clamp-2 text-sm">{c.comment}</div>
                          {c.upvote_count > 0 && <div className="text-xs text-muted-foreground mt-1">👍 {c.upvote_count} likes</div>}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm font-medium truncate max-w-[200px]">{c.regulation_title || "—"}</div>
                          <div className="text-xs text-muted-foreground">{c.agency_name || ""}</div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-xs">{formatDate(c.created_at)}</td>
                        <td className="py-3 px-4 text-center">{commentStatusBadge(c)}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            {(c.pending_review || c.check_abusive) && (
                              <button onClick={() => handleAction(c.id, "approve")} className="p-1.5 rounded-md hover:bg-emerald-50 text-emerald-600" title="Approve"><Check size={14} /></button>
                            )}
                            {(c.pending_review || c.publish) && !c.check_abusive && (
                              <button onClick={() => handleAction(c.id, "reject")} className="p-1.5 rounded-md hover:bg-amber-50 text-amber-600" title="Reject"><EyeOff size={14} /></button>
                            )}
                            {!c.check_abusive && (
                              <button onClick={() => handleAction(c.id, "flag")} className="p-1.5 rounded-md hover:bg-red-50 text-red-600" title="Flag abusive"><Filter size={14} /></button>
                            )}
                            <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-md hover:bg-red-50 text-red-600" title="Delete"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t border-sand-200 text-sm text-muted-foreground">
            <span>
              Showing {comments.length > 0 ? ((pagination.page - 1) * pagination.limit) + 1 : 0}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} comments
            </span>
            {pagination.total_pages > 1 && (
              <div className="flex items-center gap-1">
                <button onClick={() => { setPage((p) => Math.max(1, p - 1)); setSelected(new Set()); }} disabled={pagination.page <= 1} className="px-3 py-1.5 rounded-md border border-sand-200 hover:bg-sand-100 disabled:opacity-40 disabled:cursor-not-allowed">Previous</button>
                {pageNumbers().map((p) => (
                  <button key={p} onClick={() => { setPage(p); setSelected(new Set()); }} className={`px-3 py-1.5 rounded-md ${p === pagination.page ? "bg-copper-50 text-copper-600 font-medium" : "hover:bg-sand-100"}`}>{p}</button>
                ))}
                <button onClick={() => { setPage((p) => Math.min(pagination.total_pages, p + 1)); setSelected(new Set()); }} disabled={pagination.page >= pagination.total_pages} className="px-3 py-1.5 rounded-md border border-sand-200 hover:bg-sand-100 disabled:opacity-40 disabled:cursor-not-allowed">Next</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export const ManageNews = () => {
  const { data } = useNewsList({ per_page: 100 });
  const rows = (data?.data ?? []).map((n) => ({
    ...n,
    date: new Date(n.created).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    status: n.published ? 'Published' : 'Draft',
  }));
  return (
    <ManageTable
      title="News & Articles"
      description="Publish news, announcements and updates."
      newLabel="Add article"
      columns={[
        { key: "title", label: "Title", render: (r) => <span className="font-medium">{r.title}</span> },
        { key: "date", label: "Published" },
        { key: "status", label: "Status", render: (r) => statusBadge(r.status) },
      ]}
      rows={rows}
    />
  );
};

export const ManagePages = () => (
  <ManageTable
    title="Pages"
    description="Static content pages for the public site."
    newLabel="Add page"
    columns={[
      { key: "title", label: "Page" },
      { key: "slug", label: "Slug" },
      { key: "updated", label: "Last updated" },
      { key: "status", label: "Status", render: (r) => statusBadge(r.status) },
    ]}
    rows={[
      { title: "About eRegistry", slug: "about", updated: "12 Apr 2026", status: "Published" },
      { title: "Privacy Policy", slug: "privacy", updated: "01 Mar 2026", status: "Published" },
      { title: "Terms of Service", slug: "terms", updated: "01 Mar 2026", status: "Published" },
      { title: "Accessibility statement", slug: "accessibility", updated: "20 Feb 2026", status: "Draft" },
    ]}
  />
);

export const ManageFAQs = () => {
  const { data } = useFAQs();
  const rows = (data?.data ?? []).map((f) => ({ ...f, q: f.question, a: f.answer }));
  return (
    <ManageTable
      title="FAQs"
      description="Questions and answers shown in the help centre."
      newLabel="Add FAQ"
      columns={[
        { key: "q", label: "Question", render: (r) => <span className="font-medium">{r.q}</span> },
        { key: "a", label: "Answer", render: (r) => <span className="text-muted-foreground line-clamp-1">{r.a}</span> },
      ]}
      rows={rows}
    />
  );
};

export const ManageBanners = () => (
  <ManageTable
    title="Banners"
    description="Promotional banners displayed on the homepage."
    newLabel="Add banner"
    columns={[
      { key: "title", label: "Banner" },
      { key: "placement", label: "Placement" },
      { key: "starts", label: "Starts" },
      { key: "status", label: "Status", render: (r) => statusBadge(r.status) },
    ]}
    rows={[
      { title: "Single-window registration launch", placement: "Homepage hero", starts: "12 Apr 2026", status: "Published" },
      { title: "SEZ fast-track campaign", placement: "Sidebar", starts: "02 Apr 2026", status: "Draft" },
    ]}
  />
);

export const ManagePolicy = () => (
  <ManageTable
    title="Policies"
    description="Manage policy and legal pages."
    newLabel="Add policy"
    columns={[
      { key: "title", label: "Policy" },
      { key: "version", label: "Version" },
      { key: "updated", label: "Last updated" },
      { key: "status", label: "Status", render: (r) => statusBadge(r.status) },
    ]}
    rows={[
      { title: "Privacy Policy", version: "v3.1", updated: "01 Mar 2026", status: "Published" },
      { title: "Terms of Service", version: "v2.4", updated: "01 Mar 2026", status: "Published" },
      { title: "Cookie Policy", version: "v1.0", updated: "12 Jan 2026", status: "Published" },
    ]}
  />
);

export const ManageFeedback = () => (
  <ManageTable
    title="Feedback"
    description="Messages submitted through the contact form."
    columns={[
      { key: "name", label: "From" },
      { key: "email", label: "Email" },
      { key: "subject", label: "Subject" },
      { key: "received", label: "Received" },
      { key: "status", label: "Status", render: (r) => statusBadge(r.status) },
    ]}
    rows={[
      { name: "Mwansa Banda", email: "mw@example.com", subject: "Issue submitting tour operator licence", received: "2 hrs ago", status: "Pending" },
      { name: "Chola Mulenga", email: "ch@example.com", subject: "Question about EIA timelines", received: "1 day ago", status: "Approved" },
      { name: "Joseph Phiri", email: "jp@example.com", subject: "Where do I find Form L-1?", received: "3 days ago", status: "Closed" },
    ]}
  />
);

export const ManageUsers = () => (
  <ManageTable
    title="Users"
    description="Manage portal accounts and permissions."
    newLabel="Add User"
    newHref="/login-admin/manageusers/new"
    columns={[
      { key: "name", label: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
      { key: "email", label: "Email" },
      { key: "role", label: "Role" },
      { key: "agency", label: "Issuing Authority" },
      { key: "status", label: "Status", render: (r) => statusBadge(r.status) },
    ]}
    rows={[
      { name: "Joseph Mwale", email: "j.mwale@gov.zm", role: "Super Admin", agency: "—", status: "Active" },
      { name: "Chola Mulenga", email: "c.mulenga@zta.org.zm", role: "Issuing Authority Editor", agency: "ZTA", status: "Active" },
      { name: "Nalukui Imbwae", email: "n.imbwae@zema.org.zm", role: "Moderator", agency: "ZEMA", status: "Active" },
      { name: "Mwansa Banda", email: "m.banda@gov.zm", role: "Reviewer", agency: "LCC", status: "Pending" },
    ]}
  />
);

export const ManageGroups = () => (
  <ManageTable
    title="Roles & Permissions"
    description="Define groups and granular permissions."
    newLabel="Add role"
    columns={[
      { key: "name", label: "Role", render: (r) => <span className="font-medium">{r.name}</span> },
      { key: "permissions", label: "Permissions" },
      { key: "members", label: "Members", render: (r) => <span className="tabular-nums">{r.members}</span> },
    ]}
    rows={[
      { name: "Super Admin", permissions: "All", members: 4 },
      { name: "Issuing Authority Editor", permissions: "LICENSE_MANAGE, NEWS_MANAGE", members: 28 },
      { name: "Moderator", permissions: "MODERATE_COMMENTS", members: 12 },
      { name: "Reviewer", permissions: "LICENSE_REVIEW", members: 36 },
    ]}
  />
);

export const RegulationsDashboard = () => {
  const { data: adminData, isLoading } = useQuery({
    queryKey: ['regulation-admin-stats'],
    queryFn: () => api.get<ApiResponse<any>>('/regulations/admin-stats'),
  });
  const stats = adminData?.data;
  const regStats = stats?.regulation_stats ?? {};
  const commentStats = stats?.comment_stats ?? {};
  const perAgency: any[] = stats?.per_agency ?? [];
  const recentConsultations: any[] = stats?.recent_consultations ?? [];
  const closingDays = stats?.closing_days ?? 7;

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    try { return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); } catch { return d; }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Notice & Comment</div>
        <h1 className="font-serif text-3xl md:text-4xl font-medium tracking-tight">
          Welcome to your Notice and Comment Admin Portal
        </h1>
        <p className="text-muted-foreground mt-1">Manage consultations, track statistics and moderate comments.</p>

        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/login-admin/manageregulations" className="bg-gradient-to-b from-copper-500 to-copper-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:from-copper-600 transition-colors">
            Manage Consultations
          </Link>
          <Link to="/login-admin/manageregulations/new" className="bg-gradient-to-b from-emerald-500 to-emerald-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:from-emerald-600 transition-colors inline-flex items-center gap-2">
            <Plus size={14} /> Add New Consultation
          </Link>
          <Link to="/login-admin/managecomments" className="border border-sand-200 rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-sand-100 transition-colors inline-flex items-center gap-2">
            <MessageSquare size={14} /> Moderate Comments
            {(commentStats.pending ?? 0) > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold tabular-nums">{commentStats.pending}</span>
            )}
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-copper-500" />
          <span className="ml-3 text-muted-foreground">Loading dashboard…</span>
        </div>
      ) : (
        <>
          {/* Main grid: stats left, recent consultations right */}
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* Regulation Statistics Table */}
            <div className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-sand-200 bg-sand-50">
                <h2 className="font-serif text-lg font-medium flex items-center gap-2">
                  <FileText size={18} className="text-copper-600" /> Regulation Statistics
                </h2>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-sand-100">
                    <th className="text-left px-6 py-2.5 text-xs uppercase tracking-wider text-muted-foreground font-medium">Stats</th>
                    <th className="text-left px-6 py-2.5 text-xs uppercase tracking-wider text-muted-foreground font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { count: regStats.all ?? 0, label: "All Consultations", link: "/login-admin/manageregulations" },
                    { count: regStats.published ?? 0, label: "Published Consultations", link: "/login-admin/manageregulations" },
                    { count: regStats.unpublished ?? 0, label: "Unpublished Consultations", link: "/login-admin/manageregulations" },
                    { count: regStats.open ?? 0, label: "Ongoing Public Consultations", link: "/login-admin/manageregulations" },
                    { count: regStats.closed ?? 0, label: "Completed Public Consultations", link: "/login-admin/manageregulations" },
                    { count: regStats.due_soon ?? 0, label: `Consultations Due in ${closingDays} Days`, link: "/login-admin/manageregulations" },
                    { count: regStats.internal ?? 0, label: "Internal Consultations", link: "/login-admin/manageregulations" },
                    { count: regStats.public ?? 0, label: "Public Consultations", link: "#" },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-sand-100 last:border-0 hover:bg-sand-50/50 transition-colors">
                      <td className="px-6 py-3">
                        <span className="inline-flex items-center justify-center min-w-[2.5rem] h-8 px-2 rounded-lg bg-copper-50 text-copper-700 font-semibold tabular-nums text-sm">
                          {row.count}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        {row.link !== "#" ? (
                          <Link to={row.link} className="text-copper-600 hover:underline font-medium">{row.label}</Link>
                        ) : (
                          <span className="text-foreground">{row.label}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* New Consultations (recent) */}
            <div className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-sand-200 bg-sand-50">
                <h2 className="font-serif text-lg font-medium flex items-center gap-2">
                  <Calendar size={18} className="text-copper-600" /> New Consultations
                </h2>
              </div>
              <div className="divide-y divide-sand-100">
                {recentConsultations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">No consultations yet.</div>
                ) : (
                  recentConsultations.map((r: any) => {
                    const closing = r.closing_date ? new Date(r.closing_date) : null;
                    const daysLeft = closing ? Math.max(0, Math.ceil((closing.getTime() - Date.now()) / 86400000)) : null;
                    return (
                      <div key={r.id} className="px-6 py-4 hover:bg-sand-50/50 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <Link to={`/login-admin/manageregulations/${r.id}/edit`} className="font-medium text-sm text-copper-600 hover:underline block truncate">
                              {r.title}
                            </Link>
                            <div className="text-xs text-muted-foreground mt-1">
                              {r.agency_name || "Unknown Agency"}
                              {r.closing_date && <span> · Closing: {formatDate(r.closing_date)}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {r.published ? (
                              <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Published</span>
                            ) : (
                              <span className="text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Draft</span>
                            )}
                            {daysLeft !== null && daysLeft <= closingDays && daysLeft > 0 && (
                              <span className="text-xs px-2 py-1 rounded-full bg-red-50 text-red-600 border border-red-200">{daysLeft}d left</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Second row: Comment Stats + Per Agency */}
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* Comment Statistics */}
            <div className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-sand-200 bg-sand-50 flex items-center justify-between">
                <h2 className="font-serif text-lg font-medium flex items-center gap-2">
                  <MessageSquare size={18} className="text-copper-600" /> Comments Stats
                </h2>
                <span className="text-sm font-semibold text-copper-600 tabular-nums">{commentStats.total ?? 0}</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-sand-100">
                    <th className="text-left px-6 py-2.5 text-xs uppercase tracking-wider text-muted-foreground font-medium">Description</th>
                    <th className="text-center px-6 py-2.5 text-xs uppercase tracking-wider text-muted-foreground font-medium w-20">Number</th>
                    <th className="text-center px-6 py-2.5 text-xs uppercase tracking-wider text-muted-foreground font-medium w-16">Act</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-sand-100 hover:bg-sand-50/50 transition-colors">
                    <td className="px-6 py-3 font-medium">Consultation With Highest Comments</td>
                    <td className="px-6 py-3 text-center tabular-nums font-semibold">{commentStats.highest_comments?.comment_count ?? 0}</td>
                    <td className="px-6 py-3 text-center">
                      {commentStats.highest_comments && (
                        <Link to={`/login-admin/manageregulations/${commentStats.highest_comments.id}/edit`} className="text-copper-600 hover:text-copper-800" title={commentStats.highest_comments.title}>
                          <Pencil size={14} />
                        </Link>
                      )}
                    </td>
                  </tr>
                  <tr className="border-b border-sand-100 hover:bg-sand-50/50 transition-colors">
                    <td className="px-6 py-3 font-medium">Comment With Highest Engagements</td>
                    <td className="px-6 py-3 text-center tabular-nums font-semibold">{commentStats.highest_engagement?.upvote_count ?? 0}</td>
                    <td className="px-6 py-3 text-center">
                      {commentStats.highest_engagement && (
                        <Link to="/login-admin/managecomments" className="text-copper-600 hover:text-copper-800">
                          <Pencil size={14} />
                        </Link>
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-sand-50/50 transition-colors">
                    <td className="px-6 py-3 font-medium">Abusive Comments</td>
                    <td className="px-6 py-3 text-center tabular-nums font-semibold">{commentStats.abusive ?? 0}</td>
                    <td className="px-6 py-3 text-center">
                      <Link to="/login-admin/managecomments" className="text-copper-600 hover:text-copper-800">
                        <Pencil size={14} />
                      </Link>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Consultations Per Agency */}
            <div className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-sand-200 bg-sand-50 flex items-center justify-between">
                <h2 className="font-serif text-lg font-medium flex items-center gap-2">
                  <Activity size={18} className="text-copper-600" /> Consultations Per Agency
                </h2>
                <span className="text-sm font-semibold text-copper-600 tabular-nums">+{perAgency.length}</span>
              </div>
              <div className="max-h-[320px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b border-sand-100">
                      <th className="text-left px-6 py-2.5 text-xs uppercase tracking-wider text-muted-foreground font-medium">Agency</th>
                      <th className="text-center px-6 py-2.5 text-xs uppercase tracking-wider text-muted-foreground font-medium w-20">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {perAgency.length === 0 ? (
                      <tr><td colSpan={2} className="text-center py-8 text-muted-foreground">No data available.</td></tr>
                    ) : (
                      perAgency.map((a: any) => (
                        <tr key={a.id} className="border-b border-sand-100 last:border-0 hover:bg-sand-50/50 transition-colors">
                          <td className="px-6 py-3 font-medium">{a.name}</td>
                          <td className="px-6 py-3 text-center">
                            <span className="inline-flex items-center justify-center min-w-[2rem] h-7 px-2 rounded-full bg-sand-100 text-earth-900 font-semibold tabular-nums text-xs">
                              {a.regulation_count}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </>
      )}
    </AdminLayout>
  );
};

export const AdminSearch = () => (
  <AdminLayout>
    <div className="mb-8">
      <h1 className="font-serif text-3xl font-medium tracking-tight">Search</h1>
      <p className="text-muted-foreground mt-1">Search across licences, issuing authorities, users, news and more.</p>
    </div>
    <div className="bg-white border border-sand-200 rounded-2xl p-6">
      <input placeholder="Type to search…" className="w-full text-lg outline-none border-b border-sand-200 pb-3" />
      <p className="text-sm text-muted-foreground mt-6">Start typing to see results across the registry.</p>
    </div>
  </AdminLayout>
);

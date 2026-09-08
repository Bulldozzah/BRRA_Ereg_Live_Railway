import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Loader2, AlertCircle, Building2 } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/services/api";
import type { ApiResponse } from "@/types/database";

interface Category {
  id: number;
  name: string;
}

const JurisdictionForm = () => {
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id: string }>();
  const isEditMode = !!editId;
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [parent, setParent] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch categories
  useEffect(() => {
    api.get<ApiResponse<Category[]>>("/locations/categories/all")
      .then((r) => {
        if (r.data) setCategories(r.data);
      })
      .catch(() => {});
  }, []);

  // Load existing jurisdiction data in edit mode
  useEffect(() => {
    if (!editId) return;
    setLoading(true);
    api.get<ApiResponse<any>>(`/locations/${editId}`)
      .then((r) => {
        const d = r.data;
        if (!d) return;
        setName(d.name || "");
        setParent(d.parent ? String(d.parent) : "");
      })
      .catch((err) => {
        toast({ title: "Error", description: "Failed to load jurisdiction: " + err.message, variant: "destructive" });
      })
      .finally(() => setLoading(false));
  }, [editId]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Jurisdiction name is required";
    else if (name.trim().length < 2) e.name = "Name must be at least 2 characters";
    else if (name.trim().length > 250) e.name = "Name cannot exceed 250 characters";
    if (!parent) e.parent = "Parent category is required";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validate();
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      toast({ title: "Validation Error", description: "Please fix the highlighted fields.", variant: "destructive" });
      return;
    }
    setErrors({});
    setSaving(true);

    try {
      if (isEditMode) {
        await api.put<ApiResponse<any>>(`/locations/${editId}`, { name: name.trim(), parent: Number(parent) });
        toast({ title: "Jurisdiction updated", description: `"${name}" has been updated successfully.` });
        navigate("/login-admin/managelocations");
      } else {
        await api.post<ApiResponse<any>>("/locations", { name: name.trim(), parent: Number(parent) });
        toast({ title: "Jurisdiction created", description: `"${name}" has been added successfully.` });
        navigate("/login-admin/managelocations");
      }
    } catch (err: any) {
      const msg = err.message || "Failed to save jurisdiction";
      toast({ title: "Error", description: msg, variant: "destructive" });
      if (msg.includes("already exists")) setErrors({ name: "A jurisdiction with this name already exists" });
    } finally {
      setSaving(false);
    }
  };

  const inputCls = (field?: string) =>
    `w-full h-11 px-3 rounded-lg border bg-white outline-none text-sm transition-colors ${
      field && errors[field]
        ? "border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/20"
        : "border-sand-200 focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20"
    }`;

  return (
    <AdminLayout>
      <div className="max-w-xl mx-auto">
        <Link
          to="/login-admin/managelocations"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft size={14} /> Back to Jurisdictions
        </Link>

        <div className="mb-6">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
            {isEditMode ? "Edit Jurisdiction" : "Add New Jurisdiction"}
          </div>
          <h1 className="font-serif text-3xl font-medium tracking-tight">
            {isEditMode ? "Edit Jurisdiction" : "Add New Jurisdiction"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEditMode ? "Update the jurisdiction details below." : "Create a new jurisdiction for license management."}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-copper-500" />
            <span className="ml-3 text-muted-foreground">Loading jurisdiction data…</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white border border-sand-200 rounded-2xl p-6 md:p-8 space-y-6">
            <div>
              <label className="text-sm font-medium block mb-1.5">
                Name <span className="text-copper-600">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Lusaka, Copperbelt Province, Ndola District"
                className={inputCls("name")}
              />
              {errors.name && (
                <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.name}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium block mb-1.5">
                Parent Category <span className="text-copper-600">*</span>
              </label>
              <select
                value={parent}
                onChange={(e) => setParent(e.target.value)}
                className={inputCls("parent")}
              >
                <option value="">Select parent category…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.parent && (
                <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.parent}
                </p>
              )}
            </div>

            <div className="border-t border-sand-200 pt-6 flex items-center justify-between gap-3">
              <Link
                to="/login-admin/managelocations"
                className="inline-flex items-center gap-2 border border-sand-200 rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-sand-100 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 bg-gradient-to-b from-copper-500 to-copper-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:from-copper-600 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {isEditMode ? "Update Jurisdiction" : "Create Jurisdiction"}
              </button>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
};

export default JurisdictionForm;

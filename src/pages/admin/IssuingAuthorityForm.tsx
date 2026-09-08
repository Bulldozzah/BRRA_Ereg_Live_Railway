import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Upload, X, AlertCircle, Loader2, ArrowRight, ArrowRightFromLine, User, Plus, Trash2 } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useLocations } from "@/hooks/use-locations";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/services/api";
import { agencyService } from "@/services/agencies";
import type { ApiResponse } from "@/types/database";

interface Form {
  name: string; abbreviation: string; fax: string; address: string;
  telephone: string; email: string; website: string; workingHours: string;
  postalAddress: string; latitude: string; longitude: string;
  businessNo: string; location: string;
}

interface Office {
  id?: number;
  title: string; address: string; telephone: string; email: string;
  fax: string; latitude: string; longitude: string;
  map_scan: string; business_no: string; location_id: string;
}

const emptyOffice: Office = {
  title: "", address: "", telephone: "", email: "",
  fax: "", latitude: "", longitude: "",
  map_scan: "", business_no: "", location_id: "",
};

const empty: Form = {
  name: "", abbreviation: "", fax: "", address: "",
  telephone: "", email: "", website: "", workingHours: "",
  postalAddress: "", latitude: "", longitude: "",
  businessNo: "", location: "",
};

const IssuingAuthorityForm = () => {
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id: string }>();
  const isEditMode = !!editId;
  const { toast } = useToast();

  const { data: locData } = useLocations({ per_page: 100, order_by: "name", order_dir: "ASC" });
  const locations = (locData?.data ?? []).map((l) => ({ id: String(l.id), name: l.name }));

  const [form, setForm] = useState<Form>(empty);
  const [mapScan, setMapScan] = useState<File | null>(null);
  const [mapScanName, setMapScanName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditMode);
  const [allUsers, setAllUsers] = useState<{ id: number; firstname: string; lastname: string; email: string }[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);

  // Fetch admin users
  useEffect(() => {
    api.get<ApiResponse<any[]>>('/users?role=admin&per_page=200')
      .then((r) => {
        if (r.data) setAllUsers(r.data);
      })
      .catch(() => {
        // Fallback empty
      });
  }, []);

  // Load existing data in edit mode
  useEffect(() => {
    if (!editId) return;
    setLoading(true);
    agencyService.getById(editId)
      .then((r) => {
        const d = r.data;
        if (!d) return;
        setForm({
          name: d.title || d.name || "",
          abbreviation: d.acronym || "",
          fax: d.fax || "",
          address: d.address || "",
          telephone: d.telephone || "",
          email: d.email || "",
          website: d.website || "",
          workingHours: d.hours || "",
          postalAddress: d.postal_address || "",
          latitude: d.latitude != null ? String(d.latitude) : "",
          longitude: d.longitude != null ? String(d.longitude) : "",
          businessNo: d.business_no || "",
          location: d.location_id ? String(d.location_id) : "",
        });
        setMapScanName(d.map_scan || "");
        if (d.users) setSelectedUsers(d.users.map((u: any) => Number(u.id)));
        if (d.offices && Array.isArray(d.offices)) {
          setOffices(d.offices.map((o: any) => ({
            id: o.id,
            title: o.title || o.name || "",
            address: o.address || "",
            telephone: o.telephone || "",
            email: o.email || "",
            fax: o.fax || "",
            latitude: o.latitude != null ? String(o.latitude) : "",
            longitude: o.longitude != null ? String(o.longitude) : "",
            map_scan: o.map_scan || "",
            business_no: o.business_no || "",
            location_id: o.location_id ? String(o.location_id) : "",
          })));
        }
      })
      .catch((err) => {
        toast({ title: "Error", description: "Failed to load issuing authority: " + err.message, variant: "destructive" });
      })
      .finally(() => setLoading(false));
  }, [editId]);

  const setField = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleUser = (id: number) =>
    setSelectedUsers((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const validate = () => {
    const next: typeof errors = {};
    const required: (keyof Form)[] = ["name", "address", "telephone", "email", "website", "workingHours", "postalAddress", "location"];
    required.forEach((k) => { if (!form[k].trim()) next[k] = "Required"; });
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Invalid email";
    if (form.website && !/^https?:\/\/.+/i.test(form.website)) next.website = "Must start with http:// or https://";
    if (form.latitude && isNaN(Number(form.latitude))) next.latitude = "Must be a number";
    if (form.longitude && isNaN(Number(form.longitude))) next.longitude = "Must be a number";
    if (form.name.trim().length < 2) next.name = "Must be at least 2 characters";
    if (form.name.trim().length > 250) next.name = "Cannot exceed 250 characters";
    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length) {
      toast({ title: "Validation Error", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    setSaving(true);

    try {
      const payload: Record<string, any> = {
        title: form.name.trim(),
        acronym: form.abbreviation || null,
        fax: form.fax || null,
        address: form.address.trim(),
        telephone: form.telephone.trim(),
        email: form.email.trim(),
        website: form.website.trim(),
        hours: form.workingHours.trim(),
        postal_address: form.postalAddress.trim(),
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        business_no: form.businessNo || null,
        location_id: Number(form.location),
        user_ids: selectedUsers,
        offices: offices.map((o) => ({
          ...(o.id ? { id: o.id } : {}),
          title: o.title || null,
          address: o.address || null,
          telephone: o.telephone || null,
          email: o.email || null,
          fax: o.fax || null,
          latitude: o.latitude ? parseFloat(o.latitude) : null,
          longitude: o.longitude ? parseFloat(o.longitude) : null,
          map_scan: o.map_scan || null,
          business_no: o.business_no || null,
          location_id: o.location_id ? Number(o.location_id) : null,
        })),
      };

      if (isEditMode) {
        await agencyService.update(editId, payload);
        toast({ title: "Issuing Authority updated", description: `"${form.name.trim()}" has been updated.` });
      } else {
        await agencyService.create(payload);
        toast({ title: "Issuing Authority created", description: `"${form.name.trim()}" has been added.` });
      }
      navigate("/login-admin/manageagencies");
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to save", variant: "destructive" });
      if (err.message?.includes("already exists")) {
        setErrors((prev) => ({ ...prev, name: err.message }));
      }
    } finally {
      setSaving(false);
    }
  };

  const inputCls = (field: keyof Form) =>
    `w-full h-11 px-3 rounded-lg border bg-white outline-none text-sm transition-colors ${
      errors[field]
        ? "border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/20"
        : "border-sand-200 focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20"
    }`;

  const Field = ({ label, required, field, type = "text", placeholder }: {
    label: string; required?: boolean; field: keyof Form; type?: string; placeholder?: string;
  }) => (
    <div>
      <label className="text-sm font-medium block mb-1.5">
        {label}{required && <span className="text-copper-600">*</span>}
      </label>
      <input
        type={type}
        value={form[field]}
        maxLength={255}
        onChange={(e) => setField(field, e.target.value)}
        placeholder={placeholder}
        className={inputCls(field)}
      />
      {errors[field] && (
        <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
          <AlertCircle size={12} /> {errors[field]}
        </p>
      )}
    </div>
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-copper-500" />
          <span className="ml-3 text-muted-foreground">Loading issuing authority…</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl">
        <Link
          to="/login-admin/manageagencies"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft size={14} /> Back to Issuing Authorities
        </Link>

        <div className="mb-8">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
            {isEditMode ? "Edit Issuing Authority" : "Add New Issuing Authority"}
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-medium tracking-tight">
            {isEditMode ? (form.name || "Edit Issuing Authority") : "Create a new Issuing Authority"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEditMode
              ? "Update the issuing authority details below."
              : "Register a government body or local authority that issues business licences."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-sand-200 rounded-2xl p-6 md:p-8 space-y-8">
          {/* Authority Details */}
          <section>
            <h2 className="font-serif text-xl font-medium mb-1">Authority Details</h2>
            <p className="text-sm text-muted-foreground mb-6">Contact information and operational details.</p>

            <div className="grid md:grid-cols-2 gap-5">
              <Field label="Name" required field="name" placeholder="e.g. Lusaka City Council" />
              <Field label="Abbreviation" field="abbreviation" placeholder="e.g. LCC" />

              <Field label="Telephone" required field="telephone" type="tel" placeholder="+260 211 000000" />
              <Field label="Fax" field="fax" placeholder="+260 211 000001" />

              <Field label="Email Address" required field="email" type="email" placeholder="info@authority.gov.zm" />
              <Field label="Website" required field="website" type="url" placeholder="https://www.authority.gov.zm" />

              <div className="md:col-span-2">
                <label className="text-sm font-medium block mb-1.5">
                  Address<span className="text-copper-600">*</span>
                </label>
                <textarea
                  value={form.address}
                  rows={2}
                  maxLength={500}
                  onChange={(e) => setField("address", e.target.value)}
                  placeholder="Physical street address"
                  className={`w-full px-3 py-2 rounded-lg border bg-white outline-none text-sm resize-y transition-colors ${
                    errors.address
                      ? "border-destructive focus:ring-2 focus:ring-destructive/20"
                      : "border-sand-200 focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20"
                  }`}
                />
                {errors.address && (
                  <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.address}
                  </p>
                )}
              </div>

              <Field label="Working Hours" required field="workingHours" placeholder="Mon–Fri 08:00–17:00" />
              <Field label="Postal Address" required field="postalAddress" placeholder="P.O. Box 50593, Lusaka" />

              <Field label="Latitude" field="latitude" placeholder="-15.4167" />
              <Field label="Longitude" field="longitude" placeholder="28.2833" />

              <Field label="Business No" field="businessNo" placeholder="Optional reference number" />

              <div>
                <label className="text-sm font-medium block mb-1.5">
                  Location<span className="text-copper-600">*</span>
                </label>
                <select
                  value={form.location}
                  onChange={(e) => setField("location", e.target.value)}
                  className={inputCls("location")}
                >
                  <option value="">Select location…</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
                {errors.location && (
                  <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.location}
                  </p>
                )}
              </div>

              {/* Map Scan upload */}
              <div className="md:col-span-2">
                <label className="text-sm font-medium block mb-1.5">Map Scan</label>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 px-4 h-11 rounded-lg border border-sand-200 bg-white hover:bg-sand-100 cursor-pointer text-sm font-medium transition-colors">
                    <Upload size={14} />
                    Choose File
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="sr-only"
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        setMapScan(f);
                        if (f) setMapScanName(f.name);
                      }}
                    />
                  </label>
                  <span className="text-sm text-muted-foreground truncate">
                    {mapScan ? mapScan.name : mapScanName || "No file selected"}
                  </span>
                  {(mapScan || mapScanName) && (
                    <button
                      type="button"
                      onClick={() => { setMapScan(null); setMapScanName(""); }}
                      className="p-1.5 rounded-lg hover:bg-sand-100 text-muted-foreground"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Users */}
          <section className="border-t border-sand-200 pt-8">
            <h2 className="font-serif text-xl font-medium mb-1">Users</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Assign users responsible for managing this authority.
            </p>

            {allUsers.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4">No admin users available.</div>
            ) : (
              <>
                <div className="border border-sand-200 rounded-xl divide-y divide-sand-200 max-h-72 overflow-y-auto">
                  {allUsers.map((u) => {
                    const checked = selectedUsers.includes(u.id);
                    return (
                      <label
                        key={u.id}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-sand-100 cursor-pointer text-sm"
                      >
                        <span
                          className={`size-4 rounded border flex items-center justify-center shrink-0 ${
                            checked
                              ? "bg-copper-500 border-copper-500 text-white"
                              : "border-sand-200 bg-white"
                          }`}
                        >
                          {checked && <Check size={12} />}
                        </span>
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={checked}
                          onChange={() => toggleUser(u.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{u.firstname} {u.lastname}</div>
                          <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {selectedUsers.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedUsers.map((id) => {
                      const u = allUsers.find((x) => x.id === id);
                      if (!u) return null;
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-copper-50 text-copper-700 border border-copper-500/20"
                        >
                          {u.firstname} {u.lastname}
                          <button
                            type="button"
                            onClick={() => toggleUser(id)}
                            className="hover:text-copper-900"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </section>

          {/* Branch Offices */}
          <section className="border-t border-sand-200 pt-8">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-serif text-xl font-medium">Branch Offices</h2>
              <button
                type="button"
                onClick={() => setOffices((prev) => [...prev, { ...emptyOffice }])}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-copper-600 hover:text-copper-700"
              >
                <Plus size={14} /> Add Office
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Manage satellite / branch offices for this authority.
            </p>

            {offices.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center border border-dashed border-sand-200 rounded-xl">
                No branch offices. Click "Add Office" to create one.
              </div>
            ) : (
              <div className="space-y-6">
                {offices.map((office, idx) => (
                  <div key={idx} className="border border-sand-200 rounded-xl p-5 relative">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-muted-foreground">
                        Office #{idx + 1}{office.id ? ` (ID: ${office.id})` : " (New)"}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setOffices((prev) => prev.filter((_, i) => i !== idx))}
                        className="inline-flex items-center gap-1 text-xs text-destructive hover:text-destructive/80"
                      >
                        <Trash2 size={12} /> Remove
                      </button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium block mb-1">Title</label>
                        <input
                          value={office.title}
                          onChange={(e) => {
                            const v = e.target.value;
                            setOffices((prev) => prev.map((o, i) => i === idx ? { ...o, title: v } : o));
                          }}
                          placeholder="e.g. Ndola Branch"
                          className="w-full h-10 px-3 rounded-lg border border-sand-200 bg-white text-sm focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium block mb-1">Telephone</label>
                        <input
                          value={office.telephone}
                          onChange={(e) => {
                            const v = e.target.value;
                            setOffices((prev) => prev.map((o, i) => i === idx ? { ...o, telephone: v } : o));
                          }}
                          placeholder="+260 212 000000"
                          className="w-full h-10 px-3 rounded-lg border border-sand-200 bg-white text-sm focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium block mb-1">Email</label>
                        <input
                          value={office.email}
                          onChange={(e) => {
                            const v = e.target.value;
                            setOffices((prev) => prev.map((o, i) => i === idx ? { ...o, email: v } : o));
                          }}
                          placeholder="branch@authority.gov.zm"
                          className="w-full h-10 px-3 rounded-lg border border-sand-200 bg-white text-sm focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium block mb-1">Fax</label>
                        <input
                          value={office.fax}
                          onChange={(e) => {
                            const v = e.target.value;
                            setOffices((prev) => prev.map((o, i) => i === idx ? { ...o, fax: v } : o));
                          }}
                          placeholder="+260 212 000001"
                          className="w-full h-10 px-3 rounded-lg border border-sand-200 bg-white text-sm focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20 outline-none"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs font-medium block mb-1">Address</label>
                        <input
                          value={office.address}
                          onChange={(e) => {
                            const v = e.target.value;
                            setOffices((prev) => prev.map((o, i) => i === idx ? { ...o, address: v } : o));
                          }}
                          placeholder="Physical address"
                          className="w-full h-10 px-3 rounded-lg border border-sand-200 bg-white text-sm focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium block mb-1">Latitude</label>
                        <input
                          value={office.latitude}
                          onChange={(e) => {
                            const v = e.target.value;
                            setOffices((prev) => prev.map((o, i) => i === idx ? { ...o, latitude: v } : o));
                          }}
                          placeholder="-12.9587"
                          className="w-full h-10 px-3 rounded-lg border border-sand-200 bg-white text-sm focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium block mb-1">Longitude</label>
                        <input
                          value={office.longitude}
                          onChange={(e) => {
                            const v = e.target.value;
                            setOffices((prev) => prev.map((o, i) => i === idx ? { ...o, longitude: v } : o));
                          }}
                          placeholder="28.6366"
                          className="w-full h-10 px-3 rounded-lg border border-sand-200 bg-white text-sm focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium block mb-1">Business No</label>
                        <input
                          value={office.business_no}
                          onChange={(e) => {
                            const v = e.target.value;
                            setOffices((prev) => prev.map((o, i) => i === idx ? { ...o, business_no: v } : o));
                          }}
                          placeholder="Optional"
                          className="w-full h-10 px-3 rounded-lg border border-sand-200 bg-white text-sm focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium block mb-1">Location</label>
                        <select
                          value={office.location_id}
                          onChange={(e) => {
                            const v = e.target.value;
                            setOffices((prev) => prev.map((o, i) => i === idx ? { ...o, location_id: v } : o));
                          }}
                          className="w-full h-10 px-3 rounded-lg border border-sand-200 bg-white text-sm focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20 outline-none"
                        >
                          <option value="">Select location…</option>
                          {locations.map((l) => (
                            <option key={l.id} value={l.id}>{l.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="border-t border-sand-200 pt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
            <Link
              to="/login-admin/manageagencies"
              className="inline-flex items-center justify-center border border-sand-200 rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-sand-100 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center bg-gradient-to-b from-copper-500 to-copper-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:from-copper-600 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {isEditMode ? "Update Issuing Authority" : "Create Issuing Authority"}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default IssuingAuthorityForm;

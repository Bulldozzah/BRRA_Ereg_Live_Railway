import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, X } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useLicenses } from "@/hooks/use-licenses";
import { useBusinessTypes } from "@/hooks/use-businesstypes";
import { useToast } from "@/hooks/use-toast";

const BusinessActivityForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: licensesData } = useLicenses({ per_page: 100 });
  const { data: btData } = useBusinessTypes({ per_page: 100 });
  const licenses = (licensesData?.data ?? []).map((l) => ({ id: String(l.id), name: l.name }));
  const businessTypes = (btData?.data ?? []).map((b) => ({ id: String(b.id), name: b.name, count: b.license_count }));

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedLicenses, setSelectedLicenses] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({});

  const toggle = (id: string, list: string[], setter: (v: string[]) => void) =>
    setter(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!name.trim()) next.name = "Name is required";
    else if (name.trim().length > 120) next.name = "Name must be under 120 characters";
    if (!description.trim()) next.description = "Description is required";
    else if (description.trim().length > 1000) next.description = "Description must be under 1000 characters";
    setErrors(next);
    if (Object.keys(next).length) return;

    toast({
      title: "Business Activity created",
      description: `${name.trim()} has been added.`,
    });
    navigate("/login-admin/manageactivities");
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl">
        <Link
          to="/login-admin/manageactivities"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft size={14} /> Back to Business Activities
        </Link>

        <div className="mb-8">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
            Add New Business Activity
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-medium tracking-tight">
            Create a new Business Activity
          </h1>
          <p className="text-muted-foreground mt-1">
            Define an activity and link it to relevant licences and business types.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-sand-200 rounded-2xl p-6 md:p-8 space-y-8">
          <section>
            <h2 className="font-serif text-xl font-medium mb-1">Create a new Business Activity</h2>
            <p className="text-sm text-muted-foreground mb-6">Basic information identifying this business activity.</p>

            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium block mb-1.5">
                  Name<span className="text-copper-600">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  maxLength={120}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Retail trade of goods"
                  className="w-full h-11 px-3 rounded-md border border-sand-200 bg-white outline-none focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20 text-sm"
                />
                {errors.name && <p className="text-xs text-destructive mt-1.5">{errors.name}</p>}
              </div>

              <div>
                <label className="text-sm font-medium block mb-1.5">
                  Description<span className="text-copper-600">*</span>
                </label>
                <textarea
                  value={description}
                  maxLength={1000}
                  rows={4}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the activity, what it covers, and any notable scope."
                  className="w-full px-3 py-2 rounded-md border border-sand-200 bg-white outline-none focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20 text-sm resize-y"
                />
                <div className="flex justify-between mt-1.5">
                  {errors.description ? (
                    <p className="text-xs text-destructive">{errors.description}</p>
                  ) : (
                    <span />
                  )}
                  <span className="text-xs text-muted-foreground">{description.length}/1000</span>
                </div>
              </div>
            </div>
          </section>

          <section className="border-t border-sand-200 pt-8">
            <h2 className="font-serif text-xl font-medium mb-1">Licenses, Business Types</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Link this activity to the licences required and the business types that perform it.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                  Licenses ({selectedLicenses.length})
                </div>
                <div className="border border-sand-200 rounded-xl divide-y divide-sand-200 max-h-72 overflow-y-auto">
                  {licenses.map((lic) => {
                    const checked = selectedLicenses.includes(lic.id);
                    return (
                      <label
                        key={lic.id}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-sand-100 cursor-pointer text-sm"
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
                          onChange={() => toggle(lic.id, selectedLicenses, setSelectedLicenses)}
                        />
                        <span className="flex-1 truncate" title={lic.name}>{lic.name}</span>
                        <span className="text-xs text-muted-foreground tabular-nums">{lic.id}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                  Business Types ({selectedTypes.length})
                </div>
                <div className="border border-sand-200 rounded-xl divide-y divide-sand-200 max-h-72 overflow-y-auto">
                  {businessTypes.map((bt) => {
                    const checked = selectedTypes.includes(bt.id);
                    return (
                      <label
                        key={bt.id}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-sand-100 cursor-pointer text-sm"
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
                          onChange={() => toggle(bt.id, selectedTypes, setSelectedTypes)}
                        />
                        <span className="flex-1">{bt.name}</span>
                        <span className="text-xs text-muted-foreground tabular-nums">{bt.count}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {(selectedLicenses.length > 0 || selectedTypes.length > 0) && (
              <div className="mt-5 flex flex-wrap gap-2">
                {selectedLicenses.map((id) => {
                  const lic = licenses.find((l) => l.id === id);
                  if (!lic) return null;
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-copper-50 text-copper-700 border border-copper-500/20"
                    >
                      {lic.name}
                      <button
                        type="button"
                        onClick={() => toggle(id, selectedLicenses, setSelectedLicenses)}
                        className="hover:text-copper-900"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  );
                })}
                {selectedTypes.map((id) => {
                  const bt = businessTypes.find((b) => b.id === id);
                  if (!bt) return null;
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-sand-100 text-foreground border border-sand-200"
                    >
                      {bt.name}
                      <button
                        type="button"
                        onClick={() => toggle(id, selectedTypes, setSelectedTypes)}
                        className="hover:text-copper-700"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </section>

          <div className="border-t border-sand-200 pt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <Link
              to="/login-admin/manageactivities"
              className="inline-flex items-center justify-center border border-sand-200 rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-sand-100 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="inline-flex items-center justify-center bg-gradient-to-b from-copper-500 to-copper-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:from-copper-600 transition-colors"
            >
              Create Business Activity
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default BusinessActivityForm;

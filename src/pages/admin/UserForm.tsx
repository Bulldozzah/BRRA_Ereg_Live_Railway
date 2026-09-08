import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Eye, EyeOff, X } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAgencies } from "@/hooks/use-agencies";
import { useToast } from "@/hooks/use-toast";

const mockGroups = [
  { id: "g-1", name: "Super Admin" },
  { id: "g-2", name: "Agency Editor" },
  { id: "g-3", name: "Moderator" },
  { id: "g-4", name: "Reviewer" },
  { id: "g-5", name: "Read-only" },
];

interface Form {
  firstName: string; lastName: string; phone: string; email: string;
  username: string; password: string;
}

const empty: Form = {
  firstName: "", lastName: "", phone: "", email: "",
  username: "", password: "",
};

const UserForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: agData } = useAgencies({ per_page: 100 });
  const agencies = (agData?.data ?? []).map((a) => ({ id: String(a.id), name: a.name, contact: a.email || a.telephone || '' }));
  const [form, setForm] = useState<Form>(empty);
  const [selectedAgencies, setSelectedAgencies] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [enabled, setEnabled] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof Form | "agencies", string>>>({});

  const setField = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggle = (id: string, list: string[], setList: (v: string[]) => void) =>
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    (["firstName", "lastName", "phone", "email", "username", "password"] as (keyof Form)[]).forEach(
      (k) => { if (!form[k].trim()) next[k] = "Required"; }
    );
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Invalid email";
    if (form.phone && !/^[+\d][\d\s()-]{6,}$/.test(form.phone)) next.phone = "Invalid phone";
    if (form.username && !/^[a-zA-Z0-9_.-]{3,30}$/.test(form.username))
      next.username = "3–30 chars: letters, numbers, . _ -";
    if (form.password && form.password.length < 8) next.password = "Minimum 8 characters";
    if (selectedAgencies.length === 0) next.agencies = "Select at least one agency";
    setErrors(next);
    if (Object.keys(next).length) return;

    toast({
      title: "User created",
      description: `${form.firstName.trim()} ${form.lastName.trim()} has been added.`,
    });
    navigate("/login-admin/manageusers");
  };

  const inputCls = (field: keyof Form) =>
    `w-full h-11 px-3 rounded-md border bg-white outline-none text-sm transition-colors ${
      errors[field]
        ? "border-destructive focus:ring-2 focus:ring-destructive/20"
        : "border-sand-200 focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20"
    }`;

  const Field = ({ label, required, field, type = "text", placeholder, maxLength = 120 }: {
    label: string; required?: boolean; field: keyof Form; type?: string; placeholder?: string; maxLength?: number;
  }) => (
    <div>
      <label className="text-sm font-medium block mb-1.5">
        {label}{required && <span className="text-copper-600">*</span>}
      </label>
      <input
        type={type}
        value={form[field]}
        maxLength={maxLength}
        autoComplete="off"
        onChange={(e) => setField(field, e.target.value)}
        placeholder={placeholder}
        className={inputCls(field)}
      />
      {errors[field] && <p className="text-xs text-destructive mt-1.5">{errors[field]}</p>}
    </div>
  );

  return (
    <AdminLayout>
      <div className="max-w-5xl">
        <Link
          to="/login-admin/manageusers"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft size={14} /> Back to Users
        </Link>

        <div className="mb-8">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Add User</div>
          <h1 className="font-serif text-3xl md:text-4xl font-medium tracking-tight">
            Create a new user and assign credentials
          </h1>
          <p className="text-muted-foreground mt-1">
            Add a portal account, assign agencies and permission groups.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-sand-200 rounded-2xl p-6 md:p-8 space-y-8">
          {/* Personal */}
          <section>
            <h2 className="font-serif text-xl font-medium mb-1">Personal Details</h2>
            <p className="text-sm text-muted-foreground mb-6">Identity and contact information.</p>

            <div className="grid md:grid-cols-2 gap-5">
              <Field label="First Name" required field="firstName" placeholder="e.g. Joseph" />
              <Field label="Last Name" required field="lastName" placeholder="e.g. Mwale" />
              <Field label="Phone Number" required field="phone" type="tel" placeholder="+260 977 000000" />
              <Field label="Email Address" required field="email" type="email" placeholder="user@gov.zm" />
            </div>
          </section>

          {/* Credentials */}
          <section className="border-t border-sand-200 pt-8">
            <h2 className="font-serif text-xl font-medium mb-1">Login Credentials</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Username and an initial password (the user can change it after first login).
            </p>

            <div className="grid md:grid-cols-2 gap-5">
              <Field label="Username" required field="username" placeholder="e.g. j.mwale" maxLength={30} />
              <div>
                <label className="text-sm font-medium block mb-1.5">
                  Password<span className="text-copper-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    maxLength={64}
                    autoComplete="new-password"
                    onChange={(e) => setField("password", e.target.value)}
                    placeholder="Minimum 8 characters"
                    className={inputCls("password") + " pr-10"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive mt-1.5">{errors.password}</p>}
              </div>
            </div>
          </section>

          {/* Agencies */}
          <section className="border-t border-sand-200 pt-8">
            <h2 className="font-serif text-xl font-medium mb-1">
              Agencies<span className="text-copper-600">*</span>
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Agencies this user can manage on behalf of.
            </p>

            <div className="border border-sand-200 rounded-xl divide-y divide-sand-200 max-h-64 overflow-y-auto">
              {agencies.map((a) => {
                const checked = selectedAgencies.includes(a.id);
                return (
                  <label key={a.id} className="flex items-center gap-3 px-4 py-3 hover:bg-sand-100 cursor-pointer text-sm">
                    <span className={`size-4 rounded border flex items-center justify-center shrink-0 ${checked ? "bg-copper-500 border-copper-500 text-white" : "border-sand-200 bg-white"}`}>
                      {checked && <Check size={12} />}
                    </span>
                    <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggle(a.id, selectedAgencies, setSelectedAgencies)} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{a.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{a.contact}</div>
                    </div>
                  </label>
                );
              })}
            </div>
            {errors.agencies && <p className="text-xs text-destructive mt-2">{errors.agencies}</p>}

            {selectedAgencies.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedAgencies.map((id) => {
                  const a = agencies.find((x) => x.id === id);
                  if (!a) return null;
                  return (
                    <span key={id} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-copper-50 text-copper-700 border border-copper-500/20">
                      {a.name}
                      <button type="button" onClick={() => toggle(id, selectedAgencies, setSelectedAgencies)} className="hover:text-copper-900">
                        <X size={12} />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </section>

          {/* Groups */}
          <section className="border-t border-sand-200 pt-8">
            <h2 className="font-serif text-xl font-medium mb-1">Groups</h2>
            <p className="text-sm text-muted-foreground mb-6">Permission groups determine what this user can do.</p>

            <div className="flex flex-wrap gap-2">
              {mockGroups.map((g) => {
                const checked = selectedGroups.includes(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => toggle(g.id, selectedGroups, setSelectedGroups)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm transition-colors ${
                      checked
                        ? "bg-copper-500 border-copper-500 text-white"
                        : "bg-white border-sand-200 hover:bg-sand-100"
                    }`}
                  >
                    {checked && <Check size={12} />}
                    {g.name}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Enabled */}
          <section className="border-t border-sand-200 pt-8">
            <label className="flex items-start gap-3 cursor-pointer">
              <span
                role="switch"
                aria-checked={enabled}
                onClick={() => setEnabled((v) => !v)}
                className={`mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                  enabled ? "bg-copper-500" : "bg-sand-200"
                }`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-5" : "translate-x-0.5"}`} />
              </span>
              <input type="checkbox" className="sr-only" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
              <div>
                <div className="text-sm font-medium">Enabled</div>
                <div className="text-xs text-muted-foreground">
                  Disabled users cannot sign in to the portal.
                </div>
              </div>
            </label>
          </section>

          <div className="border-t border-sand-200 pt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <Link
              to="/login-admin/manageusers"
              className="inline-flex items-center justify-center border border-sand-200 rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-sand-100 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="inline-flex items-center justify-center bg-gradient-to-b from-copper-500 to-copper-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:from-copper-600 transition-colors"
            >
              Create User
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default UserForm;

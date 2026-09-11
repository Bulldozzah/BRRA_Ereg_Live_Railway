import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check, ChevronDown, Loader2, SlidersHorizontal } from "lucide-react";
import { useLocations } from "@/hooks/use-locations";
import { useIndustries } from "@/hooks/use-industries";
import { useBusinessTypes } from "@/hooks/use-businesstypes";
import { useActivities } from "@/hooks/use-activities";

// Reference lists are small; one request each is enough to fill a dropdown.
const OPTIONS_PER_PAGE = 500;

const Select = ({
  label,
  hint,
  value,
  onChange,
  disabled,
  loading,
  children,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}) => (
  <div>
    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
      {label}
    </label>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full h-11 pl-3 pr-9 rounded-xl border border-sand-200 bg-white text-sm font-medium appearance-none cursor-pointer hover:border-copper-500/40 focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20 outline-none transition-colors disabled:cursor-not-allowed disabled:bg-sand-100 disabled:text-muted-foreground"
      >
        <option value="">{disabled ? hint : `All ${label}s`}</option>
        {children}
      </select>
      {loading ? (
        <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />
      ) : (
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      )}
    </div>
  </div>
);

export interface AdvancedSearchValues {
  location_id: string;
  industry_id: string;
  business_type_id: string;
  activity_ids: string;
}

interface AdvancedLicenseSearchProps {
  /** Current selection, when the parent page owns the filter state. */
  values?: AdvancedSearchValues;
  /**
   * Called on submit. When omitted the component navigates to the license
   * directory instead, which is what the homepage wants.
   */
  onApply?: (values: AdvancedSearchValues) => void;
  className?: string;
}

const EMPTY_VALUES: AdvancedSearchValues = {
  location_id: "",
  industry_id: "",
  business_type_id: "",
  activity_ids: "",
};

const parseIds = (value: string) =>
  value.split(",").map((v) => parseInt(v, 10)).filter(Number.isFinite);

export const AdvancedLicenseSearch = ({
  values = EMPTY_VALUES,
  onApply,
  className = "mb-12",
}: AdvancedLicenseSearchProps) => {
  const navigate = useNavigate();

  const [locationId, setLocationId] = useState(values.location_id);
  const [industryId, setIndustryId] = useState(values.industry_id);
  const [businessTypeId, setBusinessTypeId] = useState(values.business_type_id);
  const [activityIds, setActivityIds] = useState<number[]>(parseIds(values.activity_ids));
  const [activitiesOpen, setActivitiesOpen] = useState(false);

  // Reflect changes the parent makes elsewhere (e.g. clearing a filter chip).
  useEffect(() => {
    setLocationId(values.location_id);
    setIndustryId(values.industry_id);
    setBusinessTypeId(values.business_type_id);
    setActivityIds(parseIds(values.activity_ids));
  }, [values.location_id, values.industry_id, values.business_type_id, values.activity_ids]);

  // Jurisdiction stands on its own — picking one does not narrow the others.
  const { data: locationsData } = useLocations({
    per_page: OPTIONS_PER_PAGE,
    has_licenses: 1,
    order_by: "name",
    order_dir: "ASC",
  });
  const { data: industriesData } = useIndustries({
    per_page: OPTIONS_PER_PAGE,
    has_licenses: 1,
    order_by: "name",
    order_dir: "ASC",
  });
  // Industry narrows business types, which in turn narrow activities.
  const { data: businessTypesData, isFetching: loadingTypes } = useBusinessTypes(
    { per_page: OPTIONS_PER_PAGE, has_licenses: 1, industry_id: industryId },
    { enabled: !!industryId }
  );
  const { data: activitiesData, isFetching: loadingActivities } = useActivities(
    { per_page: OPTIONS_PER_PAGE, has_licenses: 1, business_type_id: businessTypeId },
    { enabled: !!businessTypeId }
  );

  const locations = locationsData?.data ?? [];
  const industries = industriesData?.data ?? [];
  const businessTypes = industryId ? businessTypesData?.data ?? [] : [];
  const activities = businessTypeId ? activitiesData?.data ?? [] : [];

  // Group jurisdictions under their category, as the legacy portal did.
  const groupedLocations = locations.reduce<Record<string, typeof locations>>((acc, loc) => {
    const key = loc.category_name || "Other";
    (acc[key] ||= []).push(loc);
    return acc;
  }, {});

  const handleIndustryChange = (value: string) => {
    setIndustryId(value);
    setBusinessTypeId("");
    setActivityIds([]);
  };

  const handleBusinessTypeChange = (value: string) => {
    setBusinessTypeId(value);
    setActivityIds([]);
  };

  const toggleActivity = (id: number) => {
    setActivityIds((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  };

  const hasSelection = !!(locationId || industryId || businessTypeId || activityIds.length);

  const reset = () => {
    setLocationId("");
    setIndustryId("");
    setBusinessTypeId("");
    setActivityIds([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selection: AdvancedSearchValues = {
      location_id: locationId,
      industry_id: industryId,
      business_type_id: businessTypeId,
      activity_ids: activityIds.join(","),
    };
    setActivitiesOpen(false);

    if (onApply) {
      onApply(selection);
      return;
    }

    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(selection)) {
      if (value) params.set(key, value);
    }
    const query = params.toString();
    navigate(query ? `/browse/licenses?${query}` : "/browse/licenses");
  };

  return (
    <form onSubmit={handleSubmit} className={`bg-white border border-sand-200 rounded-2xl p-5 shadow-card ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <SlidersHorizontal size={14} className="text-copper-600" /> Advanced Search
        </div>
        {hasSelection && (
          <button type="button" onClick={reset} className="text-xs text-copper-600 hover:underline">
            Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Select label="Jurisdiction" hint="" value={locationId} onChange={setLocationId}>
          {Object.entries(groupedLocations).map(([category, items]) => (
            <optgroup key={category} label={category}>
              {items.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </optgroup>
          ))}
        </Select>

        <Select label="Industry" hint="" value={industryId} onChange={handleIndustryChange}>
          {industries.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </Select>

        <Select
          label="Business Type"
          hint="Select an industry first"
          value={businessTypeId}
          onChange={handleBusinessTypeChange}
          disabled={!industryId}
          loading={loadingTypes}
        >
          {businessTypes.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>

        {/* Activities allow several selections at once, so they need a checkbox list
            rather than a native select. */}
        <div className="relative">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
            Business Activities
          </label>
          <button
            type="button"
            disabled={!businessTypeId}
            onClick={() => setActivitiesOpen((o) => !o)}
            className="w-full h-11 pl-3 pr-9 rounded-xl border border-sand-200 bg-white text-sm font-medium text-left hover:border-copper-500/40 focus:border-copper-500 focus:ring-2 focus:ring-copper-500/20 outline-none transition-colors disabled:cursor-not-allowed disabled:bg-sand-100 disabled:text-muted-foreground truncate"
          >
            {!businessTypeId
              ? "Select a business type first"
              : activityIds.length === 0
                ? "All Business Activities"
                : `${activityIds.length} selected`}
            {loadingActivities ? (
              <Loader2 size={14} className="absolute right-3 top-[2.35rem] animate-spin text-muted-foreground" />
            ) : (
              <ChevronDown size={14} className="absolute right-3 top-[2.35rem] text-muted-foreground pointer-events-none" />
            )}
          </button>

          {activitiesOpen && businessTypeId && (
            <div className="absolute z-20 mt-1 w-full bg-white border border-sand-200 rounded-xl shadow-card max-h-64 overflow-y-auto divide-y divide-sand-100">
              {activities.length === 0 ? (
                <p className="px-4 py-3 text-sm text-muted-foreground">
                  {loadingActivities ? "Loading…" : "No activities for this business type."}
                </p>
              ) : (
                activities.map((act) => {
                  const checked = activityIds.includes(act.id);
                  return (
                    <label
                      key={act.id}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-sand-100 cursor-pointer text-sm"
                    >
                      <span
                        className={`size-4 rounded border flex items-center justify-center shrink-0 ${
                          checked ? "bg-copper-500 border-copper-500 text-white" : "border-sand-200 bg-white"
                        }`}
                      >
                        {checked && <Check size={12} />}
                      </span>
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={() => toggleActivity(act.id)}
                      />
                      <span className="flex-1">{act.name}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">{act.license_count}</span>
                    </label>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end mt-4">
        <button
          type="submit"
          className="inline-flex items-center gap-2 px-6 h-11 rounded-full bg-copper-500 text-white font-semibold text-sm hover:bg-copper-600 transition-colors"
        >
          Get Results <ArrowRight size={14} />
        </button>
      </div>
    </form>
  );
};

export default AdvancedLicenseSearch;

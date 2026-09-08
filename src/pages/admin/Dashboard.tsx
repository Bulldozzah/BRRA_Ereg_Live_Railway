import { AdminLayout } from "@/components/layout/AdminLayout";
import { Link } from "react-router-dom";
import { useState } from "react";
import {
  FileText, Building2, Users, Newspaper, MessageSquare, MapPin, Briefcase,
  TrendingUp, TrendingDown, Activity, ArrowRight, CheckCircle2, Clock, Loader2,
  ExternalLink, Globe, MousePointerClick, Calendar
} from "lucide-react";
import { useDashboardStats, useClickSummary } from "@/hooks/use-stats";
import { useLicenses } from "@/hooks/use-licenses";

const statusColors: Record<string, string> = {
  Published: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Draft: "bg-amber-50 text-amber-700 border-amber-200",
  "In Review": "bg-sky-50 text-sky-700 border-sky-200",
  Unpublished: "bg-stone-100 text-stone-700 border-stone-200",
};

const Dashboard = () => {
  const { data: statsResponse } = useDashboardStats();
  const st = statsResponse?.data;
  const [clickStartDate, setClickStartDate] = useState<string>("");
  const [clickEndDate, setClickEndDate] = useState<string>("");
  const { data: clickResponse } = useClickSummary(clickStartDate || undefined, clickEndDate || undefined);
  const clicks = clickResponse?.data;
  const { data: recentData } = useLicenses({ per_page: 4, order_by: 'id', order_dir: 'DESC' });

  const stats = [
    { label: "Published Licences", value: String(st?.licenses ?? 0), icon: FileText },
    { label: "Active Agencies", value: String(st?.agencies ?? 0), icon: Building2 },
    { label: "Locations", value: String(st?.locations ?? 0), icon: MapPin },
    { label: "Industries", value: String(st?.industries ?? 0), icon: Briefcase },
    { label: "Regulations", value: String(st?.regulations ?? 0), icon: FileText },
    { label: "External Clicks", value: String(clicks?.total_clicks ?? 0), icon: MousePointerClick },
  ];

  const recentLicenses = (recentData?.data ?? []).map((l) => ({
    id: String(l.id),
    name: l.name,
    agency: String(l.agency_id ?? ''),
    status: l.status === '1' ? 'Published' : l.status || 'Draft',
    date: l.updated ? new Date(l.updated).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
  }));

  return (
  <AdminLayout>
    <div className="mb-8 flex items-end justify-between flex-wrap gap-4">
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">eRegistry</div>
        <h1 className="font-serif text-3xl md:text-4xl font-medium tracking-tight">Good morning, Joseph</h1>
        <p className="text-muted-foreground mt-1">Here's what's happening in the registry today.</p>
      </div>
      <Link to="/login-admin/managelicenses" className="inline-flex items-center gap-2 bg-gradient-to-b from-copper-500 to-copper-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:from-copper-600 transition-colors">
        + New licence
      </Link>
    </div>

    {/* Stats grid */}
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-4 mb-8">
      {stats.map((s) => (
        <div key={s.label} className="bg-white border border-sand-200 rounded-2xl p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="size-10 rounded-xl bg-copper-50 text-copper-600 flex items-center justify-center">
              <s.icon size={18} />
            </div>
          </div>
          <div className="text-2xl font-serif font-medium tabular-nums">{s.value}</div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">{s.label}</div>
        </div>
      ))}
    </div>


    {/* Recent licences */}
    <div className="bg-white border border-sand-200 rounded-2xl p-6 mt-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-serif text-xl font-medium">Recent licences</h2>
        <Link to="/login-admin/managelicenses" className="text-sm text-copper-600 hover:text-copper-900 inline-flex items-center gap-1">
          Manage all <ArrowRight size={14} />
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wider text-muted-foreground border-b border-sand-200">
            <tr>
              <th className="text-left py-3 font-medium">Licence</th>
              <th className="text-left py-3 font-medium">Agency</th>
              <th className="text-left py-3 font-medium">Status</th>
              <th className="text-left py-3 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {recentLicenses.map((l) => (
              <tr key={l.id} className="border-b border-sand-100 last:border-0 hover:bg-sand-100/50">
                <td className="py-3">
                  <div className="font-medium">{l.name}</div>
                  <div className="text-xs text-muted-foreground">{l.id}</div>
                </td>
                <td className="py-3 text-muted-foreground">{l.agency}</td>
                <td className="py-3">
                  <span className={`text-xs px-2 py-1 rounded-full border ${statusColors[l.status]}`}>{l.status}</span>
                </td>
                <td className="py-3 text-muted-foreground tabular-nums">{l.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* External Link Clicks */}
    <div className="mt-6">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
        <div className="flex items-center gap-2">
          <MousePointerClick size={20} className="text-copper-600" />
          <h2 className="font-serif text-xl font-medium">External Link Clicks</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-muted-foreground" />
            <input
              type="date"
              value={clickStartDate}
              onChange={(e) => setClickStartDate(e.target.value)}
              className="h-9 px-3 rounded-lg border border-sand-200 text-sm bg-white"
              placeholder="Start date"
            />
            <span className="text-muted-foreground text-sm">to</span>
            <input
              type="date"
              value={clickEndDate}
              onChange={(e) => setClickEndDate(e.target.value)}
              className="h-9 px-3 rounded-lg border border-sand-200 text-sm bg-white"
              placeholder="End date"
            />
          </div>
          {(clickStartDate || clickEndDate) && (
            <button
              onClick={() => { setClickStartDate(""); setClickEndDate(""); }}
              className="text-xs text-copper-600 hover:text-copper-900 font-medium"
            >
              Clear dates
            </button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-white border border-sand-200 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Globe size={18} className="text-copper-600" />
          <h2 className="font-serif text-xl font-medium">Top Clicked Agencies</h2>
        </div>
        {(clicks?.top_agencies?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">No external link clicks recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {clicks?.top_agencies?.map((a, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-sand-100 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground tabular-nums w-5">{i + 1}.</span>
                  <span className="text-sm font-medium">{a.agency_name}</span>
                </div>
                <span className="text-sm tabular-nums font-medium bg-copper-50 text-copper-700 px-2.5 py-0.5 rounded-full">{a.clicks}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border border-sand-200 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <ExternalLink size={18} className="text-copper-600" />
          <h2 className="font-serif text-xl font-medium">Top Clicked Licences</h2>
        </div>
        {(clicks?.top_licenses?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">No external link clicks recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {clicks?.top_licenses?.map((l, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-sand-100 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground tabular-nums w-5">{i + 1}.</span>
                  <span className="text-sm font-medium">{l.license_name}</span>
                </div>
                <span className="text-sm tabular-nums font-medium bg-copper-50 text-copper-700 px-2.5 py-0.5 rounded-full">{l.clicks}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  </AdminLayout>
  );
};

export default Dashboard;

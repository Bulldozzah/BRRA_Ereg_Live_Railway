import { useState, ReactNode } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Link } from "react-router-dom";
import { Plus, Search, MoreVertical, Filter, Download } from "lucide-react";

interface Column { key: string; label: string; render?: (row: any) => ReactNode; }
interface ManageTableProps {
  title: string;
  description: string;
  newLabel?: string;
  newHref?: string;
  tabs?: { label: string; count: number }[];
  columns: Column[];
  rows: Record<string, any>[];
}

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    Published: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Draft: "bg-amber-50 text-amber-700 border-amber-200",
    "In Review": "bg-sky-50 text-sky-700 border-sky-200",
    Pending: "bg-amber-50 text-amber-700 border-amber-200",
    Unpublished: "bg-stone-100 text-stone-700 border-stone-200",
    Closed: "bg-stone-100 text-stone-700 border-stone-200",
  };
  return <span className={`text-xs px-2 py-1 rounded-full border ${map[status] ?? "bg-stone-100 text-stone-700 border-stone-200"}`}>{status}</span>;
};

export const ManageTable = ({ title, description, newLabel, newHref, tabs, columns, rows }: ManageTableProps) => {
  const [active, setActive] = useState(0);
  const [q, setQ] = useState("");
  const visible = rows.filter((r) =>
    Object.values(r).some((v) => String(v).toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <AdminLayout>
      <div className="mb-6 flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-3xl font-medium tracking-tight">{title}</h1>
          <p className="text-muted-foreground mt-1">{description}</p>
        </div>
        {newLabel && (
          <Link to={newHref ?? "#"} className="inline-flex items-center gap-2 bg-gradient-to-b from-copper-500 to-copper-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:from-copper-600 transition-colors">
            <Plus size={16} /> {newLabel}
          </Link>
        )}
      </div>

      {tabs && (
        <div className="flex items-center gap-1 border-b border-sand-200 mb-6 overflow-x-auto">
          {tabs.map((t, i) => (
            <button
              key={t.label}
              onClick={() => setActive(i)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap inline-flex items-center gap-2 ${
                active === i ? "border-copper-500 text-copper-600" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
              <span className={`text-xs px-2 py-0.5 rounded-full ${active === i ? "bg-copper-50 text-copper-600" : "bg-sand-100 text-muted-foreground"}`}>{t.count}</span>
            </button>
          ))}
        </div>
      )}

      <div className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-sand-200">
          <div className="flex items-center gap-2 flex-1 bg-sand-100 rounded-full px-4 h-10 max-w-md">
            <Search size={14} className="text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              className="flex-1 bg-transparent outline-none text-sm"
            />
          </div>
          <button className="inline-flex items-center gap-2 text-sm border border-sand-200 rounded-lg px-3 h-10 hover:bg-sand-100">
            <Filter size={14} /> Filter
          </button>
          <button className="inline-flex items-center gap-2 text-sm border border-sand-200 rounded-lg px-3 h-10 hover:bg-sand-100">
            <Download size={14} /> Export
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground bg-sand-100/50">
              <tr>
                <th className="text-left py-3 px-4 font-medium w-10">
                  <input type="checkbox" className="rounded border-sand-200" />
                </th>
                {columns.map((c) => (
                  <th key={c.key} className="text-left py-3 px-4 font-medium">{c.label}</th>
                ))}
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row, i) => (
                <tr key={i} className="border-t border-sand-100 hover:bg-sand-100/40">
                  <td className="py-3 px-4">
                    <input type="checkbox" className="rounded border-sand-200" />
                  </td>
                  {columns.map((c) => (
                    <td key={c.key} className="py-3 px-4">
                      {c.render ? c.render(row) : row[c.key]}
                    </td>
                  ))}
                  <td className="py-3 px-4 text-right">
                    <button className="p-1.5 rounded-md hover:bg-sand-200 text-muted-foreground"><MoreVertical size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between p-4 border-t border-sand-200 text-sm text-muted-foreground">
          <span>Showing {visible.length} of {rows.length}</span>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1.5 rounded-md border border-sand-200 hover:bg-sand-100">Previous</button>
            <button className="px-3 py-1.5 rounded-md bg-copper-50 text-copper-600 font-medium">1</button>
            <button className="px-3 py-1.5 rounded-md hover:bg-sand-100">2</button>
            <button className="px-3 py-1.5 rounded-md hover:bg-sand-100">3</button>
            <button className="px-3 py-1.5 rounded-md border border-sand-200 hover:bg-sand-100">Next</button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export { statusBadge };

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bug, AlertCircle, CheckCircle2, Activity, Search, PlusCircle } from "lucide-react";
import BugCard from "../../components/bug/BugCard";
import BugTable from "../../components/bug/BugTable";
import { getBugs } from "../../services/bugService";
import { getMlAnalytics } from "../../services/securityService";

export default function AdminDashboard() {
  const [bugs, setBugs] = useState([]);
  const [mlStats, setMlStats] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [bugsRes, mlRes] = await Promise.all([
          getBugs().catch(() => ({ data: [] })),
          getMlAnalytics().catch(() => ({ data: null })),
        ]);
        setBugs(bugsRes.data || []);
        if (mlRes.data) {
          setMlStats(mlRes.data);
        }
      } catch {
        setBugs([]);
      }

      setLoading(false);
    }
    load();
  }, []);

  const total = bugs.length;
  const inProgress = bugs.filter((b) => b.status === "IN_PROGRESS").length;
  const resolved = bugs.filter((b) => b.status === "RESOLVED" || b.status === "CLOSED").length;
  const open = bugs.filter((b) => b.status === "OPEN").length;

  const filtered = bugs.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Welcome back — here's your bug tracking overview.</p>
        </div>
        <Link
          to="/admin/add-bug"
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 hover:bg-blue-500 transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          Add Bug
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <BugCard icon={<Bug className="h-5 w-5" />} label="Total Bugs" value={loading ? "…" : total} accent="blue" />
        <BugCard icon={<Activity className="h-5 w-5" />} label="In Progress" value={loading ? "…" : inProgress} accent="purple" />
        <BugCard icon={<CheckCircle2 className="h-5 w-5" />} label="Completed" value={loading ? "…" : resolved} accent="green" />
        <BugCard icon={<AlertCircle className="h-5 w-5" />} label="Reported" value={loading ? "…" : open} accent="amber" />
      </div>

      {/* Security Overview */}
      {mlStats && (
        <div className="flex flex-col gap-4 rounded-xl border border-red-500/30 bg-[#0d1526] p-5">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-100">System Security Overview</h2>
          </div>
          <div className="flex items-center gap-8">
            <div>
              <p className="text-xs text-slate-500 mb-1">Total Security Alerts</p>
              <p className="text-lg font-bold text-slate-300">{mlStats.alerts?.length || 0}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">ML Anomalies Detected</p>
              <p className="text-lg font-bold text-amber-500">{mlStats.distribution?.anomalous || 0}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Maximum Peak Risk</p>
              <p className="text-lg font-bold text-red-400">{mlStats.stats?.peakRisk || 0}</p>
            </div>

          </div>
        </div>
      )}

      {/* All Bugs Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1526]">
        <div className="flex flex-col gap-3 border-b border-slate-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold text-slate-100">All Bugs</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <input
              placeholder="Search bugs…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 rounded-lg border border-slate-700 bg-slate-800/60 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
        <div className="p-0">
          {loading ? (
            <p className="py-12 text-center text-sm text-slate-500">Loading bugs…</p>
          ) : (
            <BugTable bugs={filtered} showActions />
          )}
        </div>
      </div>


    </div>
  );
}

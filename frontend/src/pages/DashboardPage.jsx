import { useEffect, useState } from "react";
import { getBugs } from "../services/bugService";

export default function DashboardPage() {
  const [stats, setStats] = useState({ total: 0, open: 0, resolved: 0 });

  useEffect(() => {
    async function load() {
      try {
        const bugs = await getBugs();
        const all = bugs.data || [];
        setStats({
          total: all.length,
          open: all.filter((b) => b.status === "OPEN").length,
          resolved: all.filter((b) => b.status === "RESOLVED" || b.status === "CLOSED").length,
        });
      } catch {
        setStats({ total: "—", open: "—", resolved: "—" });
      }
    }
    load();
  }, []);

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded border border-slate-700 p-4">Total Bugs: {stats.total}</div>
        <div className="rounded border border-slate-700 p-4">Open Bugs: {stats.open}</div>
        <div className="rounded border border-slate-700 p-4">Resolved/Closed: {stats.resolved}</div>
      </div>
      {stats.total === "—" && (
        <p className="text-xs text-slate-500">
          Bug metrics hidden — your role does not include bug visibility (e.g. SECURITY_TEAM).
        </p>
      )}
    </section>
  );
}

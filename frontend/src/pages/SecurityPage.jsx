import { useEffect, useState } from "react";
import { getAuditLogs, getSecurityDashboard } from "../services/securityService";
import { Link } from "react-router-dom";
import { Activity } from "lucide-react";

export default function SecurityPage() {
  const [dashboard, setDashboard] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [dash, audits] = await Promise.all([
          getSecurityDashboard(),
          getAuditLogs(),
        ]);
        if (!cancelled) {
          setDashboard(dash.data);
          setAuditLogs(audits.data || []);
          setError("");
        }
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load security data");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Security Dashboard</h1>
      <p className="text-sm text-slate-400">
        Restricted to <strong>SECURITY_TEAM</strong> — failed logins, audit trail, and suspicious
        activity indicators.
      </p>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {!dashboard && !error && <p>Loading...</p>}

      {/* ML Analytics Card Link */}
      <div className="mb-4 rounded border border-indigo-500/30 bg-indigo-900/10 p-4 transition-colors hover:bg-indigo-900/20">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-indigo-500/20 p-2 text-indigo-400">
            <Activity size={24} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">ML Risk Analytics</h2>
            <p className="text-sm text-slate-300">
              View real-time threat analysis powered by Random Forest and Isolation Forest models.
            </p>
          </div>
          <Link
            to="/security/analytics"
            className="ml-auto rounded bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-700"
          >
            Open Dashboard
          </Link>
        </div>
      </div>

      {dashboard && (
        <>
          <div className="rounded border border-slate-700 p-4">
            <h2 className="mb-2 font-semibold">Failed logins &amp; suspicious activity</h2>
            <p className="text-sm text-slate-300">
              Failed logins (last 24h):{" "}
              <strong>{dashboard.failedLoginsLast24h}</strong>
            </p>
          </div>
          <div className="rounded border border-slate-700 p-4">
            <h2 className="mb-2 font-semibold">Top failed-login accounts</h2>
            <ul className="space-y-1 text-sm text-slate-300">
              {dashboard.topFailedUsers.length === 0 && <li>None recorded</li>}
              {dashboard.topFailedUsers.map((u) => (
                <li key={u.id}>
                  {u.email} — attempts: {u.failedLoginAttempts}
                  {u.lastFailedLoginAt &&
                    ` (last: ${new Date(u.lastFailedLoginAt).toLocaleString()})`}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded border border-slate-700 p-4">
            <h2 className="mb-2 font-semibold">Recent audit events</h2>
            <ul className="max-h-48 space-y-1 overflow-y-auto text-xs text-slate-400">
              {(dashboard.recentAuditLogs || []).map((log) => (
                <li key={log.id}>
                  {log.action} · {log.entityType}{" "}
                  {log.actor?.email ? `· ${log.actor.email}` : ""} ·{" "}
                  {new Date(log.createdAt).toLocaleString()}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {auditLogs.length > 0 && (
        <div className="rounded border border-slate-700 p-4">
          <h2 className="mb-2 font-semibold">Full audit log (latest 100)</h2>
          <div className="max-h-96 overflow-y-auto text-xs">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-600 text-slate-400">
                  <th className="p-2">Time</th>
                  <th className="p-2">Action</th>
                  <th className="p-2">Entity</th>
                  <th className="p-2">Actor</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-800">
                    <td className="p-2 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-2">{log.action}</td>
                    <td className="p-2">
                      {log.entityType} {log.entityId ? `(${log.entityId.slice(0, 8)}…)` : ""}
                    </td>
                    <td className="p-2">{log.actor?.email || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

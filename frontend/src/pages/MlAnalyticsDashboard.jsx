import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { getMlAnalytics } from "../services/securityService";
import { ChevronDown, AlertCircle } from "lucide-react";

const COLORS = ["#10b981", "#f59e0b", "#ef4444"]; // Normal, Suspicious, Anomalous

const LEVEL_STYLES = {
  CRITICAL: "bg-red-500/20 text-red-400 border border-red-500/30",
  HIGH: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
  MEDIUM: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  LOW: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
};

export default function MlAnalyticsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedAlert, setExpandedAlert] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await getMlAnalytics();
        setData(response.data);
      } catch (err) {
        setError(err.message || "Failed to load ML analytics.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <div className="p-6 text-slate-400">Loading analytics...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!data) return <div className="p-6 text-slate-400">No data available.</div>;

  const { timeline, distribution, stats, alerts = [] } = data;

  const formattedTimeline = timeline.map((t) => ({
    ...t,
    time: new Date(t.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  }));

  const pieData = [
    { name: "Normal", value: distribution.normal },
    { name: "Suspicious", value: distribution.suspicious },
    { name: "Anomalous", value: distribution.anomalous },
  ];

  const barData = [
    {
      name: "Traffic Volume",
      Normal: distribution.normal,
      Suspicious: distribution.suspicious,
      Anomalous: distribution.anomalous,
    },
  ];

  const totalAlerts = alerts.length;
  const highRiskAlerts = alerts.filter(a => a.level === "HIGH" || a.level === "CRITICAL").length;
  
  // Calculate Current Risk (from the most recent alert, or 0)
  const currentRisk = alerts.length > 0 ? alerts[0].risk : 0;
  let currentRiskLevel = "LOW";
  let riskColor = "text-blue-400";
  if (currentRisk >= 75) { currentRiskLevel = "HIGH"; riskColor = "text-red-400"; }
  else if (currentRisk >= 40) { currentRiskLevel = "MEDIUM"; riskColor = "text-yellow-400"; }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Security Analytics</h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time threat monitoring and machine learning telemetry.
          </p>
        </div>
      </div>

      {/* TOP: KPI Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <div className="rounded-xl border border-slate-800 bg-[#0d1526] p-4 text-center">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Alerts</h3>
          <p className="mt-2 text-3xl font-bold text-slate-100">{totalAlerts}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-[#0d1526] p-4 text-center">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">High Risk</h3>
          <p className="mt-2 text-3xl font-bold text-red-500">{highRiskAlerts}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-[#0d1526] p-4 text-center">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Anomalies</h3>
          <p className="mt-2 text-3xl font-bold text-amber-500">{distribution.anomalous}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-[#0d1526] p-4 text-center">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Peak Risk</h3>
          <p className="mt-2 text-3xl font-bold text-red-400">{stats.peakRisk}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-[#0d1526] p-4 text-center shadow-[inset_0_0_20px_rgba(0,0,0,0.2)]">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Current Risk</h3>
          <p className={`mt-2 text-3xl font-bold ${riskColor}`}>{currentRisk}</p>
          <span className={`text-[10px] uppercase font-bold tracking-widest ${riskColor}`}>{currentRiskLevel}</span>
        </div>
      </div>

      {/* MIDDLE: Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-[#0d1526] p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">Risk Score Over Time</h2>
          <div className="h-64 w-full">
            {formattedTimeline.length === 0 ? (
              <div className="flex h-full items-center justify-center text-slate-500 text-sm">No timeline data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formattedTimeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#64748b" domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "8px" }} />
                  <Line type="monotone" dataKey="riskScore" name="Risk Score" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0d1526] p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">Traffic Distribution</h2>
          <div className="flex h-64 gap-2">
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} stroke="none" dataKey="value" paddingAngle={5}>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "8px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 flex flex-col justify-center gap-3 space-y-1">
              {pieData.map((entry, i) => (
                <div key={entry.name} className="flex items-center gap-2 text-sm text-slate-300">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span>{entry.name} ({entry.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="col-span-1 lg:col-span-2 rounded-xl border border-slate-800 bg-[#0d1526] p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">Total Traffic Comparison</h2>
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ left: 80, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" stroke="#64748b" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "8px" }} />
                <Bar dataKey="Normal" stackId="a" fill="#10b981" radius={[4, 0, 0, 4]} />
                <Bar dataKey="Suspicious" stackId="a" fill="#f59e0b" />
                <Bar dataKey="Anomalous" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* BOTTOM: Alerts Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1526] overflow-hidden">
        <div className="border-b border-slate-800 px-5 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-100">Recent Security Alerts</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-sm">
            <thead>
              <tr className="bg-[#0b1120]">
                {["Date", "Type", "Title", "Risk", "Level"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 transition-all">
              {alerts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">No alerts found.</td>
                </tr>
              ) : (
                alerts.map((alert) => {
                  const isExpanded = expandedAlert === alert.id;
                  const levelClass = LEVEL_STYLES[alert.level] || LEVEL_STYLES.LOW;

                  return (
                    <React.Fragment key={alert.id}>
                      <tr
                        onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
                        className={`cursor-pointer transition-colors ${isExpanded ? "bg-slate-800/60" : "hover:bg-slate-800/40"}`}
                      >
                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                          {new Date(alert.timestamp).toLocaleDateString()} {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-400">{alert.type.replace("ML_", "")}</td>
                        <td className="px-4 py-3 font-medium text-slate-200">
                          <div className="flex items-center gap-2">
                            {alert.level === "CRITICAL" || alert.level === "HIGH" ? (
                              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                            ) : null}
                            <span className="truncate max-w-sm block">{alert.title}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-300">{alert.risk}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${levelClass}`}>
                            {alert.level}
                          </span>
                        </td>
                      </tr>
                      {/* Expanded "Why Flagged" Drawer */}
                      {isExpanded && (
                        <tr className="bg-slate-900/50">
                          <td colSpan={5} className="px-4 py-4 border-l-2 border-l-blue-500">
                            <div className="pl-2">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-2 flex items-center gap-1">
                                <ChevronDown className="h-4 w-4" /> Why Flagged
                              </h4>
                              {alert.reasons && alert.reasons.length > 0 ? (
                                <ul className="space-y-1 list-disc list-inside text-slate-300 text-xs">
                                  {alert.reasons.map((r, i) => (
                                    <li key={i}>{r}</li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-xs text-slate-500 italic">No specific extracted features available.</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

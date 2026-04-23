import { useNavigate } from "react-router-dom";
import { Eye, Edit3 } from "lucide-react";

const SEVERITY_STYLES = {
  CRITICAL: "bg-red-500/20 text-red-400 border border-red-500/30",
  HIGH: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
  MEDIUM: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  LOW: "bg-green-500/20 text-green-400 border border-green-500/30",
};

const STATUS_STYLES = {
  OPEN: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  IN_PROGRESS: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  RESOLVED: "bg-green-500/20 text-green-400 border border-green-500/30",
  CLOSED: "bg-slate-500/20 text-slate-400 border border-slate-500/30",
};

const SECURITY_STYLES = {
  NORMAL: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  "MEDIUM RISK": "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  "HIGH RISK": "bg-red-500/20 text-red-400 border border-red-500/30",
};

function Badge({ value, styleMap, fallback = "bg-slate-700/40 text-slate-400" }) {
  const safeValue = typeof value === "string" ? value : String(value || "");
  const style = (styleMap && styleMap[safeValue]) ? styleMap[safeValue] : fallback;
  return (
    <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {safeValue.replace("_", " ") || "—"}
    </span>
  );
}

export default function DeveloperBugTable({ bugs = [], currentUserId, onSelect }) {
  const navigate = useNavigate();

  if (bugs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500 text-sm">
        No bugs available.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800">
      <table className="min-w-full divide-y divide-slate-800 text-sm">
        <thead>
          <tr className="bg-[#0b1120]">
            {["Bug ID", "Title", "Severity", "ML Risk", "Status", "Assigned To", "Action"].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 bg-[#0d1526]">
          {bugs.map((bug) => {
            const isAssignedToMe = bug.assigneeId === currentUserId;

            return (
              <tr 
                key={bug.id} 
                className={`transition-colors ${isAssignedToMe ? "bg-blue-900/10 hover:bg-blue-900/20" : "hover:bg-slate-800/40"}`}
              >
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{bug.id.slice(0, 8)}…</td>
                <td className="px-4 py-3 font-medium text-slate-200 max-w-[200px] truncate">{bug.title}</td>
                <td className="px-4 py-3">
                  <Badge value={bug.priority} styleMap={SEVERITY_STYLES} />
                </td>
                <td className="px-4 py-3">
                  {bug.securityTag ? (
                    <div className="flex flex-col gap-1 items-start">
                      <span className="text-xs font-mono text-slate-400">{bug.riskScore?.toFixed(2)}</span>
                      <Badge value={bug.securityTag} styleMap={SECURITY_STYLES} />
                    </div>
                  ) : (
                    <span className="text-xs text-slate-600">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge value={bug.status} styleMap={STATUS_STYLES} />
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-300">
                  {bug.assignedToDevCode || <span className="text-slate-600">Unassigned</span>}
                </td>
                <td className="px-4 py-3">
                  {isAssignedToMe ? (
                    <button
                      onClick={() => onSelect ? onSelect(bug) : navigate(`/developer/work-status?bugId=${bug.id}`)}
                      className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-blue-900/20 hover:bg-blue-500 transition-colors whitespace-nowrap"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Edit
                    </button>
                  ) : (
                    <button
                      onClick={() => onSelect ? onSelect(bug) : navigate(`/developer/work-status?bugId=${bug.id}`)}
                      className="flex items-center gap-1.5 rounded-lg bg-slate-800/80 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors whitespace-nowrap"
                    >
                      <Eye className="h-3.5 w-3.5 text-slate-400" />
                      View Only
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

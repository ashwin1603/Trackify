import { useNavigate } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";

const PRIORITY_STYLES = {
  HIGH: "bg-red-500/20 text-red-400 border border-red-500/30",
  MEDIUM: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  LOW: "bg-green-500/20 text-green-400 border border-green-500/30",
};

const STATUS_STYLES = {
  OPEN: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  IN_PROGRESS: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
  RESOLVED: "bg-green-500/20 text-green-400 border border-green-500/30",
  CLOSED: "bg-slate-500/20 text-slate-400 border border-slate-500/30",
};

function Badge({ value, styleMap }) {
  const safeValue = typeof value === "string" ? value : String(value || "");
  const style = (styleMap && styleMap[safeValue]) ? styleMap[safeValue] : "bg-slate-700 text-slate-300";
  return (
    <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {safeValue.replace("_", " ")}
    </span>
  );
}

/**
 * BugTable
 * Props:
 *   bugs: array
 *   onDelete?: (id) => void
 *   showActions?: boolean
 */
export default function BugTable({ bugs = [], onDelete, showActions = true }) {
  const navigate = useNavigate();

  if (bugs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <p className="text-sm">No bugs found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800">
      <table className="min-w-full divide-y divide-slate-800 text-sm">
        <thead>
          <tr className="bg-[#0b1120]">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Bug ID</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Bug Title</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Assigned To</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Priority</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
            {showActions && (
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 bg-[#0d1526]">
          {bugs.map((bug) => (
            <tr key={bug.id} className="hover:bg-slate-800/40 transition-colors">
              <td className="px-4 py-3 font-mono text-xs text-slate-500">{bug.id.slice(0, 8)}…</td>
              <td className="px-4 py-3 font-medium text-slate-200">{bug.title}</td>
              <td className="px-4 py-3 text-slate-400">
                {bug.assignee?.name || <span className="italic text-slate-600">Unassigned</span>}
              </td>
              <td className="px-4 py-3">
                <Badge value={bug.priority} styleMap={PRIORITY_STYLES} />
              </td>
              <td className="px-4 py-3">
                <Badge value={bug.status} styleMap={STATUS_STYLES} />
              </td>
              {showActions && (
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/bugs/${bug.id}`)}
                      className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600/10 text-blue-400 hover:bg-blue-600/30 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    {onDelete && (
                      <button
                        onClick={() => onDelete(bug.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-md bg-red-600/10 text-red-400 hover:bg-red-600/30 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

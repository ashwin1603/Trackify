import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, X, Send, AlertCircle } from "lucide-react";
import { updateBug, addComment } from "../../services/bugService";

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

const FIELD_CLASS =
  "w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/40 transition disabled:opacity-50 disabled:cursor-not-allowed";
const LABEL_CLASS = "block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5";

function Badge({ value, styleMap }) {
  const safeValue = typeof value === "string" ? value : String(value || "");
  const style = (styleMap && styleMap[safeValue]) ? styleMap[safeValue] : "bg-slate-700/40 text-slate-400";
  return (
    <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {safeValue.replace("_", " ")}
    </span>
  );
}

export default function WorkStatusPanel({ bug, currentUser, onDone, onCancel }) {
  const navigate = useNavigate();
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState(bug.status || "IN_PROGRESS");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const isAssignedToMe = bug.assigneeId === currentUser?.id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAssignedToMe) return;

    setError("");
    setLoading(true);
    try {
      // Update status
      await updateBug(bug.id, { status });
      // Save dev notes as a comment if provided
      if (notes.trim()) {
        await addComment({ bugId: bug.id, content: `[Developer Update] ${notes.trim()}` });
      }
      setSuccess(true);
      setTimeout(() => {
        if (onDone) onDone();
        else navigate("/developer");
      }, 1400);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 py-10">
        <CheckCircle2 className="h-10 w-10 text-green-400" />
        <p className="text-sm font-semibold text-green-300">Update submitted successfully!</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!isAssignedToMe && (
        <div className="flex items-center gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
          <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
          <p className="text-sm text-yellow-200">
            <strong className="font-semibold text-yellow-400">View Only Mode:</strong> This bug is assigned to {bug.assignedToDevCode || "another developer"}. Only the assigned developer can update its status.
          </p>
        </div>
      )}

      {/* Bug Detail Card */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1526] p-5 space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Bug Details</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-slate-500 mb-1">Bug ID</p>
            <p className="font-mono text-xs text-slate-300">{bug.id.slice(0, 8)}…</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Severity</p>
            <Badge value={bug.priority} styleMap={SEVERITY_STYLES} />
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">ML Risk</p>
            {bug.securityTag ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">{bug.riskScore?.toFixed(2)}</span>
                <Badge value={bug.securityTag} styleMap={SECURITY_STYLES} />
              </div>
            ) : (
               <span className="text-xs text-slate-600">—</span>
            )}
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Current Status</p>
            <Badge value={bug.status} styleMap={STATUS_STYLES} />
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Assigned To</p>
            <p className="font-mono text-xs font-semibold text-blue-400">{bug.assignedToDevCode || "Unassigned"}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-slate-500 mb-1">Bug Title</p>
            <p className="text-sm font-semibold text-slate-100">{bug.title}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-slate-500 mb-1">Assigned Date</p>
            <p className="text-sm text-slate-300">{new Date(bug.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        {bug.description && (
          <div>
            <p className="text-xs text-slate-500 mb-1">Description</p>
            <p className="text-sm text-slate-300 leading-relaxed">{bug.description}</p>
          </div>
        )}
      </div>

      {/* Developer Action Section */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1526] p-5 space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Developer Action</h3>

        <div>
          <label className={LABEL_CLASS}>Developer Update Description</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={!isAssignedToMe}
            rows={4}
            placeholder={isAssignedToMe ? "Describe changes, fixes, or progress made on this bug…" : "You cannot add notes to a bug that is not assigned to you."}
            className={FIELD_CLASS + " resize-none"}
          />
        </div>

        <div>
          <label className={LABEL_CLASS}>Update Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={!isAssignedToMe}
            className={FIELD_CLASS}
          >
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Completed — Send to Tester</option>
            <option value="CLOSED">Ongoing (mark closed)</option>
          </select>
        </div>

        {error && (
          <p className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
            <X className="h-4 w-4 flex-shrink-0" />
            {error}
          </p>
        )}

        <div className="flex items-center gap-3 pt-1">
          {isAssignedToMe && (
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 hover:bg-blue-500 disabled:opacity-50 transition-colors"
            >
              <Send className="h-4 w-4" />
              {loading ? "Submitting…" : "Update and Send to Tester"}
            </button>
          )}
          <button
            type="button"
            onClick={() => onCancel ? onCancel() : navigate("/developer")}
            className="rounded-lg border border-slate-700 bg-slate-800/50 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
          >
            {isAssignedToMe ? "Cancel" : "Go Back"}
          </button>
        </div>
      </div>
    </form>
  );
}

import { useState } from "react";
import { UploadCloud, X } from "lucide-react";

const INPUT_CLASS =
  "w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/40 transition";
const LABEL_CLASS = "block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5";
const SELECT_CLASS = INPUT_CLASS;

/**
 * AdminBugForm
 * Props:
 *   onSubmit: (payload) => Promise
 *   onCancel?: () => void
 *   initialData?: object
 *   submitLabel?: string
 */
export default function AdminBugForm({
  onSubmit,
  onCancel,
  initialData,
  submitLabel = "Submit Bug",
}) {
  const [form, setForm] = useState(
    initialData || {
      title: "",
      description: "",
      status: "OPEN",
      priority: "MEDIUM",
      assigneeEmail: "",
    }
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file) setFileName(file.name);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onSubmit({
        title: form.title,
        description: form.description,
        status: form.status,
        assigneeEmail: form.assigneeEmail || null,
      });
      if (!initialData) {
        setForm({ title: "", description: "", status: "OPEN", priority: "MEDIUM", assigneeEmail: "" });
        setFileName("");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Row 1 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={LABEL_CLASS}>Bug Title</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="e.g. Login button crashes on mobile"
            className={INPUT_CLASS}
            required
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>Priority</label>
          <select name="priority" value={form.priority} onChange={handleChange} className={SELECT_CLASS}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className={LABEL_CLASS}>Short Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Describe the bug in detail…"
          rows={4}
          className={INPUT_CLASS + " resize-none"}
        />
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={LABEL_CLASS}>Assign To (Developer Email)</label>
          <input
            name="assigneeEmail"
            type="email"
            value={form.assigneeEmail}
            onChange={handleChange}
            placeholder="Optional — e.g. dev@example.com"
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>Status</label>
          <select name="status" value={form.status} onChange={handleChange} className={SELECT_CLASS}>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* File upload */}
      <div>
        <label className={LABEL_CLASS}>Attachment (optional)</label>
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-700 bg-slate-800/30 py-8 text-slate-500 hover:border-blue-500/50 hover:text-slate-300 transition-colors">
          <UploadCloud className="mb-2 h-8 w-8" />
          <span className="text-sm">
            {fileName ? (
               <span className="text-blue-400">{fileName}</span>
            ) : (
              "Click to upload or drag & drop"
            )}
          </span>
          <span className="mt-1 text-xs text-slate-600">PNG, JPG, PDF up to 10MB</span>
          <input type="file" className="hidden" onChange={handleFile} />
        </label>
      </div>

      {error && (
        <p className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
          <X className="h-4 w-4 flex-shrink-0" />
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 hover:bg-blue-500 disabled:opacity-50 transition-colors"
        >
          {loading ? "Submitting…" : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-700 bg-slate-800/50 px-6 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

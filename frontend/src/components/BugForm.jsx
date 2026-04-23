import { useState } from "react";

export default function BugForm({ onSubmit, initialData, submitLabel = "Save Bug" }) {
  const [form, setForm] = useState(
    initialData || { title: "", description: "", status: "OPEN", assigneeId: "" }
  );
  const [error, setError] = useState("");

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await onSubmit({
        ...form,
        assigneeId: form.assigneeId || null,
      });
      if (!initialData) {
        setForm({ title: "", description: "", status: "OPEN", assigneeId: "" });
      }
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded border border-slate-700 p-4">
      <input
        name="title"
        value={form.title}
        onChange={handleChange}
        placeholder="Bug title"
        className="w-full rounded bg-slate-800 p-2"
      />
      <textarea
        name="description"
        value={form.description}
        onChange={handleChange}
        placeholder="Bug description"
        className="h-28 w-full rounded bg-slate-800 p-2"
      />
      <div className="grid grid-cols-2 gap-2">
        <select
          name="status"
          value={form.status}
          onChange={handleChange}
          className="rounded bg-slate-800 p-2"
        >
          <option value="OPEN">OPEN</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="RESOLVED">RESOLVED</option>
          <option value="CLOSED">CLOSED</option>
        </select>
        <input
          name="assigneeId"
          value={form.assigneeId}
          onChange={handleChange}
          placeholder="Assignee user ID (optional)"
          className="rounded bg-slate-800 p-2"
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button className="rounded bg-cyan-600 px-4 py-2">{submitLabel}</button>
    </form>
  );
}

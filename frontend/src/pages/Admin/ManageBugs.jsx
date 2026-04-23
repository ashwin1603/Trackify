import { useEffect, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import BugTable from "../../components/bug/BugTable";
import { getBugs, deleteBug } from "../../services/bugService";

export default function ManageBugs() {
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const loadBugs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const result = await getBugs(params);
      setBugs(result.data || []);
    } catch {
      setBugs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBugs();
  }, []);

  const handleDelete = async (id) => {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      return;
    }
    try {
      await deleteBug(id);
      setDeleteConfirm(null);
      await loadBugs();
    } catch {
      setDeleteConfirm(null);
    }
  };

  // Client-side priority filter (since API doesn't support it directly)
  const displayed = bugs.filter((b) => {
    const matchesPriority = priorityFilter ? b.priority === priorityFilter : true;
    return matchesPriority;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Manage Bugs</h1>
        <p className="mt-1 text-sm text-slate-500">
          View, filter, and manage all reported bugs.{" "}
          <span className="font-medium text-slate-400">{displayed.length} bug{displayed.length !== 1 ? "s" : ""} found.</span>
        </p>
      </div>

      {/* Delete confirmation banner */}
      {deleteConfirm && (
        <div className="flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3">
          <p className="text-sm text-red-300">
            Click <strong>Delete</strong> again to confirm removal of this bug.
          </p>
          <button
            onClick={() => setDeleteConfirm(null)}
            className="text-xs text-red-400 underline hover:no-underline"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Filters card */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1526] px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <input
              placeholder="Search by title or description…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadBugs()}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/60 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>

            {/* Priority filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Priorities</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <button
              onClick={loadBugs}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1526]">
        {loading ? (
          <p className="py-12 text-center text-sm text-slate-500">Loading bugs…</p>
        ) : (
          <>
            {/* Extra date column handled inline via extended table */}
            <div className="overflow-x-auto rounded-xl">
              <table className="min-w-full divide-y divide-slate-800 text-sm">
                <thead>
                  <tr className="bg-[#0b1120]">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Bug ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Assigned To</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Priority</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-[#0d1526]">
                  {displayed.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-sm text-slate-500">
                        No bugs match your filters.
                      </td>
                    </tr>
                  ) : (
                    displayed.map((bug) => (
                      <ManageBugRow
                        key={bug.id}
                        bug={bug}
                        onDelete={handleDelete}
                        isConfirming={deleteConfirm === bug.id}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

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

import { useNavigate } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";

function ManageBugRow({ bug, onDelete, isConfirming }) {
  const navigate = useNavigate();
  return (
    <tr className={`transition-colors ${isConfirming ? "bg-red-900/10" : "hover:bg-slate-800/40"}`}>
      <td className="px-4 py-3 font-mono text-xs text-slate-500">{bug.id.slice(0, 8)}…</td>
      <td className="px-4 py-3 font-medium text-slate-200 max-w-[200px] truncate">{bug.title}</td>
      <td className="px-4 py-3 text-slate-400">
        {bug.assignee?.name || <span className="italic text-slate-600">Unassigned</span>}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium ${PRIORITY_STYLES[bug.priority] || "bg-slate-700 text-slate-300"}`}>
          {bug.priority}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[bug.status] || "bg-slate-700 text-slate-300"}`}>
          {bug.status}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-slate-500">
        {new Date(bug.createdAt).toLocaleDateString()}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/bugs/${bug.id}`)}
            className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600/10 text-blue-400 hover:bg-blue-600/30 transition-colors"
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(bug.id)}
            className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
              isConfirming
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-red-600/10 text-red-400 hover:bg-red-600/30"
            }`}
            title={isConfirming ? "Confirm delete" : "Delete"}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

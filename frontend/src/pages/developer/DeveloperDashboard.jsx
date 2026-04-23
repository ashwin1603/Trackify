import { useEffect, useState } from "react";
import { Search, SlidersHorizontal, Bug as BugIcon } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getBugs } from "../../services/bugService";
import DeveloperBugTable from "../../components/developer/AssignedBugTable";

export default function DeveloperDashboard() {
  const { user } = useAuth();
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Fetch all bugs, the backend ignores assigneeId for developers anyway,
        // but removing the param makes the intention clear on frontend too.
        const result = await getBugs({});
        setBugs(result.data || []);
      } catch {
        setBugs([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.id]);

  // Client-side filter
  const displayed = bugs.filter((b) => {
    const matchesSearch =
      !search ||
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.description?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || b.status === statusFilter;
    const matchesPriority = !priorityFilter || b.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const openCount = bugs.filter((b) => b.status === "OPEN").length;
  const inProgressCount = bugs.filter((b) => b.status === "IN_PROGRESS").length;
  const resolvedCount = bugs.filter((b) => b.status === "RESOLVED" || b.status === "CLOSED").length;

  return (
    <div className="space-y-7">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">All Bugs Queue</h1>
        <p className="mt-1 text-sm text-slate-500">
          Viewing all system bugs. Bugs assigned to <span className="font-medium text-slate-300">{user?.name}</span> are highlighted.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Open", value: loading ? "…" : openCount, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
          { label: "In Progress", value: loading ? "…" : inProgressCount, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
          { label: "Resolved", value: loading ? "…" : resolvedCount, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`flex items-center gap-4 rounded-xl border ${bg} p-5`}>
            <BugIcon className={`h-6 w-6 flex-shrink-0 ${color}`} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
              <p className={`mt-0.5 text-2xl font-bold ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1526] px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <input
              placeholder="Search by title or description…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/60 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
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
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Severity</option>
              <option value="HIGH">High (Critical)</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1526]">
        <div className="border-b border-slate-800 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-100">
            Bug Queue
            <span className="ml-2 text-sm font-normal text-slate-500">
              ({displayed.length} result{displayed.length !== 1 ? "s" : ""})
            </span>
          </h2>
        </div>
        {loading ? (
          <p className="py-12 text-center text-sm text-slate-500">Loading bugs…</p>
        ) : (
          <DeveloperBugTable bugs={displayed} currentUserId={user?.id} />
        )}
      </div>
    </div>
  );
}

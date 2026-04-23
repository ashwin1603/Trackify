import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BugList from "../components/BugList";

import { getBugs } from "../services/bugService";
import { useAuth } from "../context/AuthContext";
import { ROLES } from "../utils/permissions";

export default function BugListPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({ search: "", status: user?.role === ROLES.TESTER ? "RESOLVED" : "" });
  const [bugs, setBugs] = useState([]);

  const loadBugs = async () => {
    const data = await getBugs(filters);
    setBugs(data.data || []);
  };

  useEffect(() => {
    loadBugs().catch(() => {});
  }, []);

  return (
    <section className="space-y-4">
      {user?.role === ROLES.TESTER && /<script>|drop table|union select|1=1|alter table/i.test(filters.search) && (
        <div className="rounded-lg border border-red-500 bg-red-500/10 p-4 text-sm font-bold text-red-500">
          WARNING: Risky input detected! This search query resembles a malicious injection pattern and will be logged.
        </div>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Bugs</h1>
        {user?.role === ROLES.ADMIN && (
          <Link to="/bugs/new" className="rounded bg-cyan-600 px-4 py-2">
            Create Bug
          </Link>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <input
          placeholder="Search title/description"
          value={filters.search}
          onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
          className="rounded bg-slate-800 p-2"
        />
        <select
          value={filters.status}
          onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
          className="rounded bg-slate-800 p-2"
        >
          <option value="">All Statuses</option>
          <option value="OPEN">OPEN</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="RESOLVED">RESOLVED</option>
          <option value="CLOSED">CLOSED</option>
        </select>
        <button onClick={loadBugs} className="rounded bg-slate-700 p-2">
          Apply Filters
        </button>
      </div>
      <BugList bugs={bugs} />
    </section>
  );
}

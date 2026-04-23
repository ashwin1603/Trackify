import { Link } from "react-router-dom";

export default function BugList({ bugs }) {
  return (
    <div className="space-y-3">
      {bugs.map((bug) => (
        <Link
          key={bug.id}
          to={`/bugs/${bug.id}`}
          className="block rounded border border-slate-700 p-4 hover:border-cyan-500"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{bug.title}</h3>
            <span className="rounded bg-slate-800 px-2 py-1 text-xs">{bug.status}</span>
          </div>
          <p className="mt-2 text-sm text-slate-300">{bug.description}</p>
          <div className="mt-2 text-xs text-slate-400">Priority: {bug.priority}</div>
        </Link>
      ))}
    </div>
  );
}

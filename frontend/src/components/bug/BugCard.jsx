/**
 * BugCard — a stat card for the dashboard overview.
 * Props: icon (React node), label, value, accent (tailwind color name)
 */
export default function BugCard({ icon, label, value, accent = "blue" }) {
  const accents = {
    blue: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    amber: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    green: "bg-green-500/10 border-green-500/20 text-green-400",
    red: "bg-red-500/10 border-red-500/20 text-red-400",
    purple: "bg-purple-500/10 border-purple-500/20 text-purple-400",
  };

  const iconStyle = accents[accent] || accents.blue;

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0d1526] p-5 flex items-start gap-4 shadow-sm hover:border-slate-700 transition-colors">
      <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg border ${iconStyle}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-bold text-slate-100">{value ?? "—"}</p>
      </div>
    </div>
  );
}

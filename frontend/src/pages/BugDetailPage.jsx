import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { addComment, deleteBug, getBug, updateBug } from "../services/bugService";
import RoleGate from "../components/RoleGate";
import { PERMISSIONS, ROLES } from "../utils/permissions";
import { useAuth } from "../context/AuthContext";

export default function BugDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bug, setBug] = useState(null);
  const [comment, setComment] = useState("");

  const loadBug = async () => {
    const data = await getBug(id);
    setBug(data.data);
  };

  useEffect(() => {
    loadBug().catch(() => {});
  }, [id]);

  const onStatusChange = async (status) => {
    await updateBug(id, { status });
    await loadBug();
  };

  const onDelete = async () => {
    await deleteBug(id);
    navigate("/bugs");
  };

  const onAddComment = async () => {
    if (!comment.trim()) return;
    await addComment({ bugId: id, content: comment });
    setComment("");
    await loadBug();
  };

  if (!bug) return <div>Loading bug...</div>;

  return (
    <section className="space-y-4">
      <div className="rounded border border-slate-700 p-4">
        <h1 className="text-2xl font-semibold">{bug.title}</h1>
        <p className="mt-2 text-slate-300">{bug.description}</p>
        <div className="mt-3 flex items-center gap-2">
          <span className="rounded bg-slate-800 px-2 py-1">{bug.status}</span>
          <span className="text-sm text-slate-400">Priority: {bug.priority}</span>
        </div>
      </div>

      <RoleGate permission={PERMISSIONS.UPDATE_BUG}>
        <div className="flex gap-2">
          {["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((status) => (
            <button
              key={status}
              onClick={() => onStatusChange(status)}
              className="rounded bg-slate-700 px-3 py-1 text-sm"
            >
              {status}
            </button>
          ))}
        </div>
      </RoleGate>

      <RoleGate permission={PERMISSIONS.DELETE_BUG}>
        <button onClick={onDelete} className="rounded bg-red-600 px-4 py-2">
          Delete Bug
        </button>
      </RoleGate>

      <div className="rounded border border-slate-700 p-4">
        <h2 className="mb-3 font-semibold">Comments</h2>
        <div className="space-y-2">
          {(bug.comments || []).map((entry) => (
            <div key={entry.id} className="rounded bg-slate-800 p-2 text-sm">
              <div className="text-slate-300">{entry.content}</div>
              <div className="mt-1 text-xs text-slate-400">By {entry.author?.name}</div>
            </div>
          ))}
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="mt-3 h-24 w-full rounded bg-slate-800 p-2"
          placeholder="Add comment"
        />
        {user?.role === ROLES.TESTER && /<script>|drop table|union select|1=1|alter table/i.test(comment) && (
          <div className="mt-2 rounded-lg border border-red-500 bg-red-500/10 p-4 text-sm font-bold text-red-500">
            WARNING: Risky input detected! This comment resembles a malicious injection pattern and will be logged.
          </div>
        )}
        <button onClick={onAddComment} className="mt-2 rounded bg-cyan-600 px-4 py-2">
          Submit Comment
        </button>
      </div>
    </section>
  );
}

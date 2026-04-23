import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import AdminBugForm from "../../components/bug/BugForm";
import { createBug, assignBug } from "../../services/bugService";

export default function AddBug() {
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);

  const onSubmit = async (payload) => {
    // Separate assigneeEmail to run as a separate API call per the backend design
    const { assigneeEmail, ...bugData } = payload;
    
    // 1. Create the bug without assigneeId first (as we need the bug ID)
    const created = await createBug({ ...bugData, assigneeId: null });
    const bugId = created.data.id;

    // 2. If email was provided, call the assign endpoint
    if (assigneeEmail) {
      await assignBug(bugId, assigneeEmail);
    }

    setSuccess(true);
    setTimeout(() => {
      navigate(`/bugs/${bugId}`);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Add Bug</h1>
        <p className="mt-1 text-sm text-slate-500">Report a new bug or issue into the tracking system.</p>
      </div>

      {/* Success toast */}
      {success && (
        <div className="flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 px-5 py-4 text-green-400">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">Bug reported successfully! Redirecting…</p>
        </div>
      )}

      {/* Form card */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1526] p-6">
        <AdminBugForm
          onSubmit={onSubmit}
          onCancel={() => navigate("/admin")}
          submitLabel="Submit Bug"
        />
      </div>
    </div>
  );
}

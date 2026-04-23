import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, AlertTriangle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getBugs, getBug } from "../../services/bugService";
import WorkStatusPanel from "../../components/developer/WorkStatusPanel";
import DeveloperBugTable from "../../components/developer/AssignedBugTable";

export default function WorkStatusPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialBugId = searchParams.get("bugId");

  const [bugs, setBugs] = useState([]);
  const [selectedBug, setSelectedBug] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load bugs for selection list
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const result = await getBugs({});
        const all = result.data || [];
        setBugs(all);

        // Auto-select bug if bugId is in query string
        if (initialBugId) {
          const found = all.find((b) => b.id === initialBugId);
          if (found) {
            setSelectedBug(found);
          } else {
            // Fallback: fetch directly
            try {
              const single = await getBug(initialBugId);
              setSelectedBug(single.data);
            } catch {
              setError("Bug not found.");
            }
          }
        }
      } catch {
        setError("Failed to load bugs.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [initialBugId]);

  const handleDone = async () => {
    // Refresh and deselect
    setSelectedBug(null);
    try {
      const result = await getBugs({});
      setBugs(result.data || []);
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        {selectedBug && (
          <button
            onClick={() => setSelectedBug(null)}
            className="flex items-center gap-1 text-slate-400 hover:text-slate-100 text-sm transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
        )}
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Work Status Panel</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {selectedBug
              ? "Update bug status and submit your developer notes."
              : "Select a bug below to update its work status."}
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-3 text-amber-400 text-sm">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <p className="py-16 text-center text-sm text-slate-500">Loading…</p>
      ) : selectedBug ? (
        <WorkStatusPanel
          bug={selectedBug}
          currentUser={user}
          onDone={handleDone}
          onCancel={() => setSelectedBug(null)}
        />
      ) : (
        /* Bug selection list */
        <div className="rounded-xl border border-slate-800 bg-[#0d1526]">
          <div className="border-b border-slate-800 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-100">
              Bug Queue
              <span className="ml-2 text-sm font-normal text-slate-500">
                — click <strong className="text-blue-400">Edit / View Only</strong> to open the work panel
              </span>
            </h2>
          </div>
          <DeveloperBugTable bugs={bugs} currentUserId={user?.id} onSelect={(bug) => setSelectedBug(bug)} />
        </div>
      )}
    </div>
  );
}

import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROLES } from "../utils/permissions";

/**
 * Only SECURITY_TEAM may access wrapped routes.
 * Unauthenticated users → /login.
 * Other authenticated roles → inline 403 Access Denied page.
 */
export default function SecurityTeamRoute({ children }) {
  const { user, token } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== ROLES.SECURITY_TEAM) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 text-slate-100">
        <div className="rounded-lg border border-red-700 bg-slate-900 px-10 py-8 text-center shadow-lg">
          <h1 className="mb-2 text-3xl font-bold text-red-500">403 — Access Denied</h1>
          <p className="text-slate-400">
            This area is restricted to the <span className="font-semibold text-cyan-400">SECURITY_TEAM</span> only.
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Your current role (<span className="font-semibold text-slate-300">{user?.role}</span>) does not have permission to view this page.
          </p>
          <Navigate to="/" replace />
        </div>
      </div>
    );
  }

  return children;
}

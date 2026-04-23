import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROLES } from "../utils/permissions";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  const isAdmin = user?.role === ROLES.ADMIN;
  const isSecurityTeam = user?.role === ROLES.SECURITY_TEAM;

  return (
    <header className="border-b border-slate-800 bg-slate-900">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="font-semibold text-cyan-400">
          Trackify
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {/* ADMIN uses the sidebar — no nav links here */}
          {!isAdmin && !isSecurityTeam && <Link to="/bugs">Bugs</Link>}
          {isSecurityTeam && <Link to="/security">Security</Link>}
          {isAdmin && (
            <Link to="/admin" className="text-blue-400 hover:text-blue-300">
              Admin Panel
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <span>{user?.name}</span>
          <span className="rounded bg-slate-800 px-2 py-1">{user?.role}</span>
          <button onClick={onLogout} className="rounded bg-red-600 px-3 py-1">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

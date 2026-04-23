import { Bell, UserCircle, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AdminNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-slate-800 bg-[#0d1526] px-6">
      {/* Title */}
      <div>
        <h1 className="text-sm font-semibold text-slate-100 tracking-wide">
          Software Bugs and Issue Tracking System
        </h1>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-4">
        {/* Notification icon */}
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-100 transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-blue-500 ring-2 ring-[#0d1526]" />
        </button>

        {/* Profile */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600/20 border border-blue-500/40">
            <UserCircle className="h-5 w-5 text-blue-400" />
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-slate-100 leading-tight">{user?.name || "Admin User"}</p>
            <p className="text-xs text-slate-500 leading-tight">{user?.role}</p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Logout
        </button>
      </div>
    </header>
  );
}

import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import AdminNavbar from "./AdminNavbar";

/**
 * AdminLayout
 * Wraps all /admin/* routes with the fixed sidebar + top navbar shell.
 */
export default function AdminLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0f172a] text-slate-100">
      {/* Fixed left sidebar */}
      <Sidebar />

      {/* Main area — flex column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top navbar */}
        <AdminNavbar />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

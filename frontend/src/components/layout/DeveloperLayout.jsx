import { Outlet } from "react-router-dom";
import DeveloperSidebar from "./DeveloperSidebar";
import AdminNavbar from "./AdminNavbar";

export default function DeveloperLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0f172a] text-slate-100">
      <DeveloperSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminNavbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

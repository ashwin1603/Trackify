import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// Auth pages
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";

// Standard user pages (TESTER)
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardPage from "./pages/DashboardPage";
import BugListPage from "./pages/BugListPage";
import BugDetailPage from "./pages/BugDetailPage";
import CreateBugPage from "./pages/CreateBugPage";

// Security Team pages
import SecurityPage from "./pages/SecurityPage";
import MlAnalyticsDashboard from "./pages/MlAnalyticsDashboard";
import SecurityTeamRoute from "./components/SecurityTeamRoute";
import SecurityLayout from "./components/layout/SecurityLayout";

// Admin layout + pages
import AdminLayout from "./components/layout/AdminLayout";
import AdminRoute from "./components/layout/AdminRoute";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AddBug from "./pages/admin/AddBug";
import ManageBugs from "./pages/admin/ManageBugs";

// Developer layout + pages
import DeveloperLayout from "./components/layout/DeveloperLayout";
import DeveloperRoute from "./components/layout/DeveloperRoute";
import DeveloperDashboard from "./pages/developer/DeveloperDashboard";
import WorkStatusPage from "./pages/developer/WorkStatusPage";

/** Standard layout shell for TESTER / fallback users */
function StandardLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <main className="mx-auto max-w-6xl p-4">{children}</main>
    </div>
  );
}

/** Root redirect: each role lands on its own home */
function RootRedirect() {
  const { user } = useAuth();
  if (user?.role === "ADMIN") return <Navigate to="/admin" replace />;
  if (user?.role === "DEVELOPER") return <Navigate to="/developer" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Root redirect */}
      <Route path="/" element={<ProtectedRoute><RootRedirect /></ProtectedRoute>} />

      {/* ─── ADMIN PANEL (ADMIN only) ─── */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="add-bug" element={<AddBug />} />
        <Route path="manage-bugs" element={<ManageBugs />} />
      </Route>

      {/* ─── DEVELOPER PANEL (DEVELOPER only) ─── */}
      <Route
        path="/developer"
        element={
          <DeveloperRoute>
            <DeveloperLayout />
          </DeveloperRoute>
        }
      >
        <Route index element={<DeveloperDashboard />} />
        <Route path="work-status" element={<WorkStatusPage />} />
      </Route>

      {/* ─── STANDARD PAGES (TESTER / fallback) ─── */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <StandardLayout><DashboardPage /></StandardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/bugs"
        element={
          <ProtectedRoute>
            <StandardLayout><BugListPage /></StandardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/bugs/new"
        element={
          <ProtectedRoute>
            <StandardLayout><CreateBugPage /></StandardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/bugs/:id"
        element={
          <ProtectedRoute>
            <StandardLayout><BugDetailPage /></StandardLayout>
          </ProtectedRoute>
        }
      />

      {/* ─── SECURITY TEAM ─── */}
      <Route
        path="/security"
        element={
          <ProtectedRoute>
            <SecurityTeamRoute>
              <SecurityLayout />
            </SecurityTeamRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<SecurityPage />} />
        <Route path="analytics" element={<MlAnalyticsDashboard />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

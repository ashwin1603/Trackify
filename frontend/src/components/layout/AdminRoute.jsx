import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/**
 * AdminRoute — wraps routes that only ADMIN may access.
 * Unauthenticated → /login
 * Any other role  → /  (their own dashboard)
 */
export default function AdminRoute({ children }) {
  const { user, token } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return children;
}

import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function DeveloperRoute({ children }) {
  const { user, token } = useAuth();

  if (!token) return <Navigate to="/login" replace />;
  if (user?.role !== "DEVELOPER") return <Navigate to="/" replace />;

  return children;
}

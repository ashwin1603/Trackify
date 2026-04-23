import { useAuth } from "../context/AuthContext";

export default function RoleGate({ permission, children, fallback = null }) {
  const { hasPermission } = useAuth();
  return hasPermission(permission) ? children : fallback;
}

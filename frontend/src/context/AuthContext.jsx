import { createContext, useContext, useMemo, useState } from "react";
import { ROLE_PERMISSION_MAP } from "../utils/permissions";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("accessToken"));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("authUser");
    return raw ? JSON.parse(raw) : null;
  });

  const login = (payload) => {
    setToken(payload.token);
    setUser(payload.user);
    localStorage.setItem("accessToken", payload.token);
    localStorage.setItem("authUser", JSON.stringify(payload.user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("authUser");
  };

  const hasPermission = (permission) => {
    if (!user?.role) return false;
    return (ROLE_PERMISSION_MAP[user.role] || []).includes(permission);
  };

  const hasRole = (roleName) => user?.role === roleName;

  const value = useMemo(
    () => ({ token, user, login, logout, hasPermission, hasRole }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

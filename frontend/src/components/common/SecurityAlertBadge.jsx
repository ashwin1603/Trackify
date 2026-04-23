import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth.js";

/**
 * Security Alert Badge Component
 * Shows critical alert count in red badge
 * Admin/Security team only
 */
export function SecurityAlertBadge() {
  const { user } = useAuth();
  const [criticalAlerts, setCriticalAlerts] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || (user.role.name !== "ADMIN" && user.role.name !== "SECURITY_TEAM")) {
      return;
    }

    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/security/stats", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "X-API-Key": localStorage.getItem("apiKey") || "",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCriticalAlerts(data.data.criticalCount || 0);
        }
      } catch (error) {
        console.error("Failed to fetch critical alerts:", error);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchAlerts();

    // Poll every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, [user]);

  if (!user || (user.role.name !== "ADMIN" && user.role.name !== "SECURITY_TEAM")) {
    return null;
  }

  if (criticalAlerts === 0) {
    return null;
  }

  return (
    <div className="relative">
      <a
        href="/security/alerts"
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 transition"
      >
        <span className="text-red-600 font-semibold text-sm">⚠ ALERTS</span>
        <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-600 rounded-full">
          {criticalAlerts}
        </span>
      </a>
    </div>
  );
}

export default SecurityAlertBadge;

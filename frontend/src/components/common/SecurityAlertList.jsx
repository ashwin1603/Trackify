import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth.js";

/**
 * Security Alert List Component
 * Admin: View all alerts, assign to team
 * Security Team: View assigned alerts, resolve
 */
export function SecurityAlertList() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("OPEN");
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [assigneeUsers, setAssigneeUsers] = useState([]);

  const isAdmin = user?.role.name === "ADMIN";
  const isSecurityTeam = user?.role.name === "SECURITY_TEAM";

  useEffect(() => {
    fetchAlerts();
    if (isAdmin) {
      fetchAssigneeUsers();
    }
  }, [filter]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const endpoint = isAdmin ? "/api/security/alerts" : "/api/security/my-alerts";
      const queryParams = new URLSearchParams({ status: filter, limit: 50 });

      const response = await fetch(`${endpoint}?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-API-Key": localStorage.getItem("apiKey") || "",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAlerts(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssigneeUsers = async () => {
    try {
      const response = await fetch("/api/users", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-API-Key": localStorage.getItem("apiKey") || "",
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Filter for SECURITY_TEAM role users
        const teamUsers = data.data?.filter((u) => u.role.name === "SECURITY_TEAM") || [];
        setAssigneeUsers(teamUsers);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const handleAssignAlert = async (alertId, securityUserId) => {
    try {
      const response = await fetch("/api/security/assign-alert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-API-Key": localStorage.getItem("apiKey") || "",
        },
        body: JSON.stringify({ alertId, securityUserId }),
      });

      if (response.ok) {
        alert("Alert assigned successfully");
        fetchAlerts();
        setSelectedAlert(null);
      } else {
        alert("Failed to assign alert");
      }
    } catch (error) {
      console.error("Failed to assign alert:", error);
      alert("Error assigning alert");
    }
  };

  const handleResolveAlert = async (alertId, notes) => {
    try {
      const response = await fetch("/api/security/resolve-alert", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-API-Key": localStorage.getItem("apiKey") || "",
        },
        body: JSON.stringify({ alertId, resolutionNotes: notes }),
      });

      if (response.ok) {
        alert("Alert resolved successfully");
        fetchAlerts();
        setSelectedAlert(null);
      } else {
        alert("Failed to resolve alert");
      }
    } catch (error) {
      console.error("Failed to resolve alert:", error);
      alert("Error resolving alert");
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-100 text-red-800 border border-red-300";
      case "HIGH":
        return "bg-orange-100 text-orange-800 border border-orange-300";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 border border-yellow-300";
      case "LOW":
        return "bg-blue-100 text-blue-800 border border-blue-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "OPEN":
        return "text-red-600";
      case "ASSIGNED":
        return "text-orange-600";
      case "RESOLVED":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          {isAdmin ? "All Security Alerts" : "My Assigned Alerts"}
        </h2>
        <div className="flex gap-2">
          {["OPEN", "ASSIGNED", "RESOLVED"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg transition ${
                filter === status
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Alert List */}
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No alerts found</div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              onClick={() => setSelectedAlert(alert)}
              className="p-4 border rounded-lg cursor-pointer hover:shadow-lg transition bg-white"
            >
              {/* Alert Header */}
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex gap-2 items-center">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${getSeverityColor(alert.severity)}`}>
                      {alert.severity}
                    </span>
                    <span className="text-sm text-gray-600">{alert.type}</span>
                    <span className={`text-sm font-semibold ${getStatusColor(alert.status)}`}>
                      {alert.status}
                    </span>
                  </div>
                  <p className="text-base font-semibold mt-2">{alert.message}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {alert.endpoint} • IP: {alert.ipAddress}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">
                    {alert.aiAnalysis?.riskScore || 0}%
                  </div>
                  <p className="text-xs text-gray-500">Risk Score</p>
                </div>
              </div>

              {/* Metadata */}
              <div className="mt-3 pt-3 border-t text-sm text-gray-600">
                {alert.user && <p>User: {alert.user.email}</p>}
                {alert.assignedTo && <p>Assigned to: {alert.assignedTo.email}</p>}
                <p>Detected: {new Date(alert.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Alert Details */}
      {selectedAlert && (
        <AlertDetailModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          isAdmin={isAdmin}
          isSecurityTeam={isSecurityTeam}
          assigneeUsers={assigneeUsers}
          onAssign={handleAssignAlert}
          onResolve={handleResolveAlert}
        />
      )}
    </div>
  );
}

/**
 * Alert Detail Modal
 */
function AlertDetailModal({
  alert,
  onClose,
  isAdmin,
  isSecurityTeam,
  assigneeUsers,
  onAssign,
  onResolve,
}) {
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold">{alert.message}</h3>
            <p className="text-blue-100 text-sm mt-1">{alert.type}</p>
          </div>
          <button onClick={onClose} className="text-xl font-bold hover:text-blue-200">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Alert Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-600">Severity</label>
              <p className="text-lg font-bold text-red-600">{alert.severity}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600">Risk Score</label>
              <p className="text-lg font-bold text-blue-600">{alert.aiAnalysis?.riskScore}%</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600">Status</label>
              <p className="text-lg font-bold">{alert.status}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600">Endpoint</label>
              <p className="text-sm">{alert.endpoint}</p>
            </div>
            <div colSpan={2}>
              <label className="text-sm font-semibold text-gray-600">IP Address</label>
              <p className="text-sm">{alert.ipAddress}</p>
            </div>
          </div>

          {/* AI Analysis */}
          {alert.aiAnalysis && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-bold text-blue-900 mb-2">AI Analysis</h4>
              <p className="text-sm text-blue-800 mb-3">{alert.aiAnalysis.explanation}</p>
              <div>
                <p className="text-sm font-semibold text-blue-900 mb-1">Recommended Actions:</p>
                <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
                  {alert.aiAnalysis.recommendedAction?.slice(0, 3).map((action, idx) => (
                    <li key={idx}>{action}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Admin Actions */}
          {isAdmin && alert.status === "OPEN" && (
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <label className="block text-sm font-semibold text-amber-900 mb-3">
                Assign to Security Team:
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedAssignee}
                  onChange={(e) => setSelectedAssignee(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select team member...</option>
                  {assigneeUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    if (selectedAssignee) {
                      onAssign(alert.id, selectedAssignee);
                    }
                  }}
                  disabled={!selectedAssignee}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:bg-gray-300"
                >
                  Assign
                </button>
              </div>
            </div>
          )}

          {/* Security Team Actions */}
          {isSecurityTeam && alert.status === "ASSIGNED" && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <label className="block text-sm font-semibold text-green-900 mb-2">
                Resolution Notes:
              </label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Describe your investigation and resolution..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 text-sm"
                rows="3"
              />
              <button
                onClick={() => onResolve(alert.id, resolutionNotes)}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Resolve Alert
              </button>
            </div>
          )}

          {/* Resolution Info */}
          {alert.status === "RESOLVED" && alert.resolutionNotes && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-sm font-semibold text-green-900 mb-2">Resolution:</p>
              <p className="text-sm text-green-800">{alert.resolutionNotes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t text-sm text-gray-600">
          Created: {new Date(alert.createdAt).toLocaleString()}
        </div>
      </div>
    </div>
  );
}

export default SecurityAlertList;

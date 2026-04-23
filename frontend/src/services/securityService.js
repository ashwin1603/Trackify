import { apiRequest } from "./api";

export function getSecurityDashboard() {
  return apiRequest("/security/dashboard");
}

/** Current user's own activity (any authenticated role) */
export function getMyActivity() {
  return apiRequest("/users/me/activity");
}

/** SECURITY_TEAM only — full audit log */
export function getAuditLogs() {
  return apiRequest("/security/audit-logs");
}

export function getMlAnalytics() {
  return apiRequest("/security/ml-analytics");
}

import { apiRequest } from "./api";

export function getBugs(params = {}) {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== "")
  );
  const searchParams = new URLSearchParams(cleanParams);
  const query = searchParams.toString();
  return apiRequest(`/bugs${query ? `?${query}` : ""}`);
}

export function getBug(id) {
  return apiRequest(`/bugs/${id}`);
}

export function createBug(payload) {
  return apiRequest("/bugs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateBug(id, payload) {
  return apiRequest(`/bugs/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function assignBug(id, email) {
  return apiRequest(`/bugs/${id}/assign`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function deleteBug(id) {
  return apiRequest(`/bugs/${id}`, { method: "DELETE" });
}

export function addComment(payload) {
  return apiRequest("/comments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

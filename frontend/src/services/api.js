const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const API_KEY =
  import.meta.env.VITE_API_KEY || "dev-api-key-secure-bug-tracker-2026";

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("accessToken");
  const headers = {
    "Content-Type": "application/json",
    "x-api-key": API_KEY,
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 204) return null;

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

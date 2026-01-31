const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface ApiError {
  error: string;
  issues?: { path: string; message: string }[];
}

let accessToken: string | null = null;
let onRefreshFailed: (() => void) | null = null;

export function setAccessToken(token: string) {
  accessToken = token;
}

export function clearAccessToken() {
  accessToken = null;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setOnRefreshFailed(callback: () => void) {
  onRefreshFailed = callback;
}

async function refreshTokens(refreshToken: string) {
  const res = await fetch(`${API_URL}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Refresh failed");
  }
  return res.json();
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  refreshToken?: string | null
): Promise<T> {
  const url = `${API_URL}${path}`;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (accessToken) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${accessToken}`;
  }

  let res = await fetch(url, { ...options, headers });

  if (res.status === 401 && refreshToken) {
    try {
      const data = await refreshTokens(refreshToken);
      setAccessToken(data.accessToken);
      if (data.refreshToken && typeof window !== "undefined") {
        localStorage.setItem("refreshToken", data.refreshToken);
      }
      (headers as Record<string, string>)["Authorization"] = `Bearer ${data.accessToken}`;
      res = await fetch(url, { ...options, headers });
    } catch {
      onRefreshFailed?.();
      throw new Error("Session expired. Please log in again.");
    }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || "Request failed") as Error & { status?: number };
    err.status = res.status;
    (err as Error & { issues?: unknown }).issues = data.issues;
    throw err;
  }
  return data as T;
}

export const api = {
  get: <T>(path: string, refreshToken?: string | null) =>
    request<T>(path, { method: "GET" }, refreshToken),
  post: <T>(path: string, body?: unknown, refreshToken?: string | null) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }, refreshToken),
  put: <T>(path: string, body?: unknown, refreshToken?: string | null) =>
    request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined }, refreshToken),
  delete: <T>(path: string, refreshToken?: string | null) =>
    request<T>(path, { method: "DELETE" }, refreshToken),
};

export async function uploadFile(file: File): Promise<{ url: string }> {
  const token = getAccessToken();
  if (!token) throw new Error("Not authenticated");
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_URL}/api/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return data as { url: string };
}

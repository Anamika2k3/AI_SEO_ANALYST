const DEFAULT_API_BASE_URL = "http://localhost:5001";

function resolveDefaultBaseUrl(): string {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host !== "localhost" && host !== "127.0.0.1") {
      // Deployed (e.g. Vercel) - the Python API is served from the same origin.
      return "";
    }
  }
  return DEFAULT_API_BASE_URL;
}

// Distinguish "unset" (use the runtime-detected default) from an explicit
// empty string override - a plain `||` would treat both the same and
// always fall back to localhost.
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL !== undefined
    ? process.env.NEXT_PUBLIC_API_BASE_URL
    : resolveDefaultBaseUrl();

export const apiUrl = (path: string) => {
  if (!path.startsWith("/")) {
    return `${API_BASE_URL}/${path}`;
  }
  return `${API_BASE_URL}${path}`;
};

export const apiFetch = (path: string, init?: RequestInit) =>
  fetch(apiUrl(path), init);

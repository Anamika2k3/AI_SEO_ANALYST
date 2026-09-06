const DEFAULT_API_BASE_URL = "http://localhost:5001";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL;

export const apiUrl = (path: string) => {
  if (!path.startsWith("/")) {
    return `${API_BASE_URL}/${path}`;
  }
  return `${API_BASE_URL}${path}`;
};

export const apiFetch = (path: string, init?: RequestInit) =>
  fetch(apiUrl(path), init);

const BASE_URL = import.meta.env.VITE_DJANGO_BASE_URL;

const notifyAuthChange = () => window.dispatchEvent(new Event("auth-changed"));

export const saveToken = (tokens) => {
  localStorage.setItem("access_token", tokens.access);
  localStorage.setItem("refresh_token", tokens.refresh);
  notifyAuthChange();
};

export const clearTokens = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  notifyAuthChange();
};

export const getAccessToken = () => localStorage.getItem("access_token");

const getRefreshToken = () => localStorage.getItem("refresh_token");

export const refreshAccessToken = async () => {
  const refresh = getRefreshToken();
  if (!refresh) {
    clearTokens();
    return null;
  }

  const response = await fetch(`${BASE_URL}/api/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!response.ok) {
    clearTokens();
    return null;
  }

  const data = await response.json();
  if (data.access) {
    localStorage.setItem("access_token", data.access);
    return data.access;
  }

  clearTokens();
  return null;
};

export const authFetch = async (url, options = {}) => {
  const executeRequest = (token) => {
    const headers = options.headers ? { ...options.headers } : {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return fetch(url, {
      ...options,
      headers,
    });
  };

  let accessToken = getAccessToken();
  let response = await executeRequest(accessToken);

  if (response.status === 401 && getRefreshToken()) {
    accessToken = await refreshAccessToken();
    if (accessToken) {
      response = await executeRequest(accessToken);
    }
  }

  return response;
};

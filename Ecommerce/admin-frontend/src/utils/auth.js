const accessTokenKey = "dfit_admin_access_token";
const refreshTokenKey = "dfit_admin_refresh_token";

export const getAccessToken = () => localStorage.getItem(accessTokenKey);

export const setTokens = (data) => {
  localStorage.setItem(accessTokenKey, data.access);
  if (data.refresh) localStorage.setItem(refreshTokenKey, data.refresh);
};

export const clearTokens = () => {
  localStorage.removeItem(accessTokenKey);
  localStorage.removeItem(refreshTokenKey);
};

export const authFetch = (url, options = {}) => {
  const headers = new Headers(options.headers || {});
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(url, { ...options, headers });
};
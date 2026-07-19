import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = 'https://api-randevumkolay.azurewebsites.net/api/v1';

// Extract the server origin (scheme + host + port) from BASE_URL
export const API_ORIGIN = BASE_URL.startsWith('http')
  ? BASE_URL.substring(0, BASE_URL.indexOf('/', 8))
  : 'http://localhost:5280';

/** Replace localhost URLs with the actual server IP for mobile device access */
export function fixImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  return url.replace(/https?:\/\/localhost(:\d+)?/gi, API_ORIGIN);
}

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor: attach JWT ────────────────────────────────────────
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor: handle 401 with refresh ──────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await SecureStore.getItemAsync('refresh_token');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const newToken = data.accessToken;

        await SecureStore.setItemAsync('access_token', newToken);
        // The backend rotates refresh tokens (old one is revoked) — persist
        // the new one or the next refresh will fail and log the user out.
        if (data.refreshToken) {
          await SecureStore.setItemAsync('refresh_token', data.refreshToken);
        }
        processQueue(null, newToken);
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
        await SecureStore.deleteItemAsync('auth_data');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

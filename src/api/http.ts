import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
  withCredentials: true,
});

let refreshing = false;
let waitQueue: Array<(ok: boolean) => void> = [];

apiClient.interceptors.response.use(
  (r) => r,
  async (error) => {
    const cfg = error.config;
    const status = error.response?.status;
    const isAuthEndpoint =
      cfg?.url?.includes('/auth/refresh') || cfg?.url?.includes('/auth/login');

    if (status === 401 && !cfg?._retry && !isAuthEndpoint) {
      cfg._retry = true;

      if (refreshing) {
        return new Promise((resolve, reject) => {
          waitQueue.push((ok) =>
            ok ? resolve(apiClient(cfg)) : reject(error)
          );
        });
      }

      refreshing = true;
      try {
        await apiClient.post('/auth/refresh');
        waitQueue.forEach((fn) => fn(true));
        waitQueue = [];
        return apiClient(cfg);
      } catch {
        waitQueue.forEach((fn) => fn(false));
        waitQueue = [];
        return Promise.reject(error);
      } finally {
        refreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const getApiErrorMessage = (
  error: unknown,
  fallback = 'Une erreur est survenue. Veuillez réessayer.'
) => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error || fallback;
  }
  return fallback;
};

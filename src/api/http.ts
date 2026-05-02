import axios from 'axios';

const DEFAULT_API_URL = 'http://localhost:3001/api';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || DEFAULT_API_URL,
  timeout: 10000,
});

export const getApiErrorMessage = (
  error: unknown,
  fallback = 'Une erreur est survenue. Veuillez reessayer.'
) => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error || fallback;
  }

  return fallback;
};

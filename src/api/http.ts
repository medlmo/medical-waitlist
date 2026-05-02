import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api',
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

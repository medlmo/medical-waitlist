import axios from 'axios';

const DOCTOR_TOKEN_KEY = 'doctor_token';

export const getDoctorToken = () => localStorage.getItem(DOCTOR_TOKEN_KEY);
export const setDoctorToken = (token: string) => localStorage.setItem(DOCTOR_TOKEN_KEY, token);
export const clearDoctorToken = () => localStorage.removeItem(DOCTOR_TOKEN_KEY);

export const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const token = getDoctorToken();
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export const getApiErrorMessage = (
  error: unknown,
  fallback = 'Une erreur est survenue. Veuillez réessayer.'
) => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error || fallback;
  }
  return fallback;
};

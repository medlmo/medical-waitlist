import axios from 'axios';
import { apiClient } from './http';
import type { Medecin } from './patients';

const ADMIN_TOKEN_KEY = 'admin_token';

export const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_KEY);
export const setAdminToken = (token: string) => localStorage.setItem(ADMIN_TOKEN_KEY, token);
export const clearAdminToken = () => localStorage.removeItem(ADMIN_TOKEN_KEY);

const adminClient = axios.create({ baseURL: '/api/admin', timeout: 10000 });
adminClient.interceptors.request.use((config) => {
  const token = getAdminToken();
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

export interface MedecinWithStats extends Medecin {
  en_attente: number;
  en_consultation: number;
  patients_today: number;
}

export interface Cabinet {
  cabinet_code: string;
  nom_cabinet: string;
}

export const adminApi = {
  async login(email: string, password: string) {
    const res = await axios.post('/api/admin/login', { email, password });
    return res.data as { token: string; admin: { email: string } };
  },
  async listMedecins() {
    const res = await adminClient.get('/medecins');
    return res.data.medecins as MedecinWithStats[];
  },
  async getCabinets() {
    const res = await adminClient.get('/cabinets');
    return res.data.cabinets as Cabinet[];
  },
  async createMedecin(payload: {
    email: string; password: string; nom: string; prenom: string;
    nom_cabinet?: string; role: string; cabinet_code?: string;
  }) {
    const res = await adminClient.post('/medecins', payload);
    return res.data.medecin as Medecin;
  },
  async deleteMedecin(id: number) {
    await adminClient.delete(`/medecins/${id}`);
  },
  async resetPassword(id: number, password: string) {
    await adminClient.patch(`/medecins/${id}/password`, { password });
  },
};

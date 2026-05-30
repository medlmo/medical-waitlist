import axios from 'axios';
import { apiClient } from './http';
import type { Medecin } from './patients';

const adminClient = axios.create({ baseURL: '/api/admin', timeout: 10000, withCredentials: true });

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
    const res = await apiClient.post('/admin/login', { email, password });
    return res.data as { admin: { email: string } };
  },
  async logout() {
    await apiClient.post('/admin/logout');
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
  async updateMedecin(id: number, payload: { nom?: string; prenom?: string; email?: string; nom_cabinet?: string }) {
    const res = await adminClient.patch(`/medecins/${id}`, payload);
    return res.data.medecin as Medecin;
  },
  async deleteMedecin(id: number) {
    await adminClient.delete(`/medecins/${id}`);
  },
  async resetPassword(id: number, password: string) {
    await adminClient.patch(`/medecins/${id}/password`, { password });
  },
};

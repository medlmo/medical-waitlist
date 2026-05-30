import { apiClient } from './http';

export interface Medecin {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  nom_cabinet: string;
  cabinet_code: string;
  role: 'medecin' | 'assistante';
  created_at: string;
}

export interface Patient {
  id: number;
  medecin_id: number;
  nom: string;
  prenom: string;
  age: number;
  telephone: string;
  motif: string;
  code: string;
  statut: string;
  heure_arrivee: string;
  heure_appel: string | null;
  heure_fin: string | null;
}

export interface Stats {
  en_attente: number;
  en_consultation: number;
  traites: number;
}

export interface Bilan {
  total_patients: number;
  termines: number;
  annules: number;
  premier_contact: number;
  controle: number;
  duree_moyenne_minutes: number | null;
}

export interface DashboardData {
  enAttente: Patient[];
  enConsultation: Patient[];
  historique: Patient[];
  stats: Stats;
}

export interface VerificationResult {
  patient: Patient;
  cabinet: { nom_cabinet: string };
  position: number;
  patientsDevant: number;
  tempsAttente: number;
  dureeMoyenne: number;
}

export const authApi = {
  async login(email: string, password: string): Promise<{ medecin: Medecin }> {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async getMe(): Promise<Medecin> {
    const response = await apiClient.get('/auth/me');
    return response.data.medecin as Medecin;
  },
};

export const patientsApi = {
  async getDashboardData(): Promise<DashboardData> {
    const response = await apiClient.get('/dashboard');
    return response.data as DashboardData;
  },

  async addPatient(payload: {
    nom: string;
    prenom: string;
    age: number;
    telephone: string;
    motif: string;
  }) {
    const response = await apiClient.post('/patients', payload);
    return response.data.patient as Patient;
  },

  async callNext() {
    const response = await apiClient.post('/patients/appeler-suivant');
    return response.data.patient as Patient;
  },

  async updateStatus(id: number, statut: string) {
    const response = await apiClient.patch(`/patients/${id}/statut`, { statut });
    return response.data.patient as Patient;
  },

  async verifyPatient(code: string, telephone: string, cabinet_code: string) {
    const response = await apiClient.post('/patients/verifier', { code, telephone, cabinet_code });
    return response.data as VerificationResult;
  },

  async getBilan() {
    const response = await apiClient.get('/bilan');
    return response.data.bilan as Bilan;
  },
};

import { apiClient } from './http';

export interface Patient {
  id: number;
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

export interface DashboardData {
  enAttente: Patient[];
  enConsultation: Patient[];
  historique: Patient[];
}

export interface VerificationResult {
  patient: Patient;
  position: number;
  patientsDevant: number;
  tempsAttente: number;
}

export const patientsApi = {
  async getDashboardData() {
    const [patientsRes, statsRes] = await Promise.all([
      apiClient.get('/patients'),
      apiClient.get('/stats'),
    ]);

    return {
      dashboard: patientsRes.data as DashboardData,
      stats: statsRes.data.stats as Stats,
    };
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

  async verifyPatient(code: string, telephone: string) {
    const response = await apiClient.post('/patients/verifier', { code, telephone });
    return response.data as VerificationResult;
  },
};

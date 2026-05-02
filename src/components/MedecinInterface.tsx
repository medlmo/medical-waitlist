import { useState, useEffect, useCallback } from 'react';
import { UserPlus, Phone, Calendar, User, Trash2, CheckCircle, RotateCcw, Users, Clock } from 'lucide-react';
import { getApiErrorMessage } from '../api/http';
import { patientsApi, type Patient, type Stats } from '../api/patients';

export default function MedecinInterface() {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    age: '',
    telephone: '',
    motif: 'premier_contact'
  });
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [enAttente, setEnAttente] = useState<Patient[]>([]);
  const [enConsult, setEnConsult] = useState<Patient[]>([]);
  const [historique, setHistorique] = useState<Patient[]>([]);
  const [stats, setStats] = useState<Stats>({ en_attente: 0, en_consultation: 0, traites: 0 });
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackType, setFeedbackType] = useState<'error' | 'success' | ''>('');

  const loadData = useCallback(async () => {
    try {
      const { dashboard, stats: latestStats } = await patientsApi.getDashboardData();
      setEnAttente(dashboard.enAttente);
      setEnConsult(dashboard.enConsultation);
      setHistorique(dashboard.historique);
      setStats(latestStats);
    } catch (error) {
      setFeedbackType('error');
      setFeedbackMessage(getApiErrorMessage(error, 'Impossible de charger les donnees.'));
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Rafraîchir toutes les 5 secondes
    return () => clearInterval(interval);
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const patient = await patientsApi.addPatient({
        ...formData,
        age: parseInt(formData.age, 10),
      });
      setGeneratedCode(patient.code);
      setFormData({ nom: '', prenom: '', age: '', telephone: '', motif: 'premier_contact' });
      setFeedbackType('success');
      setFeedbackMessage('Patient ajoute avec succes.');
      loadData();
    } catch (error) {
      setFeedbackType('error');
      setFeedbackMessage(getApiErrorMessage(error, "Erreur lors de l'ajout du patient."));
    }
  };

  const callNext = async () => {
    try {
      await patientsApi.callNext();
      setFeedbackType('success');
      setFeedbackMessage('Patient appele avec succes.');
      loadData();
    } catch (error) {
      setFeedbackType('error');
      setFeedbackMessage(getApiErrorMessage(error, "Erreur lors de l'appel du patient."));
    }
  };

  const changerStatut = async (id: number, statut: string) => {
    try {
      await patientsApi.updateStatus(id, statut);
      setFeedbackType('success');
      setFeedbackMessage('Statut du patient mis a jour.');
      loadData();
    } catch (error) {
      setFeedbackType('error');
      setFeedbackMessage(getApiErrorMessage(error, 'Erreur lors du changement de statut.'));
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getDureeConsultation = (heureAppel: string) => {
    const debut = new Date(heureAppel);
    const now = new Date();
    const diff = Math.floor((now.getTime() - debut.getTime()) / 60000);
    return diff;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">🏥 Cabinet Médical</h1>
          <p className="text-slate-600">Interface Médecin - Gestion de la file d'attente</p>
        </div>

        {feedbackMessage && (
          <div
            className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
              feedbackType === 'error'
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-green-200 bg-green-50 text-green-700'
            }`}
          >
            {feedbackMessage}
          </div>
        )}

        {/* Formulaire d'ajout */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            Nouveau Patient
          </h2>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
              <input
                type="text"
                required
                value={formData.nom}
                onChange={(e) => setFormData({...formData, nom: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nom du patient"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Prénom</label>
              <input
                type="text"
                required
                value={formData.prenom}
                onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Prénom"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Âge</label>
              <input
                type="number"
                required
                min="0"
                max="120"
                value={formData.age}
                onChange={(e) => setFormData({...formData, age: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Âge"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
              <input
                type="tel"
                required
                value={formData.telephone}
                onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="06 12 34 56 78"
              />
            </div>
            
            <div className="md:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Motif</label>
              <select
                value={formData.motif}
                onChange={(e) => setFormData({...formData, motif: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="premier_contact">Premier contact</option>
                <option value="controle">Contrôle</option>
              </select>
            </div>
            
            <div className="md:col-span-2 lg:col-span-3">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
              >
                Ajouter le patient à la file
              </button>
            </div>
          </form>

          {generatedCode && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-green-800 font-semibold text-center">
                ✅ Patient ajouté ! Code généré : 
                <span className="text-3xl font-bold ml-2 text-green-600">{generatedCode}</span>
              </p>
              <p className="text-sm text-green-600 text-center mt-2">
                Communiquez ce code au patient pour qu'il puisse suivre sa position
              </p>
              <button
                onClick={() => setGeneratedCode(null)}
                className="mt-3 mx-auto block text-sm text-green-700 hover:text-green-800 underline"
              >
                Fermer
              </button>
            </div>
          )}
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-4 text-center">
            <div className="text-3xl font-bold text-amber-500">{stats.en_attente}</div>
            <div className="text-sm text-slate-600">En attente</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4 text-center">
            <div className="text-3xl font-bold text-blue-500">{stats.en_consultation}</div>
            <div className="text-sm text-slate-600">En consultation</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4 text-center">
            <div className="text-3xl font-bold text-green-500">{stats.traites}</div>
            <div className="text-sm text-slate-600">Traités aujourd'hui</div>
          </div>
        </div>

        {/* File d'attente */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Patients en attente */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-500" />
              File d'attente ({enAttente.length})
            </h3>
            
            <button
              onClick={callNext}
              disabled={enAttente.length === 0 || enConsult.length > 0}
              className={`w-full mb-4 py-3 rounded-lg font-semibold transition-all ${
                enAttente.length === 0 || enConsult.length > 0
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 shadow-lg hover:shadow-xl'
              }`}
            >
              {enConsult.length > 0 ? '⚠ Consultation en cours' : '📢 Appeler le suivant'}
            </button>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {enAttente.map((patient, index) => (
                <div key={patient.id} className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-800">
                          {index + 1}. {patient.nom} {patient.prenom}
                        </span>
                        <span className="text-xs px-2 py-1 bg-amber-200 text-amber-800 rounded-full">
                          {patient.code}
                        </span>
                      </div>
                      <div className="text-sm text-slate-600 space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {patient.age} ans
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {patient.telephone}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Arrivée: {formatTime(patient.heure_arrivee)}
                        </div>
                      </div>
                      <div className="mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          patient.motif === 'premier_contact' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {patient.motif === 'premier_contact' ? 'Premier contact' : 'Contrôle'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => changerStatut(patient.id, 'en_consultation')}
                        disabled={enConsult.length > 0}
                        className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                        title="Appeler"
                      >
                        <Phone className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => changerStatut(patient.id, 'annule')}
                        className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                        title="Annuler"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {enAttente.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  Aucun patient en attente
                </div>
              )}
            </div>
          </div>

          {/* En consultation */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-500" />
              En consultation
            </h3>

            <div className="space-y-3">
              {enConsult.map((patient) => (
                <div key={patient.id} className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-800">
                          {patient.nom} {patient.prenom}
                        </span>
                        <span className="text-xs px-2 py-1 bg-blue-200 text-blue-800 rounded-full">
                          {patient.code}
                        </span>
                      </div>
                      <div className="text-sm text-slate-600 space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {patient.age} ans
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {patient.telephone}
                        </div>
                        <div className="flex items-center gap-2 text-blue-600">
                          <Clock className="w-4 h-4" />
                          Depuis: {patient.heure_appel ? getDureeConsultation(patient.heure_appel) : 0} min
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => changerStatut(patient.id, 'termine')}
                        className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                        title="Terminer"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => changerStatut(patient.id, 'en_attente')}
                        className="p-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
                        title="Remettre en attente"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {enConsult.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  Aucun patient en consultation
                </div>
              )}
            </div>

            {/* Historique */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Historique du jour</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {historique.map((patient) => (
                  <div key={patient.id} className={`p-3 rounded-lg text-sm ${
                    patient.statut === 'termine' ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{patient.nom} {patient.prenom}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        patient.statut === 'termine' 
                          ? 'bg-green-200 text-green-800' 
                          : 'bg-red-200 text-red-800'
                      }`}>
                        {patient.statut === 'termine' ? 'Terminé' : 'Annulé'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      {formatTime(patient.heure_fin || patient.heure_arrivee)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
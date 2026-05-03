import { useState, useEffect, useCallback, useRef } from 'react';
import { UserPlus, Phone, Calendar, User, Trash2, CheckCircle, RotateCcw, Users, Clock, BarChart3, UserCheck, RefreshCw, AlertTriangle, X, Lock, LogOut, Copy, Check, Building2, QrCode } from 'lucide-react';
import { getApiErrorMessage, getDoctorToken, setDoctorToken, clearDoctorToken } from '../api/http';
import { authApi, patientsApi, type Patient, type Stats, type Bilan, type Medecin } from '../api/patients';
import QRCodeModal from './QRCodeModal';

type ConfirmAction = { patientId: number; statut: 'annule' | 'termine'; patientName: string };

function ConfirmModal({ action, onConfirm, onCancel }: { action: ConfirmAction; onConfirm: () => void; onCancel: () => void }) {
  const isAnnule = action.statut === 'annule';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isAnnule ? 'bg-red-100' : 'bg-green-100'}`}>
            <AlertTriangle className={`w-5 h-5 ${isAnnule ? 'text-red-600' : 'text-green-600'}`} />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">{isAnnule ? 'Annuler le rendez-vous' : 'Terminer la consultation'}</h3>
        </div>
        <p className="text-slate-600 mb-6">
          {isAnnule ? <>Voulez-vous annuler le rendez-vous de <strong>{action.patientName}</strong> ?</> : <>Voulez-vous marquer la consultation de <strong>{action.patientName}</strong> comme terminée ?</>}
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors">Annuler</button>
          <button onClick={onConfirm} className={`flex-1 py-2.5 rounded-xl text-white font-medium transition-colors ${isAnnule ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}>Confirmer</button>
        </div>
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };
  return (
    <button onClick={handleCopy} className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors shrink-0" title="Copier">
      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
    </button>
  );
}

function AuthScreen({ onAuth }: { onAuth: (medecin: Medecin, token: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: '', password: '' });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { medecin, token } = await authApi.login(form.email, form.password);
      setDoctorToken(token);
      onAuth(medecin, token);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Email ou mot de passe incorrect.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Espace Médecin</h1>
          <p className="text-sm text-slate-500 mt-1">Connectez-vous à votre compte</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input type="email" required autoFocus value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="medecin@cabinet.fr" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe</label>
            <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="••••••••" />
          </div>
          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
          <button type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg disabled:opacity-60">
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
        <p className="text-center text-xs text-slate-400 mt-6">
          Votre compte est créé par l'administrateur du cabinet.
        </p>
      </div>
    </div>
  );
}

export default function MedecinInterface() {
  const [medecin, setMedecin] = useState<Medecin | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [formData, setFormData] = useState({ nom: '', prenom: '', age: '', telephone: '', motif: 'premier_contact' });
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [enAttente, setEnAttente] = useState<Patient[]>([]);
  const [enConsult, setEnConsult] = useState<Patient[]>([]);
  const [historique, setHistorique] = useState<Patient[]>([]);
  const [stats, setStats] = useState<Stats>({ en_attente: 0, en_consultation: 0, traites: 0 });
  const [bilan, setBilan] = useState<Bilan | null>(null);
  const [showBilan, setShowBilan] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackType, setFeedbackType] = useState<'error' | 'success' | ''>('');
  const [confirmation, setConfirmation] = useState<ConfirmAction | null>(null);
  const [showQR, setShowQR] = useState(false);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const token = getDoctorToken();
    if (!token) return;
    authApi.getMe().then((m) => { setMedecin(m); setAuthenticated(true); }).catch(() => { clearDoctorToken(); });
  }, []);

  const showFeedback = useCallback((msg: string, type: 'success' | 'error') => {
    setFeedbackMessage(msg);
    setFeedbackType(type);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => { setFeedbackMessage(''); setFeedbackType(''); }, 3500);
  }, []);

  const handleAuthError = useCallback(() => { clearDoctorToken(); setAuthenticated(false); setMedecin(null); }, []);

  const loadData = useCallback(async () => {
    try {
      const data = await patientsApi.getDashboardData();
      setEnAttente(data.enAttente);
      setEnConsult(data.enConsultation);
      setHistorique(data.historique);
      setStats(data.stats);
    } catch (error) {
      if ((error as { response?: { status?: number } })?.response?.status === 401) { handleAuthError(); return; }
      showFeedback(getApiErrorMessage(error, 'Impossible de charger les données.'), 'error');
    }
  }, [showFeedback, handleAuthError]);

  const loadBilan = useCallback(async () => {
    try {
      const data = await patientsApi.getBilan();
      setBilan(data);
    } catch (error) {
      showFeedback(getApiErrorMessage(error, 'Impossible de charger le bilan.'), 'error');
    }
  }, [showFeedback]);

  useEffect(() => {
    if (!authenticated) return;
    loadData();
    const interval = setInterval(loadData, 180000);
    return () => clearInterval(interval);
  }, [loadData, authenticated]);

  useEffect(() => {
    if (!showBilan || !authenticated) return;
    loadBilan();
    const interval = setInterval(loadBilan, 180000);
    return () => clearInterval(interval);
  }, [showBilan, loadBilan, authenticated]);

  useEffect(() => { return () => { if (feedbackTimer.current) clearTimeout(feedbackTimer.current); }; }, []);

  if (!authenticated) {
    return <AuthScreen onAuth={(m, t) => { setMedecin(m); setDoctorToken(t); setAuthenticated(true); }} />;
  }

  const patientUrl = medecin ? `${window.location.origin}/patient/${medecin.cabinet_code}` : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const patient = await patientsApi.addPatient({ ...formData, age: parseInt(formData.age, 10) });
      setGeneratedCode(patient.code);
      setFormData({ nom: '', prenom: '', age: '', telephone: '', motif: 'premier_contact' });
      showFeedback('Patient ajouté avec succès.', 'success');
      loadData();
    } catch (error) {
      if ((error as { response?: { status?: number } })?.response?.status === 401) { handleAuthError(); return; }
      showFeedback(getApiErrorMessage(error, "Erreur lors de l'ajout du patient."), 'error');
    }
  };

  const callNext = async () => {
    try {
      await patientsApi.callNext();
      showFeedback('Patient appelé avec succès.', 'success');
      loadData();
    } catch (error) {
      if ((error as { response?: { status?: number } })?.response?.status === 401) { handleAuthError(); return; }
      showFeedback(getApiErrorMessage(error, "Erreur lors de l'appel du patient."), 'error');
    }
  };

  const changerStatut = async (id: number, statut: string) => {
    try {
      await patientsApi.updateStatus(id, statut);
      showFeedback('Statut mis à jour.', 'success');
      loadData();
      if (showBilan) loadBilan();
    } catch (error) {
      if ((error as { response?: { status?: number } })?.response?.status === 401) { handleAuthError(); return; }
      showFeedback(getApiErrorMessage(error, 'Erreur lors du changement de statut.'), 'error');
    }
  };

  const demanderConfirmation = (patient: Patient, statut: 'annule' | 'termine') => {
    setConfirmation({ patientId: patient.id, statut, patientName: `${patient.prenom} ${patient.nom}` });
  };

  const confirmerAction = async () => {
    if (!confirmation) return;
    setConfirmation(null);
    await changerStatut(confirmation.patientId, confirmation.statut);
  };

  const handleLogout = () => { clearDoctorToken(); setAuthenticated(false); setMedecin(null); };

  const formatTime = (dateStr: string) => new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const getDureeConsultation = (heureAppel: string) => Math.floor((Date.now() - new Date(heureAppel).getTime()) / 60000);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {showQR && medecin && <QRCodeModal url={patientUrl} title={medecin.nom_cabinet} subtitle={`Dr ${medecin.prenom} ${medecin.nom}`} onClose={() => setShowQR(false)} />}
      {confirmation && <ConfirmModal action={confirmation} onConfirm={confirmerAction} onCancel={() => setConfirmation(null)} />}

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">🏥 {medecin?.nom_cabinet}</h1>
            <p className="text-slate-500 text-sm mt-0.5">Dr {medecin?.prenom} {medecin?.nom}</p>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 border border-slate-300 hover:border-slate-400 px-3 py-2 rounded-lg transition-colors">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>

        {/* Lien patient */}
        {medecin && (
          <div className="bg-white rounded-2xl shadow p-4 mb-6 flex items-center gap-3">
            <Building2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500 font-medium mb-0.5">Lien à partager avec vos patients</p>
              <p className="text-sm font-mono text-slate-700 truncate">{patientUrl}</p>
            </div>
            <CopyButton text={patientUrl} />
            <button onClick={() => setShowQR(true)} title="Afficher le QR Code"
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors shrink-0">
              <QrCode className="w-4 h-4 text-indigo-500" />
            </button>
          </div>
        )}

        {feedbackMessage && (
          <div className={`mb-4 rounded-lg border px-4 py-3 text-sm flex items-center justify-between ${feedbackType === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>
            <span>{feedbackMessage}</span>
            <button onClick={() => setFeedbackMessage('')} className="ml-3 opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
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
              <input type="text" required value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Nom du patient" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Prénom</label>
              <input type="text" required value={formData.prenom} onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Prénom" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Âge</label>
              <input type="number" required min="0" max="120" value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Âge" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
              <input type="tel" required value={formData.telephone} onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="06 12 34 56 78" />
            </div>
            <div className="md:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Motif</label>
              <select value={formData.motif} onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="premier_contact">Premier contact</option>
                <option value="controle">Contrôle</option>
              </select>
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl">
                Ajouter le patient à la file
              </button>
            </div>
          </form>

          {generatedCode && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-green-800 font-semibold text-center">
                ✅ Patient ajouté ! Code généré : <span className="text-3xl font-bold ml-2 text-green-600">{generatedCode}</span>
              </p>
              <p className="text-sm text-green-600 text-center mt-2">Communiquez ce code au patient</p>
              <button onClick={() => setGeneratedCode(null)} className="mt-3 mx-auto block text-sm text-green-700 hover:text-green-800 underline">Fermer</button>
            </div>
          )}
        </div>

        {/* Bouton Bilan */}
        <div className="mb-6 flex justify-end">
          <button onClick={() => setShowBilan((v) => !v)} className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-5 rounded-xl shadow transition-colors">
            <BarChart3 className="w-5 h-5" />
            {showBilan ? 'Masquer le bilan' : 'Bilan journalier'}
          </button>
        </div>

        {/* Bilan */}
        {showBilan && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border-l-4 border-indigo-500">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                Bilan du {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Actualisation auto. toutes les 3 min</span>
                <button onClick={loadBilan} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><RefreshCw className="w-4 h-4" /></button>
              </div>
            </div>
            {bilan ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div className="bg-slate-50 rounded-xl p-4 text-center"><div className="text-3xl font-bold text-slate-700">{bilan.total_patients}</div><div className="text-xs text-slate-500 mt-1 font-medium">Total patients</div></div>
                  <div className="bg-green-50 rounded-xl p-4 text-center"><div className="text-3xl font-bold text-green-600">{bilan.termines}</div><div className="text-xs text-slate-500 mt-1 font-medium">Consultations terminées</div></div>
                  <div className="bg-red-50 rounded-xl p-4 text-center"><div className="text-3xl font-bold text-red-400">{bilan.annules}</div><div className="text-xs text-slate-500 mt-1 font-medium">Annulés</div></div>
                  <div className="bg-blue-50 rounded-xl p-4 text-center"><div className="text-3xl font-bold text-blue-600">{bilan.premier_contact}</div><div className="flex items-center justify-center gap-1 text-xs text-slate-500 mt-1 font-medium"><UserCheck className="w-3 h-3" />Premier contact</div></div>
                  <div className="bg-purple-50 rounded-xl p-4 text-center"><div className="text-3xl font-bold text-purple-600">{bilan.controle}</div><div className="flex items-center justify-center gap-1 text-xs text-slate-500 mt-1 font-medium"><RefreshCw className="w-3 h-3" />Contrôles</div></div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
                  <Clock className="w-5 h-5 text-indigo-500" />
                  <span className="text-slate-700 font-medium">Durée moyenne de consultation :</span>
                  <span className="text-xl font-bold text-indigo-600">{bilan.duree_moyenne_minutes !== null ? `${bilan.duree_moyenne_minutes} min` : '—'}</span>
                  {bilan.duree_moyenne_minutes === null && <span className="text-xs text-slate-400">(aucune consultation terminée)</span>}
                </div>
              </>
            ) : (
              <div className="text-center py-6 text-slate-400">Chargement du bilan...</div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-4 text-center"><div className="text-3xl font-bold text-amber-500">{stats.en_attente}</div><div className="text-sm text-slate-600">En attente</div></div>
          <div className="bg-white rounded-xl shadow-lg p-4 text-center"><div className="text-3xl font-bold text-blue-500">{stats.en_consultation}</div><div className="text-sm text-slate-600">En consultation</div></div>
          <div className="bg-white rounded-xl shadow-lg p-4 text-center"><div className="text-3xl font-bold text-green-500">{stats.traites}</div><div className="text-sm text-slate-600">Traités aujourd'hui</div></div>
        </div>

        {/* File */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-amber-500" />File d'attente ({enAttente.length})</h3>
            <button onClick={callNext} disabled={enAttente.length === 0 || enConsult.length > 0}
              className={`w-full mb-4 py-3 rounded-lg font-semibold transition-all ${enAttente.length === 0 || enConsult.length > 0 ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 shadow-lg hover:shadow-xl'}`}>
              {enConsult.length > 0 ? '⚠ Consultation en cours' : '📢 Appeler le suivant'}
            </button>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {enAttente.map((patient, index) => (
                <div key={patient.id} className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-800">{index + 1}. {patient.nom} {patient.prenom}</span>
                        <span className="text-xs px-2 py-1 bg-amber-200 text-amber-800 rounded-full">{patient.code}</span>
                      </div>
                      <div className="text-sm text-slate-600 space-y-1">
                        <div className="flex items-center gap-2"><Calendar className="w-4 h-4" />{patient.age} ans</div>
                        <div className="flex items-center gap-2"><Phone className="w-4 h-4" />{patient.telephone}</div>
                        <div className="flex items-center gap-2"><Clock className="w-4 h-4" />Arrivée : {formatTime(patient.heure_arrivee)}</div>
                      </div>
                      <div className="mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${patient.motif === 'premier_contact' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                          {patient.motif === 'premier_contact' ? 'Premier contact' : 'Contrôle'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button onClick={() => changerStatut(patient.id, 'en_consultation')} disabled={enConsult.length > 0} className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50" title="Appeler"><Phone className="w-4 h-4" /></button>
                      <button onClick={() => demanderConfirmation(patient, 'annule')} className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600" title="Annuler"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              ))}
              {enAttente.length === 0 && <div className="text-center py-8 text-slate-400">Aucun patient en attente</div>}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2"><User className="w-5 h-5 text-blue-500" />En consultation</h3>
            <div className="space-y-3">
              {enConsult.map((patient) => (
                <div key={patient.id} className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-800">{patient.nom} {patient.prenom}</span>
                        <span className="text-xs px-2 py-1 bg-blue-200 text-blue-800 rounded-full">{patient.code}</span>
                      </div>
                      <div className="text-sm text-slate-600 space-y-1">
                        <div className="flex items-center gap-2"><Calendar className="w-4 h-4" />{patient.age} ans</div>
                        <div className="flex items-center gap-2"><Phone className="w-4 h-4" />{patient.telephone}</div>
                        <div className="flex items-center gap-2 text-blue-600"><Clock className="w-4 h-4" />Depuis : {patient.heure_appel ? getDureeConsultation(patient.heure_appel) : 0} min</div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button onClick={() => demanderConfirmation(patient, 'termine')} className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600" title="Terminer"><CheckCircle className="w-4 h-4" /></button>
                      <button onClick={() => changerStatut(patient.id, 'en_attente')} className="p-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600" title="Remettre en attente"><RotateCcw className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              ))}
              {enConsult.length === 0 && <div className="text-center py-8 text-slate-400">Aucun patient en consultation</div>}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-200">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Historique du jour</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {historique.map((patient) => (
                  <div key={patient.id} className={`p-3 rounded-lg text-sm ${patient.statut === 'termine' ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{patient.nom} {patient.prenom}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${patient.statut === 'termine' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                        {patient.statut === 'termine' ? 'Terminé' : 'Annulé'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">{formatTime(patient.heure_fin || patient.heure_arrivee)}</div>
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

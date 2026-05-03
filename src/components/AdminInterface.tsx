import { useState, useEffect, useCallback } from 'react';
import { Shield, Plus, Trash2, KeyRound, LogOut, RefreshCw, Users, X, Check, Eye, EyeOff, Building2, Copy } from 'lucide-react';
import { adminApi, getAdminToken, setAdminToken, clearAdminToken, type MedecinWithStats } from '../api/admin';
import { getApiErrorMessage } from '../api/http';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="p-1 rounded hover:bg-slate-200 transition-colors" title="Copier">
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
    </button>
  );
}

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ email: '', password: '', nom: '', prenom: '', nom_cabinet: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await adminApi.createMedecin(form);
      onCreated();
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Erreur lors de la création du compte.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-slate-800">Nouveau compte médecin</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Prénom</label>
              <input required value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="Jean" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nom</label>
              <input required value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="Dupont" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Nom du cabinet</label>
            <input required value={form.nom_cabinet} onChange={e => setForm({ ...form, nom_cabinet: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="Cabinet Médical du Centre" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
            <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="medecin@cabinet.fr" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Mot de passe provisoire</label>
            <div className="relative">
              <input type={showPwd ? 'text' : 'password'} required minLength={6} value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full px-3 py-2 pr-9 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="6 caractères minimum" />
              <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600">
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-colors">Annuler</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors disabled:opacity-60">
              {loading ? 'Création...' : 'Créer le compte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ResetPasswordModal({ medecin, onClose }: { medecin: MedecinWithStats; onClose: () => void }) {
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await adminApi.resetPassword(medecin.id, password);
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Erreur lors de la réinitialisation.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800">Réinitialiser le mot de passe</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-slate-600 mb-4">Dr {medecin.prenom} {medecin.nom}</p>
        {success ? (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 rounded-lg p-3">
            <Check className="w-5 h-5" /> Mot de passe mis à jour avec succès
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <input type={showPwd ? 'text' : 'password'} required minLength={6} value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2 pr-9 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="Nouveau mot de passe" />
              <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600">
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 text-sm">Annuler</button>
              <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium text-sm disabled:opacity-60">
                {loading ? '...' : 'Confirmer'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function DeleteConfirmModal({ medecin, onClose, onDeleted }: { medecin: MedecinWithStats; onClose: () => void; onDeleted: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setLoading(true);
    try {
      await adminApi.deleteMedecin(medecin.id);
      onDeleted();
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Erreur lors de la suppression.'));
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Supprimer le compte</h3>
        </div>
        <p className="text-slate-600 text-sm mb-2">
          Voulez-vous supprimer le compte de <strong>Dr {medecin.prenom} {medecin.nom}</strong> ?
        </p>
        <p className="text-red-600 text-xs mb-5 bg-red-50 rounded-lg p-2">
          ⚠ Cette action supprimera également tous les patients associés à ce médecin. Elle est irréversible.
        </p>
        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{error}</div>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 text-sm">Annuler</button>
          <button onClick={handleDelete} disabled={loading} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium text-sm disabled:opacity-60">
            {loading ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminLogin({ onAuth }: { onAuth: (token: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { token } = await adminApi.login(email, password);
      setAdminToken(token);
      onAuth(token);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Identifiants incorrects.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Espace Administrateur</h1>
          <p className="text-slate-500 text-sm mt-1">Gestion des comptes médecins</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input type="email" required autoFocus value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="admin@medical.fr" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="••••••••" />
          </div>
          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold transition-colors shadow-lg disabled:opacity-60">
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminInterface() {
  const [authenticated, setAuthenticated] = useState(false);
  const [medecins, setMedecins] = useState<MedecinWithStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [resetTarget, setResetTarget] = useState<MedecinWithStats | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MedecinWithStats | null>(null);

  useEffect(() => {
    const token = getAdminToken();
    if (token) setAuthenticated(true);
  }, []);

  const loadMedecins = useCallback(async () => {
    setLoading(true);
    try {
      const list = await adminApi.listMedecins();
      setMedecins(list);
    } catch {
      clearAdminToken();
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authenticated) loadMedecins();
  }, [authenticated, loadMedecins]);

  const handleLogout = () => { clearAdminToken(); setAuthenticated(false); setMedecins([]); };

  if (!authenticated) return <AdminLogin onAuth={() => setAuthenticated(true)} />;

  const patientUrl = (code: string) => `${window.location.origin}/patient/${code}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={loadMedecins} />}
      {resetTarget && <ResetPasswordModal medecin={resetTarget} onClose={() => setResetTarget(null)} />}
      {deleteTarget && <DeleteConfirmModal medecin={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={loadMedecins} />}

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Espace Administrateur</h1>
              <p className="text-sm text-slate-500">Gestion des comptes médecins</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadMedecins} disabled={loading} className="p-2 rounded-lg border border-slate-300 hover:bg-white text-slate-600 transition-colors">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 text-sm border border-slate-300 hover:bg-white text-slate-600 px-3 py-2 rounded-lg transition-colors">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <div className="text-3xl font-bold text-indigo-600">{medecins.length}</div>
            <div className="text-sm text-slate-500 mt-1">Médecin(s)</div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <div className="text-3xl font-bold text-amber-500">{medecins.reduce((s, m) => s + Number(m.en_attente), 0)}</div>
            <div className="text-sm text-slate-500 mt-1">En attente</div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <div className="text-3xl font-bold text-green-500">{medecins.reduce((s, m) => s + Number(m.patients_today), 0)}</div>
            <div className="text-sm text-slate-500 mt-1">Patients aujourd'hui</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
            <Users className="w-5 h-5" /> Comptes médecins
          </h2>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl shadow transition-colors text-sm">
            <Plus className="w-4 h-4" />
            Nouveau médecin
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          {loading && medecins.length === 0 ? (
            <div className="text-center py-16 text-slate-400">Chargement...</div>
          ) : medecins.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucun médecin enregistré</p>
              <button onClick={() => setShowCreate(true)} className="mt-3 text-indigo-600 hover:underline text-sm">Créer le premier compte</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    <th className="px-5 py-3">Médecin</th>
                    <th className="px-5 py-3">Cabinet</th>
                    <th className="px-5 py-3">Lien patient</th>
                    <th className="px-5 py-3 text-center">File aujourd'hui</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {medecins.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-800">Dr {m.prenom} {m.nom}</div>
                        <div className="text-xs text-slate-500">{m.email}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-sm text-slate-700">{m.nom_cabinet}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">{m.cabinet_code}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1 max-w-48">
                          <span className="text-xs text-slate-500 truncate">{patientUrl(m.cabinet_code)}</span>
                          <CopyButton text={patientUrl(m.cabinet_code)} />
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-3 text-sm">
                          <span className="flex items-center gap-1 text-amber-600"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />{m.en_attente} att.</span>
                          <span className="flex items-center gap-1 text-blue-600"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />{m.en_consultation} cons.</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">{m.patients_today} total</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setResetTarget(m)} title="Réinitialiser le mot de passe"
                            className="p-2 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors">
                            <KeyRound className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteTarget(m)} title="Supprimer le compte"
                            className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Les médecins se connectent sur <a href="/medecin" className="underline hover:text-slate-600">/medecin</a>
        </p>
      </div>
    </div>
  );
}

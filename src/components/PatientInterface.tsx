import { useState, useEffect, useCallback, useRef } from 'react';
import { Clock, AlertCircle, CheckCircle, Users, RefreshCw } from 'lucide-react';
import { getApiErrorMessage } from '../api/http';
import { patientsApi, type VerificationResult } from '../api/patients';

export default function PatientInterface() {
  const [code, setCode] = useState('');
  const [telephone, setTelephone] = useState('');
  const [checkResult, setCheckResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(5);
  const codeRef = useRef(code);
  const telephoneRef = useRef(telephone);

  useEffect(() => { codeRef.current = code; }, [code]);
  useEffect(() => { telephoneRef.current = telephone; }, [telephone]);

  const refreshPosition = useCallback(async (silent = false) => {
    if (!codeRef.current || !telephoneRef.current) return;
    if (!silent) setLoading(true);
    setError('');
    try {
      const result = await patientsApi.verifyPatient(codeRef.current, telephoneRef.current);
      setCheckResult(result);
      setLastRefresh(new Date());
      setCountdown(5);
    } catch (err) {
      if (!silent) {
        setError(getApiErrorMessage(err, 'Patient non trouvé. Vérifiez votre code et numéro de téléphone.'));
        setCheckResult(null);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    await refreshPosition(false);
  };

  useEffect(() => {
    if (!checkResult) return;
    const statut = checkResult.patient.statut;
    if (statut === 'termine' || statut === 'annule') return;

    const interval = setInterval(() => refreshPosition(true), 5000);
    const countdownInterval = setInterval(() => {
      setCountdown((c) => (c <= 1 ? 5 : c - 1));
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(countdownInterval);
    };
  }, [checkResult, refreshPosition]);

  const getStatusMessage = () => {
    if (!checkResult) return null;
    const { patient, position } = checkResult;

    if (patient.statut === 'en_consultation') {
      return { icon: <CheckCircle className="w-16 h-16 text-green-500" />, title: "C'est votre tour !", message: "Vous êtes actuellement en consultation.", color: "green" };
    }
    if (patient.statut === 'termine') {
      return { icon: <CheckCircle className="w-16 h-16 text-slate-500" />, title: "Consultation terminée", message: "Votre consultation est terminée. Merci de votre visite !", color: "slate" };
    }
    if (patient.statut === 'annule') {
      return { icon: <AlertCircle className="w-16 h-16 text-red-500" />, title: "Rendez-vous annulé", message: "Votre rendez-vous a été annulé. Veuillez reprendre un rendez-vous.", color: "red" };
    }
    if (position === 0) {
      return { icon: <Users className="w-16 h-16 text-amber-500" />, title: "Vous êtes le prochain !", message: "Préparez-vous, vous allez être appelé très bientôt.", color: "amber" };
    }
    return { icon: <Clock className="w-16 h-16 text-blue-500" />, title: "En attente", message: `Il reste ${position} patient${position > 1 ? 's' : ''} avant vous.`, color: "blue" };
  };

  const status = getStatusMessage();
  const isActive = checkResult && checkResult.patient.statut !== 'termine' && checkResult.patient.statut !== 'annule';

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">📱 Suivi File d'attente</h1>
          <p className="text-slate-600">Suivez votre position en temps réel</p>
        </div>

        {!checkResult && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <form onSubmit={handleCheck} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Votre code à 4 chiffres</label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full px-4 py-3 text-center text-2xl tracking-widest border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="1234"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Votre numéro de téléphone</label>
                <input
                  type="tel"
                  required
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="06 12 34 56 78"
                />
              </div>
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
              )}
              <button
                type="submit"
                disabled={loading || code.length !== 4}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-lg font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Vérification...' : 'Vérifier ma position'}
              </button>
            </form>
          </div>
        )}

        {checkResult && status && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-slate-100 mb-4">
                {status.icon}
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">{status.title}</h2>
              <p className="text-slate-600">{status.message}</p>
            </div>

            {checkResult.patient.statut === 'en_attente' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-slate-800">{checkResult.patientsDevant}</div>
                    <div className="text-sm text-slate-600">patient(s) devant</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-slate-800">~{checkResult.tempsAttente}</div>
                    <div className="text-sm text-slate-600">minutes d'attente</div>
                  </div>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="text-sm text-amber-800 text-center">
                    💡 <strong>Conseil :</strong> Restez à proximité du cabinet. Vous serez appelé par votre nom.
                  </p>
                </div>
              </div>
            )}

            {isActive && (
              <div className="mt-4 flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-3">
                <span className="flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" style={{ animationDuration: '3s' }} />
                  Actualisation dans {countdown}s
                </span>
                {lastRefresh && (
                  <span>
                    Dernière mise à jour : {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                )}
              </div>
            )}

            <button
              onClick={() => {
                setCheckResult(null);
                setCode('');
                setTelephone('');
                setError('');
                setLastRefresh(null);
              }}
              className="w-full mt-6 py-3 border-2 border-slate-300 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 transition-all"
            >
              Vérifier un autre code
            </button>
          </div>
        )}

        <div className="bg-white/50 backdrop-blur rounded-xl p-4 text-sm text-slate-600">
          <h3 className="font-semibold text-slate-800 mb-2">Comment ça marche ?</h3>
          <ol className="space-y-2 list-decimal list-inside">
            <li>Saisissez le code à 4 chiffres reçu à l'accueil</li>
            <li>Entrez votre numéro de téléphone</li>
            <li>Suivez votre position en temps réel</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

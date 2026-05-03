import { Link } from 'react-router-dom';
import { UserRound, Users, ExternalLink } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-slate-800 mb-4">🏥 File d'attente Médicale</h1>
          <p className="text-xl text-slate-600">Système de gestion de file d'attente pour cabinet médical</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col">
            <div className="flex flex-col items-center text-center flex-1">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <UserRound className="w-10 h-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-3">Espace Médecin</h2>
              <p className="text-slate-600 mb-2">
                Créez votre compte, gérez votre file d'attente et suivez les consultations en temps réel.
              </p>
            </div>
            <Link
              to="/medecin"
              className="mt-6 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Accéder à mon espace
            </Link>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col">
            <div className="flex flex-col items-center text-center flex-1">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                <Users className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-3">Espace Patient</h2>
              <p className="text-slate-600 mb-4">
                Suivez votre position dans la file d'attente grâce au lien partagé par votre médecin.
              </p>
              <div className="w-full bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800">
                <p className="font-semibold mb-1">Comment accéder ?</p>
                <p>Utilisez le lien unique communiqué par votre médecin ou la secrétaire à votre arrivée.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center text-slate-500 text-sm">
          <p>© {new Date().getFullYear()} File d'attente Médicale</p>
          <a href="/admin" className="mt-2 inline-block text-xs text-slate-400 hover:text-slate-600 transition-colors underline underline-offset-2">
            Accès administrateur
          </a>
        </div>
      </div>
    </div>
  );
}

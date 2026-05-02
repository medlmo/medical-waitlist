import { Link } from 'react-router-dom';
import { UserRound, Users } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-slate-800 mb-4">🏥 File d'attente Médicale</h1>
          <p className="text-xl text-slate-600">Système de gestion de file d'attente pour cabinet médical</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Option Médecin */}
          <Link 
            to="/medecin"
            className="group bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all hover:-translate-y-1"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-blue-200 transition-colors">
                <UserRound className="w-10 h-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-3">Interface Médecin</h2>
              <p className="text-slate-600 mb-4">
                Gérez la file d'attente, ajoutez des patients et suivez les consultations en temps réel.
              </p>
              <span className="inline-flex items-center text-blue-600 font-semibold">
                Accéder à l'interface
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </Link>

          {/* Option Patient */}
          <Link 
            to="/patient"
            className="group bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all hover:-translate-y-1"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-emerald-200 transition-colors">
                <Users className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-3">Interface Patient</h2>
              <p className="text-slate-600 mb-4">
                Suivez votre position dans la file d'attente et consultez le temps d'attente estimé.
              </p>
              <span className="inline-flex items-center text-emerald-600 font-semibold">
                Accéder au suivi
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </Link>
        </div>

        <div className="mt-12 text-center text-slate-500 text-sm">
          <p>© 2025 Cabinet Médical - Système de gestion de file d'attente</p>
        </div>
      </div>
    </div>
  );
}
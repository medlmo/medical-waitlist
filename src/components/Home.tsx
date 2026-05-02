import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserRound, Users, Copy, Check, ExternalLink } from 'lucide-react';

function CopyLinkButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);
  const fullUrl = `${window.location.origin}${path}`;

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 mt-4 w-full">
      <span className="text-xs text-slate-500 truncate flex-1 font-mono">{fullUrl}</span>
      <button
        onClick={handleCopy}
        className="shrink-0 p-1 rounded hover:bg-slate-200 transition-colors"
        title="Copier le lien"
      >
        {copied
          ? <Check className="w-4 h-4 text-green-500" />
          : <Copy className="w-4 h-4 text-slate-400" />
        }
      </button>
    </div>
  );
}

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
              <h2 className="text-2xl font-bold text-slate-800 mb-3">Interface Médecin</h2>
              <p className="text-slate-600 mb-2">
                Gérez la file d'attente, ajoutez des patients et suivez les consultations en temps réel.
              </p>
            </div>

            <CopyLinkButton path="/medecin" />

            <Link
              to="/medecin"
              className="mt-3 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Accéder à l'interface
            </Link>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col">
            <div className="flex flex-col items-center text-center flex-1">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                <Users className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-3">Interface Patient</h2>
              <p className="text-slate-600 mb-2">
                Suivez votre position dans la file d'attente et consultez le temps d'attente estimé.
              </p>
            </div>

            <CopyLinkButton path="/patient" />

            <Link
              to="/patient"
              className="mt-3 inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Accéder au suivi
            </Link>
          </div>
        </div>

        <div className="mt-12 text-center text-slate-500 text-sm">
          <p>© 2025 Cabinet Médical - Système de gestion de file d'attente</p>
        </div>
      </div>
    </div>
  );
}

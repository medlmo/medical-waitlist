# Gestion de File d'Attente Médicale

Application web multi-tenant de gestion de file d'attente pour cabinets médicaux. Chaque cabinet dispose de son propre espace sécurisé avec deux rôles distincts et une interface patient partageable par QR code ou lien URL.

## Interfaces

| Interface | URL | Accès |
|-----------|-----|-------|
| Page d'accueil | `/` | Public |
| Espace médecin / assistante | `/medecin` | JWT (login) |
| Suivi patient | `/patient/:cabinet_code` | Public (code + téléphone) |
| Espace administrateur | `/admin` | Identifiants admin |

## Rôles

**Assistante** — gère la file d'attente :
- Ajout de patients (nom, prénom, âge, téléphone, motif)
- Appel du patient suivant
- Changement de statut (terminer, annuler, remettre en attente)
- Visualisation de la file et de l'historique du jour

**Médecin** — consultation en lecture seule :
- Vue de la file d'attente et de l'historique
- Statistiques du jour
- Accès au QR code / lien patient

**Administrateur** — gestion des comptes :
- Création de comptes médecin et assistante
- Modification des informations (prénom, nom, email)
- Réinitialisation de mot de passe
- Suppression de compte

## Architecture

```
├── src/                          # Frontend React + TypeScript + Vite
│   ├── api/
│   │   ├── http.ts               # Client Axios, helpers token JWT
│   │   ├── patients.ts           # API patients, types TypeScript
│   │   └── admin.ts              # API admin
│   ├── components/
│   │   ├── Home.tsx              # Page d'accueil
│   │   ├── MedecinInterface.tsx  # Dashboard médecin / assistante
│   │   ├── PatientInterface.tsx  # Suivi position patient
│   │   └── AdminInterface.tsx    # Gestion des comptes
│   └── App.tsx                   # Router : /, /medecin, /patient/:code, /admin
├── backend/
│   ├── routes/
│   │   ├── auth.js               # POST /api/auth/register|login, GET /api/auth/me
│   │   ├── patients.js           # Routes dashboard et patients (JWT requis)
│   │   └── admin.js              # Routes admin (identifiants admin requis)
│   ├── services/
│   │   ├── medecinService.js     # Logique register, login, getMe
│   │   └── patientService.js     # Logique file d'attente, vérification patient
│   ├── repositories/
│   │   ├── medecinRepository.js  # Requêtes SQL comptes médecins
│   │   └── patientRepository.js  # Requêtes SQL patients (scoped par cabinet_code)
│   ├── middleware/
│   │   ├── auth.js               # requireDoctor — vérifie JWT, injecte cabinetCode + userRole
│   │   └── adminAuth.js          # requireAdmin — vérifie token admin
│   ├── cleanup.js                # Job de nettoyage automatique (2h00 chaque nuit)
│   ├── db.js                     # Pool PostgreSQL + initDB()
│   ├── errors.js                 # AppError + asyncHandler
│   └── server.js                 # Express app, CORS, routes, static (production)
├── vite.config.ts                # Proxy /api → http://localhost:3001
└── package.json
```

## Base de données

```
medecins
  id, email, password_hash, nom, prenom, nom_cabinet,
  cabinet_code (6 caractères, partagé par médecin + assistante du même cabinet),
  role ('medecin' | 'assistante'), created_at

patients
  id, medecin_id (FK), nom, prenom, age, telephone, motif,
  code (4 chiffres, unique par jour par cabinet), statut,
  heure_arrivee, heure_appel, heure_fin, created_at
```

## Multi-tenant

- Chaque cabinet possède un `cabinet_code` unique à 6 caractères
- Le médecin et l'assistante du même cabinet partagent le même `cabinet_code`
- Toutes les requêtes patients sont scopées par `cabinet_code` via JOIN
- Lien patient partageable : `/patient/:cabinet_code`

## Nettoyage automatique des données

Un job tourne chaque nuit à **2h00** et supprime les patients enregistrés avant la veille (J-2 et plus). Les données de J et J-1 sont conservées, ce qui laisse le temps de consulter le bilan du lendemain matin.

## Persistance de session patient

Quand un patient vérifie sa position, ses identifiants (code + téléphone) sont sauvegardés en `sessionStorage`. À l'actualisation de la page, sa position se recharge automatiquement sans ressaisie. La session s'efface à la fermeture de l'onglet.

## API

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | /api/auth/register | — | Créer un compte, retourne JWT |
| POST | /api/auth/login | — | Login, retourne JWT |
| GET | /api/auth/me | JWT | Infos compte connecté |
| GET | /api/dashboard | JWT | File d'attente + historique + stats du jour |
| POST | /api/patients | JWT (assistante) | Ajouter un patient |
| POST | /api/patients/appeler-suivant | JWT (assistante) | Appeler le prochain |
| PATCH | /api/patients/:id/statut | JWT (assistante) | Changer le statut |
| POST | /api/patients/verifier | — | Vérification patient (code + téléphone) |
| GET | /api/bilan | JWT | Bilan statistique du jour |
| POST | /api/admin/login | Admin | Login administrateur |
| GET | /api/admin/medecins | Admin JWT | Liste tous les comptes |
| POST | /api/admin/medecins | Admin JWT | Créer un compte |
| PATCH | /api/admin/medecins/:id | Admin JWT | Modifier un compte |
| PATCH | /api/admin/medecins/:id/password | Admin JWT | Réinitialiser mot de passe |
| DELETE | /api/admin/medecins/:id | Admin JWT | Supprimer un compte |

## Variables d'environnement

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | URL PostgreSQL (géré par Replit) |
| `JWT_SECRET` | Clé secrète JWT (96 caractères hex) |
| `ADMIN_EMAIL` | Email de connexion administrateur |
| `ADMIN_PASSWORD` | Mot de passe administrateur |

## Lancement (développement)

```bash
# Dépendances
npm install
cd backend && npm install && cd ..

# Terminal 1 — Backend (port 3001)
node backend/server.js

# Terminal 2 — Frontend (port 5000)
npm run dev
```

## Build production

```bash
npm install && cd backend && npm install && cd .. && npm run build
node backend/server.js   # sert les fichiers statiques + API sur le même port
```

## Technologies

- **Frontend** : React 19, TypeScript, Vite, Tailwind CSS 4, React Router v7, Axios, qrcode.react
- **Backend** : Node.js, Express 4, jsonwebtoken, bcryptjs
- **Base de données** : PostgreSQL (Replit managed)

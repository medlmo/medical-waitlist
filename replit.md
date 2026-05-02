# Medical Queue Management App (File d'attente Médicale)

## Overview
A full-stack medical waiting room queue management application with:
- **Doctor Interface** (`/medecin`): Manage patients and the queue
- **Patient Interface** (`/patient`): Real-time position tracking

## Architecture

### Frontend
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS 4
- **Routing**: React Router DOM v7
- **HTTP Client**: Axios (proxied through Vite to backend)
- **Port**: 5000 (dev server on 0.0.0.0)

### Backend
- **Runtime**: Node.js with Express 4
- **Database**: PostgreSQL (Replit managed, via DATABASE_URL)
- **Port**: 3001 (localhost)
- **Pattern**: Routes → Services → Repositories

### Database
- Replit managed PostgreSQL
- Single table: `patients` with columns: id, nom, prenom, age, telephone, motif, code, statut, heure_arrivee, heure_appel, heure_fin, created_at
- Schema auto-initialized on backend startup

## Project Structure
```
├── src/                  # Frontend React app
│   ├── api/              # API clients (http.ts, patients.ts)
│   ├── components/       # React components (Home, MedecinInterface, PatientInterface)
│   ├── utils/            # Utilities (cn.ts)
│   ├── App.tsx           # Router setup
│   └── main.tsx          # Entry point
├── backend/              # Node.js/Express backend
│   ├── routes/           # Express routes (patients.js)
│   ├── services/         # Business logic (patientService.js)
│   ├── repositories/     # DB queries (patientRepository.js)
│   ├── db.js             # PostgreSQL pool via DATABASE_URL
│   ├── errors.js         # Error handling middleware
│   └── server.js         # Express app entry
├── vite.config.ts        # Vite config (proxy /api -> localhost:3001)
└── package.json          # Frontend dependencies
```

## Key Workflows
- **Backend**: `node backend/server.js` → port 3001 (console output)
- **Frontend**: `npm run dev` → port 5000 (webview output)

## API Proxy
Vite proxies `/api/*` to `http://localhost:3001` in development, so the frontend uses relative URLs (`/api/...`).

## Environment Variables
- `DATABASE_URL`: Replit managed PostgreSQL connection string (auto-set)
- `PORT`: Backend port (set to 3001)

## Features
- Add patients with auto-generated 4-digit unique code
- Queue management: call next, update status (en_attente, en_consultation, termine, annule)
- Patient self-service: verify identity with code + phone number
- Real-time queue position and estimated wait time
- Daily statistics and consultation history

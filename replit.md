# Medical Queue Management App (File d'attente Médicale)

## Overview
A full-stack multi-tenant medical waiting room queue management app where each doctor has their own account, patient queue, and shareable patient URL.

- **Doctor Interface** (`/medecin`): Register/login, manage patients and queue, view daily stats
- **Patient Interface** (`/patient/:cabinet_code`): Real-time position tracking via unique cabinet link

## Architecture

### Frontend
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS 4
- **Routing**: React Router DOM v7
- **HTTP Client**: Axios via `apiClient` (Bearer JWT header injected automatically)
- **Port**: 5000 (dev server on 0.0.0.0)

### Backend
- **Runtime**: Node.js with Express 4
- **Database**: PostgreSQL (Replit managed, via DATABASE_URL)
- **Port**: 3001 (localhost)
- **Pattern**: Routes → Services → Repositories
- **Auth**: JWT (jsonwebtoken + bcryptjs), 7-day expiry

### Database Tables
- `medecins`: id, email, password_hash, nom, prenom, nom_cabinet, cabinet_code (6-char unique), created_at
- `patients`: id, medecin_id (FK), nom, prenom, age, telephone, motif, code (4-digit daily unique), statut, heure_arrivee, heure_appel, heure_fin, created_at
- Schema auto-initialized on backend startup via `initDB()`

## Project Structure
```
├── src/                  # Frontend React app
│   ├── api/
│   │   ├── http.ts       # Axios client, token helpers (getDoctorToken, setDoctorToken, clearDoctorToken)
│   │   └── patients.ts   # authApi, patientsApi, TypeScript types
│   ├── components/
│   │   ├── Home.tsx              # Landing page
│   │   ├── MedecinInterface.tsx  # Doctor dashboard (auth + queue management)
│   │   └── PatientInterface.tsx  # Patient position tracker
│   ├── App.tsx           # Router: /, /medecin, /patient/:cabinet_code
│   └── main.tsx
├── backend/
│   ├── routes/
│   │   ├── auth.js       # POST /api/auth/register, /login; GET /api/auth/me
│   │   └── patients.js   # All patient/dashboard routes (doctor-scoped)
│   ├── services/
│   │   ├── medecinService.js   # register, login, getMe
│   │   └── patientService.js   # addPatient, getDashboard, callNextPatient, updateStatus, verifyPatient, getDailyBilan
│   ├── repositories/
│   │   ├── medecinRepository.js  # findByEmail, findById, findByCabinetCode, createMedecin, cabinetCodeExists
│   │   └── patientRepository.js  # All patient DB queries scoped by medecinId
│   ├── middleware/auth.js  # requireDoctor — JWT verification, sets req.medecinId
│   ├── db.js              # PostgreSQL pool + initDB()
│   ├── errors.js          # AppError class + asyncHandler
│   └── server.js          # Express app, CORS, routes
├── vite.config.ts         # Proxy /api → http://localhost:3001
└── package.json
```

## Key Workflows
- **Backend**: `node backend/server.js` → port 3001
- **Frontend**: `npm run dev` → port 5000

## API Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/register | — | Create doctor account, returns JWT |
| POST | /api/auth/login | — | Login, returns JWT |
| GET | /api/auth/me | JWT | Get current doctor |
| GET | /api/dashboard | JWT | enAttente, enConsultation, historique, stats |
| POST | /api/patients | JWT | Add patient to queue |
| POST | /api/patients/appeler-suivant | JWT | Call next waiting patient |
| PATCH | /api/patients/:id/statut | JWT | Update patient status |
| POST | /api/patients/verifier | — | Patient self-verify (code + telephone + cabinet_code) |
| GET | /api/bilan | JWT | Daily bilan stats |

## Environment Variables
- `DATABASE_URL`: Replit managed PostgreSQL (auto-set)
- `JWT_SECRET`: 96-char hex secret (set as Replit secret)

## Multi-Tenant Design
- Each doctor registers with email + password → gets unique 6-char `cabinet_code`
- All patient queries are scoped by `medecin_id`
- Patient URL: `/patient/:cabinet_code` — shareable per doctor
- JWT stored in `localStorage` under key `doctor_token`

## Production Deployment
- Build: `npm install && cd backend && npm install && cd .. && npm run build`
- Run: `node backend/server.js` (serves static `dist/` in production)
- CORS: allows localhost:5000, *.replit.dev, *.replit.app
- PORT: set by Cloud Run in production (not hardcoded)

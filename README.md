# 🏥 Gestion de File d'Attente Médicale

Application complète de gestion de file d'attente pour cabinet médical avec :
- Interface Médecin (`/medecin`) : Gestion des patients et de la file
- Interface Patient (`/patient`) : Suivi de position en temps réel
- Base de données PostgreSQL pour la persistance des données

## 📁 Structure du projet

```
├── src/
│   ├── components/
│   │   ├── Home.tsx           # Page d'accueil avec choix d'interface
│   │   ├── MedecinInterface.tsx  # Interface médecin
│   │   └── PatientInterface.tsx  # Interface patient
│   └── App.tsx
├── backend/
│   ├── server.js              # Serveur Express
│   ├── db.js                  # Configuration PostgreSQL
│   └── package.json
├── .env                       # Variables d'environnement
└── package.json
```

## 🚀 Installation et Configuration

### 1. Prérequis

- Node.js (v16+)
- PostgreSQL (v12+)

### 2. Configuration de la base de données

```bash
# Se connecter à PostgreSQL
psql -U postgres

# Créer la base de données
CREATE DATABASE file_attente_medecin;

# Quitter
\q
```

### 3. Configuration des variables d'environnement

Créez/modifiez le fichier `.env` à la racine :

```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=file_attente_medecin
DB_PASSWORD=votre_mot_de_passe
DB_PORT=5432
PORT=3001
```

### 4. Installation des dépendances

```bash
# Frontend
npm install

# Backend
cd backend
npm install
cd ..
```

## 🎯 Lancement de l'application

### Terminal 1 - Backend
```bash
cd backend
npm start
```
Le serveur démarre sur http://localhost:3001

### Terminal 2 - Frontend
```bash
npm run dev
```
L'application démarre sur http://localhost:5173

## 📱 Utilisation

### Accès aux interfaces

1. **Page d'accueil** : http://localhost:5173/
   - Choisissez entre l'interface Médecin ou Patient

2. **Interface Médecin** : http://localhost:5173/medecin
   - Ajoutez des patients avec leurs informations
   - Le système génère automatiquement un code à 4 chiffres
   - Gérez la file d'attente (appeler, terminer, annuler)
   - Un seul patient peut être en consultation à la fois

3. **Interface Patient** : http://localhost:5173/patient
   - Saisissez le code à 4 chiffres reçu
   - Entrez votre numéro de téléphone
   - Suivez votre position en temps réel

### Fonctionnalités principales

**Interface Médecin :**
- ✅ Ajout de patients (nom, prénom, âge, téléphone, motif)
- ✅ Génération automatique de code unique à 4 chiffres
- ✅ Visualisation de la file d'attente
- ✅ Appel du patient suivant (avec blocage si consultation en cours)
- ✅ Gestion des consultations (terminer, remettre en attente, annuler)
- ✅ Historique des consultations du jour
- ✅ Statistiques en temps réel

**Interface Patient :**
- ✅ Vérification par code + téléphone
- ✅ Position dans la file
- ✅ Temps d'attente estimé
- ✅ Notifications de statut (en attente, en consultation, terminé, annulé)
- ✅ Confidentialité : aucune info des autres patients visible

## 🔒 Sécurité

- Vérification par code à 4 chiffres ET numéro de téléphone
- Les patients ne voient que leur propre position
- Données stockées en base PostgreSQL sécurisée

## 🛠️ Technologies utilisées

- **Frontend** : React, TypeScript, Tailwind CSS, React Router, Axios
- **Backend** : Node.js, Express
- **Base de données** : PostgreSQL
- **UI Icons** : Lucide React

## 📝 Notes

- Les données sont persistées dans PostgreSQL
- Rafraîchissement automatique toutes les 5 secondes sur l'interface médecin
- Les consultations du jour sont automatiquement filtrées par date
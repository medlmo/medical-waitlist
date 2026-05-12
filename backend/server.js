const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const { initDB } = require('./db');
const patientRoutes = require('./routes/patients');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const { errorMiddleware } = require('./errors');
const { scheduleCleanup } = require('./cleanup');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  'http://localhost:5000',
  'http://0.0.0.0:5000',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.replit.dev') ||
      origin.endsWith('.replit.app')
    ) {
      return callback(null, true);
    }
    return callback(new Error('Origine non autorisée par CORS'));
  },
  credentials: true,
}));

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());

const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Trop de tentatives. Veuillez réessayer dans 15 minutes.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.' },
});

app.use('/api/patients/verifier', verifyLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/admin/login', authLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', patientRoutes);
app.use(errorMiddleware);

const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const startServer = async () => {
  await initDB();
  scheduleCleanup();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveur demarre sur le port ${PORT}`);
  });
};

if (require.main === module) {
  startServer().catch((err) => {
    console.error('Impossible de demarrer le serveur:', err);
    process.exit(1);
  });
}

module.exports = { app, startServer };

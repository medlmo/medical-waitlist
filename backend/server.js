const express = require('express');
const cors = require('cors');
const { initDB } = require('./db');
const patientRoutes = require('./routes/patients');
const { errorMiddleware } = require('./errors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api', patientRoutes);
app.use(errorMiddleware);

const startServer = async () => {
  await initDB();
  app.listen(PORT, () => {
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
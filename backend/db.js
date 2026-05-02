const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'file_attente_medecin',
  password: process.env.DB_PASSWORD || 'admin',
  port: process.env.DB_PORT || 5432,
});

// Création des tables si elles n'existent pas
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS patients (
        id SERIAL PRIMARY KEY,
        nom VARCHAR(100) NOT NULL,
        prenom VARCHAR(100) NOT NULL,
        age INTEGER,
        telephone VARCHAR(20) NOT NULL,
        motif VARCHAR(50) NOT NULL,
        code VARCHAR(10) UNIQUE NOT NULL,
        statut VARCHAR(20) DEFAULT 'en_attente',
        heure_arrivee TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        heure_appel TIMESTAMP,
        heure_fin TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Base de données initialisée');
  } catch (err) {
    console.error('Erreur initialisation DB:', err);
  }
};

module.exports = { pool, initDB };
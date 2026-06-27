const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : false,
});

const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS medecins (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        nom VARCHAR(100) NOT NULL,
        prenom VARCHAR(100) NOT NULL,
        nom_cabinet VARCHAR(200) NOT NULL,
        cabinet_code VARCHAR(10) NOT NULL,
        role VARCHAR(20) DEFAULT 'assistante' NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS patients (
        id SERIAL PRIMARY KEY,
        medecin_id INTEGER REFERENCES medecins(id) ON DELETE CASCADE,
        nom VARCHAR(100) NOT NULL,
        prenom VARCHAR(100) NOT NULL,
        age INTEGER,
        telephone VARCHAR(20) NOT NULL,
        motif VARCHAR(50) NOT NULL,
        code VARCHAR(10) NOT NULL,
        statut VARCHAR(20) DEFAULT 'en_attente',
        heure_arrivee TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        heure_appel TIMESTAMP,
        heure_fin TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'patients' AND column_name = 'medecin_id'
        ) THEN
          ALTER TABLE patients ADD COLUMN medecin_id INTEGER REFERENCES medecins(id) ON DELETE CASCADE;
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'medecins' AND column_name = 'role'
        ) THEN
          ALTER TABLE medecins ADD COLUMN role VARCHAR(20) DEFAULT 'assistante' NOT NULL;
        END IF;
        IF EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE table_name = 'medecins'
            AND constraint_name = 'medecins_cabinet_code_key'
            AND constraint_type = 'UNIQUE'
        ) THEN
          ALTER TABLE medecins DROP CONSTRAINT medecins_cabinet_code_key;
        END IF;
        IF EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'patients_medecin_id_fkey'
            AND table_name = 'patients'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.referential_constraints
          WHERE constraint_name = 'patients_medecin_id_fkey'
            AND delete_rule = 'CASCADE'
        ) THEN
          ALTER TABLE patients DROP CONSTRAINT patients_medecin_id_fkey;
          ALTER TABLE patients ADD CONSTRAINT patients_medecin_id_fkey
            FOREIGN KEY (medecin_id) REFERENCES medecins(id) ON DELETE CASCADE;
        END IF;
      END$$;
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_medecins_cabinet_code ON medecins(cabinet_code)
    `);
    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_medecins_cabinet_code_medecin
      ON medecins(cabinet_code) WHERE role = 'medecin'
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_patients_medecin_id ON patients(medecin_id)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_patients_statut ON patients(statut)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_patients_heure_arrivee ON patients(heure_arrivee)
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id SERIAL PRIMARY KEY,
        token_hash VARCHAR(64) NOT NULL UNIQUE,
        medecin_id INTEGER REFERENCES medecins(id) ON DELETE CASCADE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        revoked_at TIMESTAMP
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_medecin ON refresh_tokens(medecin_id)
    `);

    console.log('Base de données initialisée');
  } catch (err) {
    console.error('Erreur fatale initialisation DB:', err);
    process.exit(1);
  }
};

module.exports = { pool, initDB };

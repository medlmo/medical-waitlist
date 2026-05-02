const { pool } = require('../db');

const findByCode = async (code) => {
  const result = await pool.query('SELECT id FROM patients WHERE code = $1', [code]);
  return result.rows[0] || null;
};

const createPatient = async ({ nom, prenom, age, telephone, motif, code }) => {
  const result = await pool.query(
    `INSERT INTO patients (nom, prenom, age, telephone, motif, code, statut)
     VALUES ($1, $2, $3, $4, $5, $6, 'en_attente')
     RETURNING *`,
    [nom, prenom, age, telephone, motif, code]
  );

  return result.rows[0];
};

const getPatientsForToday = async () => {
  const result = await pool.query(
    `SELECT * FROM patients
     WHERE statut IN ('en_attente', 'en_consultation')
     AND DATE(heure_arrivee) = CURRENT_DATE
     ORDER BY heure_arrivee ASC`
  );

  return result.rows;
};

const getHistoryForToday = async () => {
  const result = await pool.query(
    `SELECT * FROM patients
     WHERE statut IN ('termine', 'annule')
     AND DATE(heure_arrivee) = CURRENT_DATE
     ORDER BY heure_fin DESC
     LIMIT 20`
  );

  return result.rows;
};

const getPatientInConsultation = async () => {
  const result = await pool.query(
    `SELECT * FROM patients
     WHERE statut = 'en_consultation'
     AND DATE(heure_arrivee) = CURRENT_DATE`
  );

  return result.rows[0] || null;
};

const getNextWaitingPatient = async () => {
  const result = await pool.query(
    `SELECT * FROM patients
     WHERE statut = 'en_attente' AND DATE(heure_arrivee) = CURRENT_DATE
     ORDER BY heure_arrivee ASC
     LIMIT 1`
  );

  return result.rows[0] || null;
};

const updatePatientStatus = async (id, statut) => {
  let query;
  if (statut === 'en_consultation') {
    query = `UPDATE patients SET statut = $1, heure_appel = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`;
  } else if (statut === 'termine' || statut === 'annule') {
    query = `UPDATE patients SET statut = $1, heure_fin = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`;
  } else if (statut === 'en_attente') {
    query = `UPDATE patients SET statut = $1, heure_appel = NULL WHERE id = $2 RETURNING *`;
  } else {
    query = `UPDATE patients SET statut = $1 WHERE id = $2 RETURNING *`;
  }

  const result = await pool.query(query, [statut, id]);
  return result.rows[0] || null;
};

const findPatientForVerification = async ({ code, phoneDigits, phoneSuffix }) => {
  const result = await pool.query(
    `SELECT * FROM patients
     WHERE code = $1
     AND (telephone = $2 OR telephone LIKE $3)
     AND DATE(heure_arrivee) = CURRENT_DATE`,
    [code, phoneDigits, `%${phoneSuffix}`]
  );

  return result.rows[0] || null;
};

const countWaitingBefore = async (heureArrivee) => {
  const result = await pool.query(
    `SELECT COUNT(*) as position FROM patients
     WHERE statut = 'en_attente'
     AND heure_arrivee < $1
     AND DATE(heure_arrivee) = CURRENT_DATE`,
    [heureArrivee]
  );

  return parseInt(result.rows[0].position, 10);
};

const getStatsForToday = async () => {
  const result = await pool.query(
    `SELECT
      COUNT(*) FILTER (WHERE statut = 'en_attente') as en_attente,
      COUNT(*) FILTER (WHERE statut = 'en_consultation') as en_consultation,
      COUNT(*) FILTER (WHERE statut IN ('termine', 'annule')) as traites
     FROM patients
     WHERE DATE(heure_arrivee) = CURRENT_DATE`
  );

  return result.rows[0];
};

const getDailyBilan = async () => {
  const result = await pool.query(
    `SELECT
      COUNT(*) as total_patients,
      COUNT(*) FILTER (WHERE statut = 'termine') as termines,
      COUNT(*) FILTER (WHERE statut = 'annule') as annules,
      COUNT(*) FILTER (WHERE motif = 'premier_contact') as premier_contact,
      COUNT(*) FILTER (WHERE motif = 'controle') as controle,
      ROUND(
        AVG(
          EXTRACT(EPOCH FROM (heure_fin - heure_appel)) / 60
        ) FILTER (WHERE statut = 'termine' AND heure_appel IS NOT NULL AND heure_fin IS NOT NULL)
      , 1) as duree_moyenne_minutes
     FROM patients
     WHERE DATE(heure_arrivee) = CURRENT_DATE`
  );

  return result.rows[0];
};

module.exports = {
  findByCode,
  createPatient,
  getPatientsForToday,
  getHistoryForToday,
  getPatientInConsultation,
  getNextWaitingPatient,
  updatePatientStatus,
  findPatientForVerification,
  countWaitingBefore,
  getStatsForToday,
  getDailyBilan,
};

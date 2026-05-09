const { pool } = require('../db');

const findByCodeToday = async (code, cabinetCode) => {
  const result = await pool.query(
    `SELECT p.id FROM patients p
     JOIN medecins m ON p.medecin_id = m.id
     WHERE p.code = $1 AND m.cabinet_code = $2 AND DATE(p.heure_arrivee) = CURRENT_DATE`,
    [code, cabinetCode]
  );
  return result.rows[0] || null;
};

const createPatient = async ({ nom, prenom, age, telephone, motif, code, medecinId }) => {
  const result = await pool.query(
    `INSERT INTO patients (medecin_id, nom, prenom, age, telephone, motif, code, statut)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'en_attente')
     RETURNING *`,
    [medecinId, nom, prenom, age, telephone, motif, code]
  );
  return result.rows[0];
};

const getPatientsForToday = async (cabinetCode) => {
  const result = await pool.query(
    `SELECT p.* FROM patients p
     JOIN medecins m ON p.medecin_id = m.id
     WHERE m.cabinet_code = $1
     AND p.statut IN ('en_attente', 'en_consultation')
     AND DATE(p.heure_arrivee) = CURRENT_DATE
     ORDER BY p.heure_arrivee ASC`,
    [cabinetCode]
  );
  return result.rows;
};

const getHistoryForToday = async (cabinetCode) => {
  const result = await pool.query(
    `SELECT p.* FROM patients p
     JOIN medecins m ON p.medecin_id = m.id
     WHERE m.cabinet_code = $1
     AND p.statut IN ('termine', 'annule')
     AND DATE(p.heure_arrivee) = CURRENT_DATE
     ORDER BY p.heure_fin DESC
     LIMIT 20`,
    [cabinetCode]
  );
  return result.rows;
};

const getPatientInConsultation = async (cabinetCode) => {
  const result = await pool.query(
    `SELECT p.* FROM patients p
     JOIN medecins m ON p.medecin_id = m.id
     WHERE m.cabinet_code = $1
     AND p.statut = 'en_consultation'
     AND DATE(p.heure_arrivee) = CURRENT_DATE`,
    [cabinetCode]
  );
  return result.rows[0] || null;
};

const getNextWaitingPatient = async (cabinetCode) => {
  const result = await pool.query(
    `SELECT p.* FROM patients p
     JOIN medecins m ON p.medecin_id = m.id
     WHERE m.cabinet_code = $1
     AND p.statut = 'en_attente'
     AND DATE(p.heure_arrivee) = CURRENT_DATE
     ORDER BY p.heure_arrivee ASC
     LIMIT 1`,
    [cabinetCode]
  );
  return result.rows[0] || null;
};

const updatePatientStatus = async (id, statut, cabinetCode) => {
  let setClause;
  if (statut === 'en_consultation') {
    setClause = 'statut = $1, heure_appel = CURRENT_TIMESTAMP';
  } else if (statut === 'termine' || statut === 'annule') {
    setClause = 'statut = $1, heure_fin = CURRENT_TIMESTAMP';
  } else if (statut === 'en_attente') {
    setClause = 'statut = $1, heure_appel = NULL';
  } else {
    setClause = 'statut = $1';
  }
  const result = await pool.query(
    `UPDATE patients p SET ${setClause}
     FROM medecins m
     WHERE p.medecin_id = m.id
     AND p.id = $2 AND m.cabinet_code = $3
     RETURNING p.*`,
    [statut, id, cabinetCode]
  );
  return result.rows[0] || null;
};

const findPatientForVerification = async ({ code, phoneDigits, phoneSuffix, cabinetCode }) => {
  const result = await pool.query(
    `SELECT p.* FROM patients p
     JOIN medecins m ON p.medecin_id = m.id
     WHERE p.code = $1
     AND m.cabinet_code = $2
     AND (p.telephone = $3 OR p.telephone LIKE $4)
     AND DATE(p.heure_arrivee) = CURRENT_DATE`,
    [code, cabinetCode, phoneDigits, `%${phoneSuffix}`]
  );
  return result.rows[0] || null;
};

const countWaitingBefore = async (heureArrivee, cabinetCode) => {
  const result = await pool.query(
    `SELECT COUNT(*) as position FROM patients p
     JOIN medecins m ON p.medecin_id = m.id
     WHERE m.cabinet_code = $1
     AND p.statut = 'en_attente'
     AND p.heure_arrivee < $2
     AND DATE(p.heure_arrivee) = CURRENT_DATE`,
    [cabinetCode, heureArrivee]
  );
  return parseInt(result.rows[0].position, 10);
};

const getStatsForToday = async (cabinetCode) => {
  const result = await pool.query(
    `SELECT
      COUNT(*) FILTER (WHERE p.statut = 'en_attente') as en_attente,
      COUNT(*) FILTER (WHERE p.statut = 'en_consultation') as en_consultation,
      COUNT(*) FILTER (WHERE p.statut IN ('termine', 'annule')) as traites
     FROM patients p
     JOIN medecins m ON p.medecin_id = m.id
     WHERE m.cabinet_code = $1
     AND DATE(p.heure_arrivee) = CURRENT_DATE`,
    [cabinetCode]
  );
  return result.rows[0];
};

const getAverageConsultationDuration = async (cabinetCode) => {
  const result = await pool.query(
    `SELECT COALESCE(
      ROUND(AVG(EXTRACT(EPOCH FROM (p.heure_fin - p.heure_appel)) / 60) FILTER (
        WHERE p.statut = 'termine' AND p.heure_appel IS NOT NULL AND p.heure_fin IS NOT NULL
      ), 0),
      15
    ) as duree_moyenne
     FROM patients p
     JOIN medecins m ON p.medecin_id = m.id
     WHERE m.cabinet_code = $1
     AND DATE(p.heure_arrivee) = CURRENT_DATE`,
    [cabinetCode]
  );
  return parseInt(result.rows[0].duree_moyenne, 10);
};

const getDailyBilan = async (cabinetCode) => {
  const result = await pool.query(
    `SELECT
      COUNT(*) as total_patients,
      COUNT(*) FILTER (WHERE p.statut = 'termine') as termines,
      COUNT(*) FILTER (WHERE p.statut = 'annule') as annules,
      COUNT(*) FILTER (WHERE p.motif = 'premier_contact') as premier_contact,
      COUNT(*) FILTER (WHERE p.motif = 'controle') as controle,
      ROUND(
        AVG(EXTRACT(EPOCH FROM (p.heure_fin - p.heure_appel)) / 60)
        FILTER (WHERE p.statut = 'termine' AND p.heure_appel IS NOT NULL AND p.heure_fin IS NOT NULL)
      , 1) as duree_moyenne_minutes
     FROM patients p
     JOIN medecins m ON p.medecin_id = m.id
     WHERE m.cabinet_code = $1
     AND DATE(p.heure_arrivee) = CURRENT_DATE`,
    [cabinetCode]
  );
  return result.rows[0];
};

module.exports = {
  findByCodeToday,
  createPatient,
  getPatientsForToday,
  getHistoryForToday,
  getPatientInConsultation,
  getNextWaitingPatient,
  updatePatientStatus,
  findPatientForVerification,
  countWaitingBefore,
  getStatsForToday,
  getAverageConsultationDuration,
  getDailyBilan,
  deleteOldPatients,
};

async function deleteOldPatients() {
  const result = await pool.query(
    `DELETE FROM patients WHERE DATE(heure_arrivee) < CURRENT_DATE - INTERVAL '1 day'`
  );
  return result.rowCount;
}

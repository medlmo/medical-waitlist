const { pool } = require('../db');

const findByEmail = async (email) => {
  const result = await pool.query('SELECT * FROM medecins WHERE email = $1', [email]);
  return result.rows[0] || null;
};

const findById = async (id) => {
  const result = await pool.query(
    'SELECT id, email, nom, prenom, nom_cabinet, cabinet_code, role, created_at FROM medecins WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
};

const findByCabinetCode = async (cabinet_code) => {
  const result = await pool.query(
    'SELECT id, nom, prenom, nom_cabinet, cabinet_code FROM medecins WHERE cabinet_code = $1 LIMIT 1',
    [cabinet_code]
  );
  return result.rows[0] || null;
};

const cabinetCodeExists = async (code) => {
  const result = await pool.query('SELECT id FROM medecins WHERE cabinet_code = $1', [code]);
  return result.rows.length > 0;
};

const createMedecin = async ({ email, password_hash, nom, prenom, nom_cabinet, cabinet_code, role }) => {
  const result = await pool.query(
    `INSERT INTO medecins (email, password_hash, nom, prenom, nom_cabinet, cabinet_code, role)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, email, nom, prenom, nom_cabinet, cabinet_code, role, created_at`,
    [email, password_hash, nom, prenom, nom_cabinet, cabinet_code, role || 'assistante']
  );
  return result.rows[0];
};

const getAllMedecins = async () => {
  const result = await pool.query(
    `SELECT m.id, m.email, m.nom, m.prenom, m.nom_cabinet, m.cabinet_code, m.role, m.created_at,
            COUNT(p.id) FILTER (WHERE p.statut = 'en_attente') AS en_attente,
            COUNT(p.id) FILTER (WHERE p.statut = 'en_consultation') AS en_consultation,
            COUNT(p.id) FILTER (WHERE DATE(p.heure_arrivee) = CURRENT_DATE) AS patients_today
     FROM medecins m
     LEFT JOIN patients p ON p.medecin_id IN (
       SELECT id FROM medecins WHERE cabinet_code = m.cabinet_code
     )
     GROUP BY m.id
     ORDER BY m.cabinet_code, m.role, m.created_at DESC`
  );
  return result.rows;
};

const getCabinets = async () => {
  const result = await pool.query(
    `SELECT DISTINCT cabinet_code, nom_cabinet
     FROM medecins
     WHERE role = 'medecin'
     ORDER BY nom_cabinet`
  );
  return result.rows;
};

const deleteMedecin = async (id) => {
  const medecin = await findById(id);
  if (!medecin) return null;
  await pool.query('DELETE FROM patients WHERE medecin_id = $1', [id]);
  const result = await pool.query(
    'DELETE FROM medecins WHERE id = $1 RETURNING id, email, nom, prenom',
    [id]
  );
  return result.rows[0] || null;
};

const updatePassword = async (id, password_hash) => {
  const result = await pool.query(
    'UPDATE medecins SET password_hash = $1 WHERE id = $2 RETURNING id, email',
    [password_hash, id]
  );
  return result.rows[0] || null;
};

const updateMedecin = async (id, { nom, prenom, email, nom_cabinet }) => {
  const result = await pool.query(
    `UPDATE medecins SET
       nom = COALESCE($1, nom),
       prenom = COALESCE($2, prenom),
       email = COALESCE($3, email),
       nom_cabinet = COALESCE($4, nom_cabinet)
     WHERE id = $5
     RETURNING id, email, nom, prenom, nom_cabinet, cabinet_code, role, created_at`,
    [nom || null, prenom || null, email ? email.toLowerCase() : null, nom_cabinet || null, id]
  );
  return result.rows[0] || null;
};

module.exports = {
  findByEmail, findById, findByCabinetCode, cabinetCodeExists,
  createMedecin, getAllMedecins, getCabinets, deleteMedecin, updatePassword, updateMedecin,
};

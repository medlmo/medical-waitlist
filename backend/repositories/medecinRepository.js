const { pool } = require('../db');

const findByEmail = async (email) => {
  const result = await pool.query('SELECT * FROM medecins WHERE email = $1', [email]);
  return result.rows[0] || null;
};

const findById = async (id) => {
  const result = await pool.query(
    'SELECT id, email, nom, prenom, nom_cabinet, cabinet_code, created_at FROM medecins WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
};

const findByCabinetCode = async (cabinet_code) => {
  const result = await pool.query(
    'SELECT id, nom, prenom, nom_cabinet, cabinet_code FROM medecins WHERE cabinet_code = $1',
    [cabinet_code]
  );
  return result.rows[0] || null;
};

const cabinetCodeExists = async (code) => {
  const result = await pool.query('SELECT id FROM medecins WHERE cabinet_code = $1', [code]);
  return result.rows.length > 0;
};

const createMedecin = async ({ email, password_hash, nom, prenom, nom_cabinet, cabinet_code }) => {
  const result = await pool.query(
    `INSERT INTO medecins (email, password_hash, nom, prenom, nom_cabinet, cabinet_code)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, email, nom, prenom, nom_cabinet, cabinet_code, created_at`,
    [email, password_hash, nom, prenom, nom_cabinet, cabinet_code]
  );
  return result.rows[0];
};

module.exports = { findByEmail, findById, findByCabinetCode, cabinetCodeExists, createMedecin };

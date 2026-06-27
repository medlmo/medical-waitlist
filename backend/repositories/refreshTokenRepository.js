const crypto = require('crypto');
const { pool } = require('../db');

const hash = (token) => crypto.createHash('sha256').update(token).digest('hex');

const create = async (medecinId, token, expiresAt) => {
  await pool.query(
    'INSERT INTO refresh_tokens (token_hash, medecin_id, expires_at) VALUES ($1, $2, $3)',
    [hash(token), medecinId, expiresAt]
  );
};

const findByToken = async (token) => {
  const { rows } = await pool.query(
    `SELECT * FROM refresh_tokens
     WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > NOW()`,
    [hash(token)]
  );
  return rows[0] || null;
};

const revokeByToken = async (token) => {
  await pool.query(
    'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1',
    [hash(token)]
  );
};

const revokeAllForMedecin = async (medecinId) => {
  await pool.query(
    'UPDATE refresh_tokens SET revoked_at = NOW() WHERE medecin_id = $1 AND revoked_at IS NULL',
    [medecinId]
  );
};

const cleanupExpired = async () => {
  const { rowCount } = await pool.query(
    `DELETE FROM refresh_tokens
     WHERE expires_at < NOW() OR revoked_at IS NOT NULL`
  );
  return rowCount;
};

module.exports = { create, findByToken, revokeByToken, revokeAllForMedecin, cleanupExpired };

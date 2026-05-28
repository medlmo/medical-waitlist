const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const PREFIX = 'enc:';

const getKey = () => {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64 || !/^[0-9a-f]+$/i.test(hex)) {
    throw new Error('ENCRYPTION_KEY absent ou invalide');
  }
  return Buffer.from(hex, 'hex');
};

const encrypt = (text) => {
  if (text === null || text === undefined) return text;
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(String(text), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return PREFIX + iv.toString('hex') + ':' + authTag.toString('hex') + ':' + ciphertext.toString('hex');
};

const decrypt = (stored) => {
  if (stored === null || stored === undefined) return stored;
  const s = String(stored);
  if (!s.startsWith(PREFIX)) return s;
  const parts = s.slice(PREFIX.length).split(':');
  if (parts.length !== 3) return s;
  const [ivHex, tagHex, ctHex] = parts;
  const key = getKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  try {
    const plain = Buffer.concat([decipher.update(Buffer.from(ctHex, 'hex')), decipher.final()]);
    return plain.toString('utf8');
  } catch {
    throw new Error('Déchiffrement échoué — clé invalide ou données corrompues');
  }
};

const encryptPatientFields = (fields) => ({
  ...fields,
  nom: encrypt(fields.nom),
  prenom: encrypt(fields.prenom),
  telephone: encrypt(fields.telephone),
});

const decryptPatientRow = (row) => {
  if (!row) return row;
  return {
    ...row,
    nom: decrypt(row.nom),
    prenom: decrypt(row.prenom),
    telephone: decrypt(row.telephone),
  };
};

module.exports = { encrypt, decrypt, encryptPatientFields, decryptPatientRow };

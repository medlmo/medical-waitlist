const jwt = require('jsonwebtoken');
const medecinRepository = require('../repositories/medecinRepository');
const { asyncHandler } = require('../errors');

const JWT_SECRET = () => {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET non défini');
  return s;
};

const requireDoctor = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.doctor_token;
  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentification requise' });
  }
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET());
  } catch {
    return res.status(401).json({ success: false, error: 'Token invalide ou expiré' });
  }

  if (decoded.role !== 'medecin' && decoded.role !== 'assistante') {
    return res.status(401).json({ success: false, error: 'Token non autorisé pour cet accès' });
  }

  const medecin = await medecinRepository.findById(decoded.id);
  if (!medecin) {
    return res.status(401).json({ success: false, error: 'Compte introuvable ou supprimé' });
  }

  req.medecinId = medecin.id;
  req.medecinEmail = medecin.email;
  req.cabinetCode = medecin.cabinet_code;
  req.userRole = medecin.role;
  next();
});

module.exports = { requireDoctor };

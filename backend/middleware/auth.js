const jwt = require('jsonwebtoken');

const JWT_SECRET = () => process.env.JWT_SECRET || 'fallback-secret-change-me';

const requireDoctor = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authentification requise' });
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET());
    req.medecinId = decoded.id;
    req.medecinEmail = decoded.email;
    req.cabinetCode = decoded.cabinet_code;
    req.userRole = decoded.role;
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Token invalide ou expiré' });
  }
};

module.exports = { requireDoctor };

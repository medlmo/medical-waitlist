const jwt = require('jsonwebtoken');

const JWT_SECRET = () => {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET non défini');
  return s;
};

const requireAdmin = (req, res, next) => {
  const token = req.cookies?.admin_token;
  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentification admin requise' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET());
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Accès réservé à l\'administrateur' });
    }
    req.adminId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Token invalide ou expiré' });
  }
};

module.exports = { requireAdmin };

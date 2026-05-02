const crypto = require('crypto');

const getExpectedToken = () => {
  const pin = process.env.DOCTOR_PIN || '1234';
  return crypto.createHmac('sha256', pin).update('doctor-session').digest('hex');
};

const requireDoctor = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authentification requise' });
  }
  const token = authHeader.slice(7);
  if (token !== getExpectedToken()) {
    return res.status(401).json({ success: false, error: 'Token invalide' });
  }
  next();
};

module.exports = { requireDoctor, getExpectedToken };

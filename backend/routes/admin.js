const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const medecinService = require('../services/medecinService');
const medecinRepository = require('../repositories/medecinRepository');
const { requireAdmin } = require('../middleware/adminAuth');
const { asyncHandler, AppError } = require('../errors');
const { validate, schemas } = require('../validation');
const { recordFailure, isLocked, getRemainingMinutes, resetAttempts } = require('../security/loginThrottle');
const audit = require('../security/auditLog');

const router = express.Router();
const ADMIN_LOCK_KEY = '__admin__';

const JWT_SECRET = () => {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET non défini');
  return s;
};

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const ip = req.ip;
    const { email, password } = validate(schemas.adminLogin, req.body);

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      throw new AppError('Compte administrateur non configuré', 500);
    }

    if (isLocked(ADMIN_LOCK_KEY)) {
      const minutes = getRemainingMinutes(ADMIN_LOCK_KEY);
      audit.log('ADMIN_LOGIN_BLOCKED', { ip, reason: 'compte verrouillé' });
      throw new AppError(`Compte admin verrouillé. Réessayez dans ${minutes} minute(s).`, 429);
    }

    const emailMatch = crypto.timingSafeEqual(
      Buffer.from(email.toLowerCase()),
      Buffer.from(adminEmail.toLowerCase())
    );
    const passwordMatch = crypto.timingSafeEqual(
      Buffer.from(password),
      Buffer.from(adminPassword)
    );

    if (!emailMatch || !passwordMatch) {
      recordFailure(ADMIN_LOCK_KEY);
      audit.log('ADMIN_LOGIN_FAILED', { ip, email: email.toLowerCase() });
      throw new AppError('Identifiants administrateur incorrects', 401);
    }

    resetAttempts(ADMIN_LOCK_KEY);
    audit.log('ADMIN_LOGIN_SUCCESS', { ip, email: adminEmail });

    const token = jwt.sign({ id: 'admin', role: 'admin', email: adminEmail }, JWT_SECRET(), { expiresIn: '8h' });
    res.json({ success: true, token, admin: { email: adminEmail } });
  })
);

router.get(
  '/medecins',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const medecins = await medecinRepository.getAllMedecins();
    res.json({ success: true, medecins });
  })
);

router.get(
  '/cabinets',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const cabinets = await medecinRepository.getCabinets();
    res.json({ success: true, cabinets });
  })
);

router.post(
  '/medecins',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { medecin } = await medecinService.register(req.body);
    audit.log('ADMIN_ACCOUNT_CREATED', { createdEmail: medecin.email, role: medecin.role });
    res.status(201).json({ success: true, medecin });
  })
);

router.delete(
  '/medecins/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const deleted = await medecinRepository.deleteMedecin(req.params.id);
    if (!deleted) throw new AppError('Compte non trouvé', 404);
    audit.log('ADMIN_ACCOUNT_DELETED', { deletedId: req.params.id });
    res.json({ success: true, deleted });
  })
);

router.patch(
  '/medecins/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const fields = validate(schemas.updateMedecin, req.body);
    if (fields.email) {
      const existing = await medecinRepository.findByEmail(fields.email.toLowerCase());
      if (existing && existing.id !== parseInt(req.params.id)) throw new AppError('Cet email est déjà utilisé', 409);
    }
    const updated = await medecinRepository.updateMedecin(req.params.id, fields);
    if (!updated) throw new AppError('Compte non trouvé', 404);
    audit.log('ADMIN_ACCOUNT_UPDATED', { updatedId: req.params.id, fields: Object.keys(fields) });
    res.json({ success: true, medecin: updated });
  })
);

router.patch(
  '/medecins/:id/password',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { password } = validate(schemas.resetPassword, req.body);
    const hash = await bcrypt.hash(password, 12);
    const updated = await medecinRepository.updatePassword(req.params.id, hash);
    if (!updated) throw new AppError('Compte non trouvé', 404);
    audit.log('ADMIN_PASSWORD_RESET', { targetId: req.params.id });
    res.json({ success: true, updated });
  })
);

module.exports = router;

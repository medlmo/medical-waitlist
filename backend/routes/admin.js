const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const medecinService = require('../services/medecinService');
const medecinRepository = require('../repositories/medecinRepository');
const { requireAdmin } = require('../middleware/adminAuth');
const { asyncHandler, AppError } = require('../errors');
const { validate, schemas } = require('../validation');

const router = express.Router();
const JWT_SECRET = () => process.env.JWT_SECRET || 'fallback-secret-change-me';

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = validate(schemas.adminLogin, req.body);

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      throw new AppError('Compte administrateur non configuré', 500);
    }

    if (email.toLowerCase() !== adminEmail.toLowerCase() || password !== adminPassword) {
      throw new AppError('Identifiants administrateur incorrects', 401);
    }

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
    res.status(201).json({ success: true, medecin });
  })
);

router.delete(
  '/medecins/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const deleted = await medecinRepository.deleteMedecin(req.params.id);
    if (!deleted) throw new AppError('Compte non trouvé', 404);
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
    res.json({ success: true, updated });
  })
);

module.exports = router;

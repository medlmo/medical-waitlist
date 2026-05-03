const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const medecinService = require('../services/medecinService');
const medecinRepository = require('../repositories/medecinRepository');
const { requireAdmin } = require('../middleware/adminAuth');
const { asyncHandler, AppError } = require('../errors');

const router = express.Router();
const JWT_SECRET = () => process.env.JWT_SECRET || 'fallback-secret-change-me';

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) throw new AppError('Email et mot de passe requis', 400);

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
  '/medecins/:id/password',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { password } = req.body;
    if (!password || password.length < 6) throw new AppError('Mot de passe trop court (6 caractères minimum)', 400);
    const hash = await bcrypt.hash(password, 12);
    const updated = await medecinRepository.updatePassword(req.params.id, hash);
    if (!updated) throw new AppError('Compte non trouvé', 404);
    res.json({ success: true, updated });
  })
);

module.exports = router;

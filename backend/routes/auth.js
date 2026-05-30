const express = require('express');
const medecinService = require('../services/medecinService');
const { asyncHandler } = require('../errors');
const { requireDoctor } = require('../middleware/auth');

const router = express.Router();

const DOCTOR_COOKIE = 'doctor_token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { medecin, token } = await medecinService.login(req.body, req.ip);
    res.cookie(DOCTOR_COOKIE, token, COOKIE_OPTIONS);
    res.json({ success: true, medecin });
  })
);

router.post(
  '/logout',
  (req, res) => {
    res.clearCookie(DOCTOR_COOKIE, { path: '/' });
    res.json({ success: true });
  }
);

router.get(
  '/me',
  requireDoctor,
  asyncHandler(async (req, res) => {
    const medecin = await medecinService.getMe(req.medecinId);
    res.json({ success: true, medecin });
  })
);

module.exports = router;

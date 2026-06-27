const express = require('express');
const medecinService = require('../services/medecinService');
const { asyncHandler, AppError } = require('../errors');
const { requireDoctor } = require('../middleware/auth');

const router = express.Router();

const isProduction = process.env.NODE_ENV === 'production';

const ACCESS_COOKIE = 'doctor_token';
const REFRESH_COOKIE = 'doctor_refresh';

const ACCESS_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict',
  secure: isProduction,
  path: '/',
  maxAge: 15 * 60 * 1000,
};

const REFRESH_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict',
  secure: isProduction,
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { medecin, accessToken, refreshToken } = await medecinService.login(req.body, req.ip);
    res.cookie(ACCESS_COOKIE, accessToken, ACCESS_OPTIONS);
    res.cookie(REFRESH_COOKIE, refreshToken, REFRESH_OPTIONS);
    res.json({ success: true, medecin });
  })
);

router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const raw = req.cookies?.[REFRESH_COOKIE];
    const { accessToken } = await medecinService.refreshAccessToken(raw);
    res.cookie(ACCESS_COOKIE, accessToken, ACCESS_OPTIONS);
    res.json({ success: true });
  })
);

router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const raw = req.cookies?.[REFRESH_COOKIE];
    const medecinId = req.cookies?.[ACCESS_COOKIE]
      ? (() => { try { const jwt = require('jsonwebtoken'); return jwt.decode(req.cookies[ACCESS_COOKIE])?.id; } catch { return null; } })()
      : null;
    await medecinService.logout(raw, medecinId);
    res.clearCookie(ACCESS_COOKIE, { path: '/' });
    res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
    res.json({ success: true });
  })
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

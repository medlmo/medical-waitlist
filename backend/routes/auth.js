const express = require('express');
const medecinService = require('../services/medecinService');
const { asyncHandler } = require('../errors');
const { requireDoctor } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { email, password, nom, prenom, nom_cabinet } = req.body;
    const { medecin, token } = await medecinService.register({ email, password, nom, prenom, nom_cabinet });
    res.status(201).json({ success: true, medecin, token });
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const { medecin, token } = await medecinService.login({ email, password });
    res.json({ success: true, medecin, token });
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

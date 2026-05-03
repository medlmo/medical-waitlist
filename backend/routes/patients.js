const express = require('express');
const service = require('../services/patientService');
const { asyncHandler, AppError } = require('../errors');
const { requireDoctor } = require('../middleware/auth');

const router = express.Router();

const requireAssistante = (req, res, next) => {
  if (req.userRole !== 'assistante') {
    return res.status(403).json({ success: false, error: 'Action réservée à l\'assistante' });
  }
  next();
};

router.get(
  '/dashboard',
  requireDoctor,
  asyncHandler(async (req, res) => {
    const data = await service.getDashboard(req.cabinetCode);
    res.json({ success: true, ...data });
  })
);

router.post(
  '/patients',
  requireDoctor,
  requireAssistante,
  asyncHandler(async (req, res) => {
    const patient = await service.addPatient(req.body, req.medecinId, req.cabinetCode);
    res.json({ success: true, patient });
  })
);

router.post(
  '/patients/appeler-suivant',
  requireDoctor,
  requireAssistante,
  asyncHandler(async (req, res) => {
    const patient = await service.callNextPatient(req.cabinetCode);
    res.json({ success: true, patient });
  })
);

router.patch(
  '/patients/:id/statut',
  requireDoctor,
  requireAssistante,
  asyncHandler(async (req, res) => {
    const patient = await service.updateStatus(req.params.id, req.body.statut, req.cabinetCode);
    res.json({ success: true, patient });
  })
);

router.post(
  '/patients/verifier',
  asyncHandler(async (req, res) => {
    const data = await service.verifyPatient(req.body);
    res.json({ success: true, ...data });
  })
);

router.get(
  '/bilan',
  requireDoctor,
  asyncHandler(async (req, res) => {
    const bilan = await service.getDailyBilan(req.cabinetCode);
    res.json({ success: true, bilan });
  })
);

module.exports = router;

const express = require('express');
const service = require('../services/patientService');
const { asyncHandler } = require('../errors');
const { requireDoctor } = require('../middleware/auth');

const router = express.Router();

router.get(
  '/dashboard',
  requireDoctor,
  asyncHandler(async (req, res) => {
    const data = await service.getDashboard();
    res.json({ success: true, ...data });
  })
);

router.post(
  '/patients',
  requireDoctor,
  asyncHandler(async (req, res) => {
    const patient = await service.addPatient(req.body);
    res.json({ success: true, patient });
  })
);

router.post(
  '/patients/appeler-suivant',
  requireDoctor,
  asyncHandler(async (req, res) => {
    const patient = await service.callNextPatient();
    res.json({ success: true, patient });
  })
);

router.patch(
  '/patients/:id/statut',
  requireDoctor,
  asyncHandler(async (req, res) => {
    const patient = await service.updateStatus(req.params.id, req.body.statut);
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
    const bilan = await service.getDailyBilan();
    res.json({ success: true, bilan });
  })
);

module.exports = router;

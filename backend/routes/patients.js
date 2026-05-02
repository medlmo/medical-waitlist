const express = require('express');
const service = require('../services/patientService');
const { asyncHandler } = require('../errors');

const router = express.Router();

router.post(
  '/patients',
  asyncHandler(async (req, res) => {
    const patient = await service.addPatient(req.body);
    res.json({ success: true, patient });
  })
);

router.get(
  '/patients',
  asyncHandler(async (req, res) => {
    const data = await service.getDashboardData();
    res.json({ success: true, ...data });
  })
);

router.post(
  '/patients/appeler-suivant',
  asyncHandler(async (req, res) => {
    const patient = await service.callNextPatient();
    res.json({ success: true, patient });
  })
);

router.patch(
  '/patients/:id/statut',
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
  '/stats',
  asyncHandler(async (req, res) => {
    const stats = await service.getStats();
    res.json({ success: true, stats });
  })
);

router.get(
  '/bilan',
  asyncHandler(async (req, res) => {
    const bilan = await service.getDailyBilan();
    res.json({ success: true, bilan });
  })
);

module.exports = router;

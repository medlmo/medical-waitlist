const express = require('express');
const { getExpectedToken } = require('../middleware/auth');
const { AppError } = require('../errors');
const { asyncHandler } = require('../errors');

const router = express.Router();

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { pin } = req.body;
    const expectedPin = process.env.DOCTOR_PIN || '1234';

    if (!pin) {
      throw new AppError('PIN requis', 400);
    }

    if (pin !== expectedPin) {
      throw new AppError('PIN incorrect', 401);
    }

    const token = getExpectedToken();
    res.json({ success: true, token });
  })
);

module.exports = router;

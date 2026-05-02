const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const express = require('express');

const patientRoutes = require('../routes/patients');
const patientService = require('../services/patientService');
const { errorMiddleware } = require('../errors');

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api', patientRoutes);
  app.use(errorMiddleware);
  return app;
};

test('POST /api/patients returns 400 for invalid payload', async () => {
  const app = buildApp();

  const response = await request(app).post('/api/patients').send({
    nom: 'Test',
    prenom: 'Patient',
    age: -5,
    telephone: '0600000000',
    motif: 'controle',
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
  assert.equal(response.body.error, 'Age invalide');
});

test('PATCH /api/patients/:id/statut validates status', async () => {
  const app = buildApp();

  const response = await request(app).patch('/api/patients/1/statut').send({
    statut: 'inconnu',
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
  assert.equal(response.body.error, 'Statut invalide');
});

test('GET /api/stats returns normalized payload', async () => {
  const originalGetStats = patientService.getStats;
  patientService.getStats = async () => ({
    en_attente: '2',
    en_consultation: '1',
    traites: '3',
  });

  const app = buildApp();
  const response = await request(app).get('/api/stats');

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, {
    success: true,
    stats: {
      en_attente: '2',
      en_consultation: '1',
      traites: '3',
    },
  });

  patientService.getStats = originalGetStats;
});

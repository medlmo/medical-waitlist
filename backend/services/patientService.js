const repository = require('../repositories/patientRepository');
const { AppError } = require('../errors');

const ALLOWED_STATUSES = ['en_attente', 'en_consultation', 'termine', 'annule'];

const generateUniqueCode = async () => {
  let code;
  let exists = true;

  while (exists) {
    code = Math.floor(1000 + Math.random() * 9000).toString();
    const existingPatient = await repository.findByCode(code);
    exists = Boolean(existingPatient);
  }

  return code;
};

const validatePatientPayload = ({ nom, prenom, age, telephone, motif }) => {
  if (!nom || !prenom || !telephone || !motif) {
    throw new AppError('Champs requis manquants', 400);
  }

  const parsedAge = Number(age);
  if (!Number.isInteger(parsedAge) || parsedAge < 0 || parsedAge > 120) {
    throw new AppError('Age invalide', 400);
  }

  return {
    nom: nom.trim(),
    prenom: prenom.trim(),
    age: parsedAge,
    telephone: telephone.trim(),
    motif: motif.trim(),
  };
};

const addPatient = async (payload) => {
  const safePayload = validatePatientPayload(payload);
  const code = await generateUniqueCode();
  return repository.createPatient({ ...safePayload, code });
};

const getDashboardData = async () => {
  const [patients, historique] = await Promise.all([
    repository.getPatientsForToday(),
    repository.getHistoryForToday(),
  ]);

  return {
    enAttente: patients.filter((patient) => patient.statut === 'en_attente'),
    enConsultation: patients.filter((patient) => patient.statut === 'en_consultation'),
    historique,
  };
};

const callNextPatient = async () => {
  const patientInConsultation = await repository.getPatientInConsultation();
  if (patientInConsultation) {
    throw new AppError('Un patient est deja en consultation', 400);
  }

  const nextPatient = await repository.getNextWaitingPatient();
  if (!nextPatient) {
    throw new AppError('Aucun patient en attente', 404);
  }

  await repository.updatePatientStatus(nextPatient.id, 'en_consultation');
  return nextPatient;
};

const updateStatus = async (id, statut) => {
  if (!ALLOWED_STATUSES.includes(statut)) {
    throw new AppError('Statut invalide', 400);
  }

  const patient = await repository.updatePatientStatus(id, statut);
  if (!patient) {
    throw new AppError('Patient non trouve', 404);
  }

  return patient;
};

const verifyPatient = async ({ code, telephone }) => {
  if (!code || !telephone) {
    throw new AppError('Code et telephone requis', 400);
  }

  const phoneDigits = telephone.replace(/\D/g, '');
  const phoneSuffix = phoneDigits.slice(-8);
  const patient = await repository.findPatientForVerification({ code, phoneDigits, phoneSuffix });

  if (!patient) {
    throw new AppError('Patient non trouve', 404);
  }

  const [position, dureeMoyenne] = await Promise.all([
    repository.countWaitingBefore(patient.heure_arrivee),
    repository.getAverageConsultationDuration(),
  ]);

  return {
    patient,
    position,
    patientsDevant: position,
    tempsAttente: position * dureeMoyenne,
    dureeMoyenne,
  };
};

const getStats = async () => repository.getStatsForToday();

const getDailyBilan = async () => repository.getDailyBilan();

module.exports = {
  addPatient,
  getDashboardData,
  callNextPatient,
  updateStatus,
  verifyPatient,
  getStats,
  getDailyBilan,
};

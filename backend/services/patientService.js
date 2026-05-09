const repository = require('../repositories/patientRepository');
const medecinRepository = require('../repositories/medecinRepository');
const { AppError } = require('../errors');

const ALLOWED_STATUSES = ['en_attente', 'en_consultation', 'termine', 'annule'];
const ALLOWED_MOTIFS = ['premier_contact', 'controle'];

const generateUniqueCode = async (cabinetCode) => {
  let code;
  let exists = true;
  while (exists) {
    code = Math.floor(1000 + Math.random() * 9000).toString();
    const existingPatient = await repository.findByCodeToday(code, cabinetCode);
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
  const motifNormalized = motif.trim().toLowerCase();
  if (!ALLOWED_MOTIFS.includes(motifNormalized)) {
    throw new AppError(`Motif invalide. Valeurs acceptées : ${ALLOWED_MOTIFS.join(', ')}`, 400);
  }
  return {
    nom: nom.trim(),
    prenom: prenom.trim(),
    age: parsedAge,
    telephone: telephone.trim(),
    motif: motifNormalized,
  };
};

const addPatient = async (payload, medecinId, cabinetCode) => {
  const safePayload = validatePatientPayload(payload);
  const code = await generateUniqueCode(cabinetCode);
  return repository.createPatient({ ...safePayload, code, medecinId });
};

const getDashboard = async (cabinetCode) => {
  const [patients, historique, stats] = await Promise.all([
    repository.getPatientsForToday(cabinetCode),
    repository.getHistoryForToday(cabinetCode),
    repository.getStatsForToday(cabinetCode),
  ]);
  return {
    enAttente: patients.filter((p) => p.statut === 'en_attente'),
    enConsultation: patients.filter((p) => p.statut === 'en_consultation'),
    historique,
    stats,
  };
};

const callNextPatient = async (cabinetCode) => {
  const patientInConsultation = await repository.getPatientInConsultation(cabinetCode);
  if (patientInConsultation) {
    throw new AppError('Un patient est déjà en consultation', 400);
  }
  const nextPatient = await repository.getNextWaitingPatient(cabinetCode);
  if (!nextPatient) {
    throw new AppError('Aucun patient en attente', 404);
  }
  await repository.updatePatientStatus(nextPatient.id, 'en_consultation', cabinetCode);
  return nextPatient;
};

const updateStatus = async (id, statut, cabinetCode) => {
  if (!ALLOWED_STATUSES.includes(statut)) {
    throw new AppError('Statut invalide', 400);
  }
  const patient = await repository.updatePatientStatus(id, statut, cabinetCode);
  if (!patient) {
    throw new AppError('Patient non trouvé', 404);
  }
  return patient;
};

const verifyPatient = async ({ code, telephone, cabinet_code }) => {
  if (!code || !telephone || !cabinet_code) {
    throw new AppError('Code, téléphone et code cabinet requis', 400);
  }

  const cabinetCodeUpper = cabinet_code.toUpperCase();
  const medecin = await medecinRepository.findByCabinetCode(cabinetCodeUpper);
  if (!medecin) {
    throw new AppError('Cabinet introuvable', 404);
  }

  const phoneDigits = telephone.replace(/\D/g, '');
  const phoneSuffix = phoneDigits.slice(-8);
  const patient = await repository.findPatientForVerification({
    code,
    phoneDigits,
    phoneSuffix,
    cabinetCode: cabinetCodeUpper,
  });

  if (!patient) {
    throw new AppError('Patient non trouvé', 404);
  }

  const [position, dureeMoyenne] = await Promise.all([
    repository.countWaitingBefore(patient.heure_arrivee, cabinet_code.toUpperCase()),
    repository.getAverageConsultationDuration(cabinet_code.toUpperCase()),
  ]);

  return {
    patient,
    cabinet: { nom_cabinet: medecin.nom_cabinet },
    position,
    patientsDevant: position,
    tempsAttente: position * dureeMoyenne,
    dureeMoyenne,
  };
};

const getDailyBilan = async (cabinetCode) => repository.getDailyBilan(cabinetCode);

module.exports = { addPatient, getDashboard, callNextPatient, updateStatus, verifyPatient, getDailyBilan };

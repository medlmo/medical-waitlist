const repository = require('../repositories/patientRepository');
const medecinRepository = require('../repositories/medecinRepository');
const { AppError } = require('../errors');
const { validate, schemas } = require('../validation');

const addPatient = async (payload, medecinId, cabinetCode) => {
  const safePayload = validate(schemas.patient, payload);
  return repository.createPatient({ ...safePayload, medecinId, cabinetCode });
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
  const result = await repository.callNextPatientAtomic(cabinetCode);
  if (result.error === 'consultation_active') {
    throw new AppError('Un patient est déjà en consultation', 400);
  }
  if (result.error === 'no_waiting') {
    throw new AppError('Aucun patient en attente', 404);
  }
  return result.patient;
};

const updateStatus = async (id, rawStatut, cabinetCode) => {
  const { statut } = validate(schemas.updateStatut, { statut: rawStatut });
  const patient = await repository.updatePatientStatus(id, statut, cabinetCode);
  if (!patient) {
    throw new AppError('Patient non trouvé', 404);
  }
  return patient;
};

const verifyPatient = async (rawPayload) => {
  const { code, telephone, cabinet_code } = validate(schemas.verifyPatient, rawPayload);
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

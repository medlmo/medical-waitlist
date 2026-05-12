const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const repository = require('../repositories/medecinRepository');
const { AppError } = require('../errors');
const { validate, schemas } = require('../validation');

const JWT_SECRET = () => process.env.JWT_SECRET || 'fallback-secret-change-me';
const JWT_EXPIRES = '7d';
const ALLOWED_ROLES = ['medecin', 'assistante'];

const generateCabinetCode = async () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  let exists = true;
  while (exists) {
    code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    exists = await repository.cabinetCodeExists(code);
  }
  return code;
};

const register = async (rawPayload) => {
  const { email, password, nom, prenom, nom_cabinet, role, cabinet_code } = validate(schemas.register, rawPayload);
  const userRole = role ?? 'assistante';

  if (userRole === 'medecin' && !nom_cabinet) {
    throw new AppError('Le nom du cabinet est requis pour un médecin', 400);
  }
  if (userRole === 'assistante' && !cabinet_code) {
    throw new AppError('Le code cabinet est requis pour une assistante', 400);
  }

  const existing = await repository.findByEmail(email.toLowerCase());
  if (existing) {
    throw new AppError('Un compte avec cet email existe déjà', 409);
  }

  const password_hash = await bcrypt.hash(password, 12);

  let resolvedCabinetCode;
  let resolvedNomCabinet;

  if (userRole === 'medecin') {
    resolvedCabinetCode = await generateCabinetCode();
    resolvedNomCabinet = nom_cabinet.trim();
  } else {
    const cabinet = await repository.findByCabinetCode(cabinet_code.toUpperCase());
    if (!cabinet) throw new AppError('Code cabinet introuvable', 404);
    resolvedCabinetCode = cabinet.cabinet_code;
    resolvedNomCabinet = cabinet.nom_cabinet;
  }

  const medecin = await repository.createMedecin({
    email: email.toLowerCase(),
    password_hash,
    nom: nom.trim(),
    prenom: prenom.trim(),
    nom_cabinet: resolvedNomCabinet,
    cabinet_code: resolvedCabinetCode,
    role: userRole,
  });

  const token = jwt.sign(
    { id: medecin.id, email: medecin.email, cabinet_code: medecin.cabinet_code, role: medecin.role },
    JWT_SECRET(),
    { expiresIn: JWT_EXPIRES }
  );
  return { medecin, token };
};

const login = async (rawPayload) => {
  const { email, password } = validate(schemas.login, rawPayload);
  const medecin = await repository.findByEmail(email.toLowerCase());
  if (!medecin) {
    throw new AppError('Email ou mot de passe incorrect', 401);
  }

  const valid = await bcrypt.compare(password, medecin.password_hash);
  if (!valid) {
    throw new AppError('Email ou mot de passe incorrect', 401);
  }

  const { password_hash, ...medecinSafe } = medecin;
  const token = jwt.sign(
    { id: medecinSafe.id, email: medecinSafe.email, cabinet_code: medecinSafe.cabinet_code, role: medecinSafe.role },
    JWT_SECRET(),
    { expiresIn: JWT_EXPIRES }
  );
  return { medecin: medecinSafe, token };
};

const getMe = async (id) => {
  const medecin = await repository.findById(id);
  if (!medecin) throw new AppError('Médecin non trouvé', 404);
  return medecin;
};

module.exports = { register, login, getMe };

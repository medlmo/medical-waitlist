const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const repository = require('../repositories/medecinRepository');
const { AppError } = require('../errors');

const JWT_SECRET = () => process.env.JWT_SECRET || 'fallback-secret-change-me';
const JWT_EXPIRES = '7d';

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

const register = async ({ email, password, nom, prenom, nom_cabinet }) => {
  if (!email || !password || !nom || !prenom || !nom_cabinet) {
    throw new AppError('Tous les champs sont requis', 400);
  }
  if (password.length < 6) {
    throw new AppError('Le mot de passe doit contenir au moins 6 caractères', 400);
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError('Email invalide', 400);
  }

  const existing = await repository.findByEmail(email.toLowerCase());
  if (existing) {
    throw new AppError('Un compte avec cet email existe déjà', 409);
  }

  const password_hash = await bcrypt.hash(password, 12);
  const cabinet_code = await generateCabinetCode();

  const medecin = await repository.createMedecin({
    email: email.toLowerCase(),
    password_hash,
    nom: nom.trim(),
    prenom: prenom.trim(),
    nom_cabinet: nom_cabinet.trim(),
    cabinet_code,
  });

  const token = jwt.sign({ id: medecin.id, email: medecin.email }, JWT_SECRET(), { expiresIn: JWT_EXPIRES });
  return { medecin, token };
};

const login = async ({ email, password }) => {
  if (!email || !password) {
    throw new AppError('Email et mot de passe requis', 400);
  }

  const medecin = await repository.findByEmail(email.toLowerCase());
  if (!medecin) {
    throw new AppError('Email ou mot de passe incorrect', 401);
  }

  const valid = await bcrypt.compare(password, medecin.password_hash);
  if (!valid) {
    throw new AppError('Email ou mot de passe incorrect', 401);
  }

  const { password_hash, ...medecinSafe } = medecin;
  const token = jwt.sign({ id: medecinSafe.id, email: medecinSafe.email }, JWT_SECRET(), { expiresIn: JWT_EXPIRES });
  return { medecin: medecinSafe, token };
};

const getMe = async (id) => {
  const medecin = await repository.findById(id);
  if (!medecin) throw new AppError('Médecin non trouvé', 404);
  return medecin;
};

module.exports = { register, login, getMe };

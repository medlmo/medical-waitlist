const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const repository = require('../repositories/medecinRepository');
const refreshRepo = require('../repositories/refreshTokenRepository');
const { AppError } = require('../errors');
const { validate, schemas } = require('../validation');
const { recordFailure, isLocked, getRemainingMinutes, resetAttempts } = require('../security/loginThrottle');
const audit = require('../security/auditLog');

const JWT_SECRET = () => {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET non défini');
  return s;
};
const ACCESS_EXPIRES = '15m';
const REFRESH_DAYS = 7;

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

  if (userRole === 'assistante') {
    const cabinet = await repository.findByCabinetCode(cabinet_code.toUpperCase());
    if (!cabinet) throw new AppError('Code cabinet introuvable', 404);
    resolvedCabinetCode = cabinet.cabinet_code;
    resolvedNomCabinet = cabinet.nom_cabinet;
  }

  let medecin;
  let attempts = 0;
  while (true) {
    if (attempts >= 10) throw new AppError('Impossible de générer un code cabinet unique', 500);

    if (userRole === 'medecin') {
      resolvedCabinetCode = await generateCabinetCode();
      resolvedNomCabinet = nom_cabinet.trim();
    }

    try {
      medecin = await repository.createMedecin({
        email: email.toLowerCase(),
        password_hash,
        nom: nom.trim(),
        prenom: prenom.trim(),
        nom_cabinet: resolvedNomCabinet,
        cabinet_code: resolvedCabinetCode,
        role: userRole,
      });
      break;
    } catch (err) {
      if (
        userRole === 'medecin' &&
        err.code === '23505' &&
        err.constraint === 'idx_medecins_cabinet_code_medecin'
      ) {
        attempts++;
        continue;
      }
      throw err;
    }
  }

  audit.log('ACCOUNT_CREATED', { email: medecin.email, role: userRole, cabinet_code: resolvedCabinetCode });

  const token = jwt.sign(
    { id: medecin.id, email: medecin.email, cabinet_code: medecin.cabinet_code, role: medecin.role },
    JWT_SECRET(),
    { expiresIn: JWT_EXPIRES }
  );
  return { medecin, token };
};

const login = async (rawPayload, ip) => {
  const { email, password } = validate(schemas.login, rawPayload);
  const emailLower = email.toLowerCase();

  if (isLocked(emailLower)) {
    const minutes = getRemainingMinutes(emailLower);
    audit.log('LOGIN_BLOCKED', { email: emailLower, ip, reason: 'compte verrouillé' });
    throw new AppError(`Compte temporairement verrouillé. Réessayez dans ${minutes} minute(s).`, 429);
  }

  const medecin = await repository.findByEmail(emailLower);
  if (!medecin) {
    recordFailure(emailLower);
    audit.log('LOGIN_FAILED', { email: emailLower, ip, reason: 'email inconnu' });
    throw new AppError('Email ou mot de passe incorrect', 401);
  }

  const valid = await bcrypt.compare(password, medecin.password_hash);
  if (!valid) {
    recordFailure(emailLower);
    audit.log('LOGIN_FAILED', { email: emailLower, ip, reason: 'mot de passe incorrect' });
    throw new AppError('Email ou mot de passe incorrect', 401);
  }

  resetAttempts(emailLower);
  audit.log('LOGIN_SUCCESS', { email: emailLower, ip, role: medecin.role });

  const { password_hash, ...medecinSafe } = medecin;
  const accessToken = jwt.sign(
    { id: medecinSafe.id, email: medecinSafe.email, cabinet_code: medecinSafe.cabinet_code, role: medecinSafe.role },
    JWT_SECRET(),
    { expiresIn: ACCESS_EXPIRES }
  );

  const refreshToken = crypto.randomBytes(48).toString('hex');
  const refreshExpiresAt = new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000);
  await refreshRepo.create(medecinSafe.id, refreshToken, refreshExpiresAt);

  return { medecin: medecinSafe, accessToken, refreshToken };
};

const getMe = async (id) => {
  const medecin = await repository.findById(id);
  if (!medecin) throw new AppError('Médecin non trouvé', 404);
  return medecin;
};

const refreshAccessToken = async (rawRefreshToken) => {
  if (!rawRefreshToken) throw new AppError('Refresh token manquant', 401);
  const stored = await refreshRepo.findByToken(rawRefreshToken);
  if (!stored) throw new AppError('Refresh token invalide ou expiré', 401);

  const medecin = await repository.findById(stored.medecin_id);
  if (!medecin) {
    await refreshRepo.revokeByToken(rawRefreshToken);
    throw new AppError('Compte introuvable', 401);
  }

  const accessToken = jwt.sign(
    { id: medecin.id, email: medecin.email, cabinet_code: medecin.cabinet_code, role: medecin.role },
    JWT_SECRET(),
    { expiresIn: ACCESS_EXPIRES }
  );
  return { accessToken };
};

const logout = async (rawRefreshToken, medecinId) => {
  if (rawRefreshToken) await refreshRepo.revokeByToken(rawRefreshToken);
  else if (medecinId) await refreshRepo.revokeAllForMedecin(medecinId);
};

module.exports = { register, login, getMe, refreshAccessToken, logout };

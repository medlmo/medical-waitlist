const { z } = require('zod');
const { AppError } = require('./errors');

function validate(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const message = result.error.errors.map((e) => e.message).join(', ');
    throw new AppError(message, 400);
  }
  return result.data;
}

const schemas = {
  login: z.object({
    email: z.string({ required_error: 'Email requis' }).email('Email invalide'),
    password: z.string({ required_error: 'Mot de passe requis' }).min(1, 'Mot de passe requis'),
  }),

  register: z.object({
    email: z.string({ required_error: 'Email requis' }).email('Email invalide'),
    password: z.string({ required_error: 'Mot de passe requis' }).min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
    nom: z.string({ required_error: 'Nom requis' }).min(1, 'Nom requis').trim(),
    prenom: z.string({ required_error: 'Prénom requis' }).min(1, 'Prénom requis').trim(),
    nom_cabinet: z.string().trim().optional(),
    role: z.enum(['medecin', 'assistante']).optional(),
    cabinet_code: z.string().optional(),
  }),

  patient: z.object({
    nom: z.string({ required_error: 'Nom requis' }).min(1, 'Nom requis').trim(),
    prenom: z.string({ required_error: 'Prénom requis' }).min(1, 'Prénom requis').trim(),
    age: z.preprocess(
      (v) => Number(v),
      z.number({ invalid_type_error: 'Age invalide' }).int('Age invalide').min(0, 'Age invalide').max(120, 'Age invalide')
    ),
    telephone: z.string({ required_error: 'Téléphone requis' }).min(1, 'Téléphone requis').trim(),
    motif: z.preprocess(
      (v) => (typeof v === 'string' ? v.trim().toLowerCase() : v),
      z.enum(['premier_contact', 'controle'], { errorMap: () => ({ message: "Motif invalide. Valeurs acceptées : premier_contact, controle" }) })
    ),
  }),

  verifyPatient: z.object({
    code: z.string({ required_error: 'Code requis' }).length(4, 'Code à 4 chiffres requis'),
    telephone: z.string({ required_error: 'Téléphone requis' }).min(1, 'Téléphone requis'),
    cabinet_code: z.string({ required_error: 'Code cabinet requis' }).min(1, 'Code cabinet requis'),
  }),

  updateStatut: z.object({
    statut: z.enum(['en_attente', 'en_consultation', 'termine', 'annule'], {
      errorMap: () => ({ message: 'Statut invalide' }),
    }),
  }),

  updateMedecin: z.object({
    nom: z.string().trim().min(1, 'Nom invalide').optional(),
    prenom: z.string().trim().min(1, 'Prénom invalide').optional(),
    email: z.string().email('Email invalide').optional(),
    nom_cabinet: z.string().trim().min(1, 'Nom du cabinet invalide').optional(),
  }).refine((data) => Object.keys(data).length > 0, { message: 'Au moins un champ à modifier est requis' }),

  resetPassword: z.object({
    password: z.string({ required_error: 'Mot de passe requis' }).min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  }),

  adminLogin: z.object({
    email: z.string({ required_error: 'Email requis' }).email('Email invalide'),
    password: z.string({ required_error: 'Mot de passe requis' }).min(1, 'Mot de passe requis'),
  }),
};

module.exports = { validate, schemas };

const { deleteOldPatients } = require('./repositories/patientRepository');
const { cleanupExpired: cleanupRefreshTokens } = require('./repositories/refreshTokenRepository');

function msUntilNextRun(hour = 2, minute = 0) {
  const now = new Date();
  const next = new Date();
  next.setHours(hour, minute, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next - now;
}

async function runCleanup() {
  try {
    const deleted = await deleteOldPatients();
    console.log(`[Cleanup] ${new Date().toISOString()} — ${deleted} patient(s) supprimé(s) (données J-2 et plus)`);
  } catch (err) {
    console.error('[Cleanup] Erreur lors de la suppression des anciennes données:', err.message);
  }
  try {
    const revoked = await cleanupRefreshTokens();
    if (revoked > 0) console.log(`[Cleanup] ${revoked} refresh token(s) expirés supprimés`);
  } catch (err) {
    console.error('[Cleanup] Erreur nettoyage refresh tokens:', err.message);
  }
}

function scheduleCleanup() {
  const delay = msUntilNextRun(2, 0);
  const nextRun = new Date(Date.now() + delay);
  console.log(`[Cleanup] Prochain nettoyage planifié à ${nextRun.toLocaleString('fr-FR')}`);

  setTimeout(async () => {
    await runCleanup();
    setInterval(runCleanup, 24 * 60 * 60 * 1000);
  }, delay);
}

module.exports = { scheduleCleanup, runCleanup };

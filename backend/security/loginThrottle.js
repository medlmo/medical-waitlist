const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

const attempts = new Map();

function recordFailure(email) {
  const key = email.toLowerCase();
  const now = Date.now();
  const entry = attempts.get(key) || { count: 0, lockedUntil: null };

  if (entry.lockedUntil && now > entry.lockedUntil) {
    entry.count = 0;
    entry.lockedUntil = null;
  }

  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_MS;
  }
  attempts.set(key, entry);
}

function isLocked(email) {
  const key = email.toLowerCase();
  const entry = attempts.get(key);
  if (!entry || !entry.lockedUntil) return false;
  if (Date.now() > entry.lockedUntil) {
    attempts.delete(key);
    return false;
  }
  return true;
}

function getRemainingMinutes(email) {
  const entry = attempts.get(email.toLowerCase());
  if (!entry || !entry.lockedUntil) return 0;
  return Math.ceil((entry.lockedUntil - Date.now()) / 60000);
}

function resetAttempts(email) {
  attempts.delete(email.toLowerCase());
}

module.exports = { recordFailure, isLocked, getRemainingMinutes, resetAttempts };

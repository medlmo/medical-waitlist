const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '../../logs/security.log');

function ensureLogDir() {
  const dir = path.dirname(LOG_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function log(event, details = {}) {
  ensureLogDir();
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    event,
    ...details,
  }) + '\n';
  try {
    fs.appendFileSync(LOG_FILE, entry);
  } catch {
    console.error('[AuditLog] Impossible d\'écrire dans le journal de sécurité');
  }
}

module.exports = { log };

const crypto = require('crypto');

const ENCRYPTION_PREFIX = 'enc:v1:';

function getKey() {
  const secret = process.env.TOKEN_ENCRYPTION_KEY || process.env.JWT_SECRET;
  return crypto.createHash('sha256').update(secret).digest();
}

function encryptSecret(value) {
  if (!value || value.startsWith(ENCRYPTION_PREFIX)) return value;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${ENCRYPTION_PREFIX}${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

function decryptSecret(value) {
  if (!value || !value.startsWith(ENCRYPTION_PREFIX)) return value;

  const payload = value.slice(ENCRYPTION_PREFIX.length);
  const [ivRaw, tagRaw, encryptedRaw] = payload.split(':');

  const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), Buffer.from(ivRaw, 'base64'));
  decipher.setAuthTag(Buffer.from(tagRaw, 'base64'));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedRaw, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}

module.exports = {
  decryptSecret,
  encryptSecret,
};

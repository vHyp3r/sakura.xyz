const crypto = require('crypto');

const COOKIE_NAME = 'sakura_account_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

function getSecret() {
  return process.env.ACCOUNT_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || 'change-this-development-secret';
}

function sign(value) {
  return crypto.createHmac('sha256', getSecret()).update(value).digest('base64url');
}

function createSession(account) {
  const payload = Buffer.from(JSON.stringify({
    accountId: account._id.toString(),
    username: account.username,
    expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000,
  })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function parseCookies(header = '') {
  return header.split(';').reduce((cookies, part) => {
    const separator = part.indexOf('=');
    if (separator < 0) return cookies;
    cookies[part.slice(0, separator).trim()] = decodeURIComponent(part.slice(separator + 1).trim());
    return cookies;
  }, {});
}

function getAccountSession(req) {
  const token = parseCookies(req.headers.cookie)[COOKIE_NAME];
  if (!token) return null;
  const [payload, signature] = token.split('.');
  const expected = payload ? sign(payload) : '';
  if (!payload || !signature || signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return session.expiresAt > Date.now() ? session : null;
  } catch (_) {
    return null;
  }
}

function setAccountSession(res, req, account) {
  const secure = req.secure || req.headers['x-forwarded-proto'] === 'https';
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${encodeURIComponent(createSession(account))}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_SECONDS}${secure ? '; Secure' : ''}`);
}

function clearAccountSession(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
}

function requireAccount(req, res, next) {
  if (getAccountSession(req)) return next();
  if (req.originalUrl.startsWith('/api/')) return res.status(401).json({ error: 'Account authentication required.' });
  return res.redirect(`/login?returnTo=${encodeURIComponent(req.originalUrl)}`);
}

module.exports = { clearAccountSession, getAccountSession, requireAccount, setAccountSession };
const crypto = require('crypto');

const COOKIE_NAME = 'sakura_admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 8;

function getAdminUsernames() {
  return (process.env.ADMIN_USERNAMES || 'admin')
    .split(',')
    .map((username) => username.trim().toLowerCase())
    .filter(Boolean);
}

function getSecret() {
  return process.env.ADMIN_SESSION_SECRET || 'change-this-development-secret';
}

function isAdminUsername(username) {
  return getAdminUsernames().includes(String(username || '').trim().toLowerCase());
}

function sign(value) {
  return crypto.createHmac('sha256', getSecret()).update(value).digest('base64url');
}

function createSession(username) {
  const payload = Buffer.from(JSON.stringify({
    username: username.trim(),
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

function getAdminSession(req) {
  const token = parseCookies(req.headers.cookie)[COOKIE_NAME];
  if (!token) return null;

  const [payload, signature] = token.split('.');
  const expectedSignature = payload ? sign(payload) : '';
  if (!payload || !signature || signature.length !== expectedSignature.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return session.expiresAt > Date.now() && isAdminUsername(session.username) ? session : null;
  } catch (_) {
    return null;
  }
}

function setAdminSession(res, req, username) {
  const secure = req.secure || req.headers['x-forwarded-proto'] === 'https';
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${encodeURIComponent(createSession(username))}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_SECONDS}${secure ? '; Secure' : ''}`);
}

function clearAdminSession(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
}

function requireAdmin(req, res, next) {
  if (getAdminSession(req)) return next();
  if (req.originalUrl.startsWith('/api/')) return res.status(401).json({ error: 'Admin authentication required.' });
  return res.redirect(`/admin/login?returnTo=${encodeURIComponent(req.originalUrl)}`);
}

module.exports = {
  clearAdminSession,
  getAdminSession,
  getAdminUsernames,
  isAdminUsername,
  requireAdmin,
  setAdminSession,
};
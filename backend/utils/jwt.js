const jwt = require('jsonwebtoken');
const { env } = require('../config/env');

function assertJwtSecret() {
  if (!env.jwtSecret) {
    throw new Error('JWT_SECRET is not set. Add it to your .env file.');
  }
}

function signAccessToken(user) {
  assertJwtSecret();
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role || 'admin',
  };
  if (user.name) {
    payload.name = user.name;
  }
  if (user.role === 'sales' && user.salespersonId) {
    payload.salespersonId = user.salespersonId;
  }
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

function verifyAccessToken(token) {
  assertJwtSecret();
  return jwt.verify(token, env.jwtSecret);
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
};

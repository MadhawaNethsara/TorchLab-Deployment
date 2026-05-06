const { verifyAccessToken } = require('../utils/jwt');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: { message: 'Authentication required' },
    });
  }

  const token = authHeader.slice('Bearer '.length).trim();

  if (!token) {
    return res.status(401).json({
      error: { message: 'Authentication required' },
    });
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role || 'admin',
      salespersonId: payload.salespersonId || null,
      name: payload.name || null,
    };
    next();
  } catch {
    return res.status(401).json({
      error: { message: 'Invalid or expired token' },
    });
  }
}

module.exports = { authenticate };

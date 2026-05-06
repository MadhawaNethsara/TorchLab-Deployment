const bcrypt = require('bcrypt');
const { hardcodedUser } = require('../config/hardcodedUser');
const { Salesperson } = require('../models/Salesperson.model');
const { signAccessToken } = require('../utils/jwt');

async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        error: { message: 'Email and password are required' },
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    if (normalizedEmail === hardcodedUser.email) {
      const passwordOk = await bcrypt.compare(password, hardcodedUser.passwordHash);
      if (!passwordOk) {
        return res.status(401).json({
          error: { message: 'Invalid credentials' },
        });
      }

      const token = signAccessToken({
        id: hardcodedUser.id,
        email: hardcodedUser.email,
        role: 'admin',
        name: 'Admin',
      });

      return res.json({
        token,
        user: {
          id: hardcodedUser.id,
          email: hardcodedUser.email,
          role: 'admin',
          name: 'Admin',
          salespersonId: null,
        },
      });
    }

    const sp = await Salesperson.findOne({ loginEmail: normalizedEmail }).select(
      '+passwordHash',
    );

    if (!sp || !sp.passwordHash) {
      return res.status(401).json({
        error: { message: 'Invalid credentials' },
      });
    }

    const ok = await bcrypt.compare(password, sp.passwordHash);
    if (!ok) {
      return res.status(401).json({
        error: { message: 'Invalid credentials' },
      });
    }

    const salespersonId = String(sp._id);
    const token = signAccessToken({
      id: salespersonId,
      email: sp.loginEmail,
      role: 'sales',
      salespersonId,
      name: sp.name,
    });

    return res.json({
      token,
      user: {
        id: salespersonId,
        email: sp.loginEmail,
        role: 'sales',
        name: sp.name,
        salespersonId,
      },
    });
  } catch (err) {
    next(err);
  }
}

function getMe(req, res) {
  res.json({ user: req.user });
}

module.exports = {
  login,
  getMe,
};

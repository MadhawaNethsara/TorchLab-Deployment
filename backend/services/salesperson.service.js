const bcrypt = require('bcrypt');
const { Salesperson } = require('../models/Salesperson.model');

async function listSalespeople() {
  return Salesperson.find().sort({ name: 1 }).lean();
}

async function createSalesperson(body) {
  const name = body?.name != null ? String(body.name).trim() : '';
  if (!name) {
    const err = new Error('name is required');
    err.statusCode = 400;
    throw err;
  }

  const email =
    body?.email != null && String(body.email).trim() !== ''
      ? String(body.email).trim().toLowerCase()
      : undefined;

  const loginEmailRaw = body?.loginEmail;
  const password = body?.password;
  const loginEmail =
    loginEmailRaw != null && String(loginEmailRaw).trim() !== ''
      ? String(loginEmailRaw).trim().toLowerCase()
      : undefined;

  if ((loginEmail && !password) || (!loginEmail && password)) {
    const err = new Error(
      'Provide both login email and password for portal access, or leave both blank.',
    );
    err.statusCode = 400;
    throw err;
  }

  let passwordHash;
  if (loginEmail && password) {
    if (String(password).length < 8) {
      const err = new Error('Password must be at least 8 characters');
      err.statusCode = 400;
      throw err;
    }
    passwordHash = await bcrypt.hash(String(password), 10);
  }

  const doc = { name, email };
  if (loginEmail && passwordHash) {
    doc.loginEmail = loginEmail;
    doc.passwordHash = passwordHash;
  }

  try {
    return await Salesperson.create(doc);
  } catch (err) {
    if (err.code === 11000) {
      const dup = new Error(
        'Duplicate value: name or login email already exists',
      );
      dup.statusCode = 400;
      throw dup;
    }
    throw err;
  }
}

module.exports = {
  listSalespeople,
  createSalesperson,
};

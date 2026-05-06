/**
 * Single seeded admin user (replace with DB-backed users when adding business logic).
 * Password plain text: password123 — stored as bcrypt hash only.
 */
const hardcodedUser = {
  id: 'admin-001',
  email: 'admin@example.com',
  passwordHash:
    '$2b$10$u0bSQ4JusEJh/ndaWmHXQ.ZUFWpeVPS6y4KjV65DfQ9o3rFd5mUim',
};

module.exports = { hardcodedUser };

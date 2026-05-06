function requireAdmin(req, res, next) {
  const role = req.user?.role || 'admin';
  if (role !== 'admin') {
    return res.status(403).json({
      error: { message: 'Admin access required' },
    });
  }
  next();
}

module.exports = { requireAdmin };

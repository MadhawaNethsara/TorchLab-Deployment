const { asyncHandler } = require('../middleware/asyncHandler');
const dashboardService = require('../services/dashboard.service');

const getDashboard = asyncHandler(async (req, res) => {
  const stats = await dashboardService.getDashboardStats(req.user);
  res.json(stats);
});

module.exports = {
  getDashboard,
};

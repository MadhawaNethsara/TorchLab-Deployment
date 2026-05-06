const { asyncHandler } = require('../middleware/asyncHandler');
const reportService = require('../services/report.service');

const downloadLeadsPdf = asyncHandler(async (req, res) => {
  await reportService.streamLeadsPdf(res, req.query, req.user);
});

module.exports = {
  downloadLeadsPdf,
};

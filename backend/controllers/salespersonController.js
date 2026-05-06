const { asyncHandler } = require('../middleware/asyncHandler');
const salespersonService = require('../services/salesperson.service');

const listSalespeople = asyncHandler(async (req, res) => {
  const salespeople = await salespersonService.listSalespeople();
  res.json({ salespeople });
});

const createSalesperson = asyncHandler(async (req, res) => {
  const person = await salespersonService.createSalesperson(req.body);
  res.status(201).json({ salesperson: person });
});

module.exports = {
  listSalespeople,
  createSalesperson,
};

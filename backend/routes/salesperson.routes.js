const express = require('express');
const { authenticate } = require('../middleware/authenticate');
const { requireAdmin } = require('../middleware/requireAdmin');
const {
  listSalespeople,
  createSalesperson,
} = require('../controllers/salespersonController');

const salespersonRouter = express.Router();

salespersonRouter.use(authenticate, requireAdmin);

salespersonRouter.get('/', listSalespeople);
salespersonRouter.post('/', createSalesperson);

module.exports = { salespersonRouter };

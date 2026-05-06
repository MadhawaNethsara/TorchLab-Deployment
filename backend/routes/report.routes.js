const express = require('express');
const { authenticate } = require('../middleware/authenticate');
const { downloadLeadsPdf } = require('../controllers/reportController');

const reportRouter = express.Router();

reportRouter.use(authenticate);
reportRouter.get('/leads.pdf', downloadLeadsPdf);

module.exports = { reportRouter };

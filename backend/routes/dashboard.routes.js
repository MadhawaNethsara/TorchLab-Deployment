const express = require('express');
const { authenticate } = require('../middleware/authenticate');
const { getDashboard } = require('../controllers/dashboardController');

const dashboardRouter = express.Router();

dashboardRouter.use(authenticate);
dashboardRouter.get('/', getDashboard);

module.exports = { dashboardRouter };

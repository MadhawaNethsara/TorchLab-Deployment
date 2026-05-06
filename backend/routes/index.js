const express = require('express');
const { getHealth } = require('../controllers/healthController');
const { authRouter } = require('./auth.routes');
const { leadRouter } = require('./lead.routes');
const { dashboardRouter } = require('./dashboard.routes');
const { reportRouter } = require('./report.routes');

const router = express.Router();

router.use('/auth', authRouter);

router.use('/dashboard', dashboardRouter);

router.use('/leads', leadRouter);

router.use('/reports', reportRouter);

router.get('/health', getHealth);

module.exports = { router };

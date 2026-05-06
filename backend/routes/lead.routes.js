const express = require('express');
const { authenticate } = require('../middleware/authenticate');
const {
  listLeads,
  createLead,
  getLead,
  updateLead,
  deleteLead,
  addLeadNote,
} = require('../controllers/leadController');

const leadRouter = express.Router();

leadRouter.use(authenticate);

leadRouter.get('/', listLeads);
leadRouter.post('/', createLead);
leadRouter.post('/:id/notes', addLeadNote);
leadRouter.get('/:id', getLead);
leadRouter.put('/:id', updateLead);
leadRouter.delete('/:id', deleteLead);

module.exports = { leadRouter };

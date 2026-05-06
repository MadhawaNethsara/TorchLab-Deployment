const { asyncHandler } = require('../middleware/asyncHandler');
const leadService = require('../services/lead.service');

const listLeads = asyncHandler(async (req, res) => {
  const leads = await leadService.listLeads(req.query, req.user);
  res.json({ leads });
});

const createLead = asyncHandler(async (req, res) => {
  const lead = await leadService.createLead(req.body, req.user);
  res.status(201).json({ lead });
});

const getLead = asyncHandler(async (req, res) => {
  const lead = await leadService.getLeadById(req.params.id, req.user);
  res.json({ lead });
});

const updateLead = asyncHandler(async (req, res) => {
  const lead = await leadService.updateLeadById(req.params.id, req.body, req.user);
  res.json({ lead });
});

const deleteLead = asyncHandler(async (req, res) => {
  const lead = await leadService.deleteLeadById(req.params.id, req.user);
  res.json({ lead });
});

const addLeadNote = asyncHandler(async (req, res) => {
  const lead = await leadService.appendNoteToLead(req.params.id, req.body, req.user);
  res.status(201).json({ lead });
});

module.exports = {
  listLeads,
  createLead,
  getLead,
  updateLead,
  deleteLead,
  addLeadNote,
};

const mongoose = require('mongoose');
const { Lead } = require('../models/Lead.model');
const { Salesperson } = require('../models/Salesperson.model');

const POPULATE_SALESPERSON = { path: 'salesperson', select: 'name email' };

const SALES_UPDATE_FIELDS = [
  'status',
  'dealValue',
  'leadName',
  'companyName',
  'email',
  'phoneNumber',
  'leadSource',
];

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isSalesUser(user) {
  return (user?.role || 'admin') === 'sales' && user?.salespersonId;
}

function buildListFilter(query, user) {
  const filter = {};

  if (query.status) {
    filter.status = query.status;
  }
  if (query.leadSource) {
    filter.leadSource = query.leadSource;
  }
  if (!isSalesUser(user) && query.salesperson && mongoose.isValidObjectId(query.salesperson)) {
    filter.salesperson = query.salesperson;
  }

  const rawSearch = query.search ?? query.q;
  if (rawSearch != null && String(rawSearch).trim() !== '') {
    const term = escapeRegex(String(rawSearch).trim());
    filter.$or = [
      { leadName: { $regex: term, $options: 'i' } },
      { companyName: { $regex: term, $options: 'i' } },
      { email: { $regex: term, $options: 'i' } },
    ];
  }

  if (isSalesUser(user)) {
    filter.salesperson = new mongoose.Types.ObjectId(user.salespersonId);
  }

  return filter;
}

async function listLeads(query, user) {
  const filter = buildListFilter(query, user);
  return Lead.find(filter)
    .populate(POPULATE_SALESPERSON)
    .sort({ createdAt: -1 })
    .lean();
}

const CREATE_FIELDS = [
  'leadName',
  'companyName',
  'email',
  'phoneNumber',
  'leadSource',
  'salesperson',
  'status',
  'dealValue',
  'notes',
];

const UPDATE_FIELDS = [
  'leadName',
  'companyName',
  'email',
  'phoneNumber',
  'leadSource',
  'salesperson',
  'status',
  'dealValue',
  'notes',
];

function pickAllowed(body, allowedKeys) {
  const out = {};
  for (const key of allowedKeys) {
    if (body[key] !== undefined) {
      out[key] = body[key];
    }
  }
  return out;
}

async function resolveSalespersonField(value) {
  if (value === '' || value === null || value === undefined) {
    return null;
  }
  const id = String(value);
  if (!mongoose.isValidObjectId(id)) {
    const err = new Error('Invalid salesperson id');
    err.statusCode = 400;
    throw err;
  }
  const exists = await Salesperson.exists({ _id: id });
  if (!exists) {
    const err = new Error('Salesperson not found');
    err.statusCode = 400;
    throw err;
  }
  return id;
}

function leadAccessFilter(id, user) {
  const filter = { _id: id };
  if (isSalesUser(user)) {
    filter.salesperson = user.salespersonId;
  }
  return filter;
}

async function createLead(body, user) {
  const data = pickAllowed(body, CREATE_FIELDS);

  if (isSalesUser(user)) {
    data.salesperson = await resolveSalespersonField(user.salespersonId);
  } else if ('salesperson' in data) {
    data.salesperson = await resolveSalespersonField(data.salesperson);
  }

  const created = await Lead.create(data);
  return Lead.findById(created._id).populate(POPULATE_SALESPERSON).lean();
}

async function getLeadById(id, user) {
  if (!mongoose.isValidObjectId(id)) {
    const err = new Error('Invalid lead id');
    err.statusCode = 400;
    throw err;
  }
  const lead = await Lead.findOne(leadAccessFilter(id, user))
    .populate(POPULATE_SALESPERSON)
    .lean();
  if (!lead) {
    const err = new Error('Lead not found');
    err.statusCode = 404;
    throw err;
  }
  return lead;
}

async function updateLeadById(id, body, user) {
  if (!mongoose.isValidObjectId(id)) {
    const err = new Error('Invalid lead id');
    err.statusCode = 400;
    throw err;
  }

  let updates = pickAllowed(body, UPDATE_FIELDS);

  if (isSalesUser(user)) {
    const next = {};
    for (const key of SALES_UPDATE_FIELDS) {
      if (updates[key] !== undefined) {
        next[key] = updates[key];
      }
    }
    updates = next;
    if (Object.keys(updates).length === 0) {
      const err = new Error('No valid fields to update');
      err.statusCode = 400;
      throw err;
    }
  } else if ('salesperson' in updates) {
    updates.salesperson = await resolveSalespersonField(updates.salesperson);
  }

  if (Object.keys(updates).length === 0) {
    const err = new Error('No valid fields to update');
    err.statusCode = 400;
    throw err;
  }

  const lead = await Lead.findOneAndUpdate(
    leadAccessFilter(id, user),
    { $set: updates },
    { new: true, runValidators: true },
  )
    .populate(POPULATE_SALESPERSON)
    .lean();

  if (!lead) {
    const err = new Error('Lead not found');
    err.statusCode = 404;
    throw err;
  }
  return lead;
}

async function deleteLeadById(id, user) {
  if (isSalesUser(user)) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }

  if (!mongoose.isValidObjectId(id)) {
    const err = new Error('Invalid lead id');
    err.statusCode = 400;
    throw err;
  }
  const lead = await Lead.findByIdAndDelete(id).lean();
  if (!lead) {
    const err = new Error('Lead not found');
    err.statusCode = 404;
    throw err;
  }
  return lead;
}

async function appendNoteToLead(id, body, user) {
  if (!mongoose.isValidObjectId(id)) {
    const err = new Error('Invalid lead id');
    err.statusCode = 400;
    throw err;
  }

  const { content, createdBy, createdAt } = body || {};

  if (content == null || String(content).trim() === '') {
    const err = new Error('content is required');
    err.statusCode = 400;
    throw err;
  }
  if (createdBy == null || String(createdBy).trim() === '') {
    const err = new Error('createdBy is required');
    err.statusCode = 400;
    throw err;
  }

  let resolvedCreatedAt;
  if (createdAt !== undefined && createdAt !== null) {
    resolvedCreatedAt = new Date(createdAt);
    if (Number.isNaN(resolvedCreatedAt.getTime())) {
      const err = new Error('createdAt must be a valid date');
      err.statusCode = 400;
      throw err;
    }
  } else {
    resolvedCreatedAt = new Date();
  }

  const note = {
    content: String(content).trim(),
    createdBy: String(createdBy).trim(),
    createdAt: resolvedCreatedAt,
  };

  const lead = await Lead.findOneAndUpdate(
    leadAccessFilter(id, user),
    { $push: { notes: note } },
    { new: true, runValidators: true },
  )
    .populate(POPULATE_SALESPERSON)
    .lean();

  if (!lead) {
    const err = new Error('Lead not found');
    err.statusCode = 404;
    throw err;
  }

  return lead;
}

module.exports = {
  listLeads,
  createLead,
  getLeadById,
  updateLeadById,
  deleteLeadById,
  appendNoteToLead,
};

const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const { Lead, LEAD_SOURCES, LEAD_STATUSES } = require('../models/Lead.model');

const POPULATE_SALESPERSON = { path: 'salesperson', select: 'name email' };
const MAX_LEADS_IN_PDF = 1000;

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isSalesUser(user) {
  return (user?.role || 'admin') === 'sales' && user?.salespersonId;
}

function normalizeStatuses(query) {
  let raw = query.status;
  if (raw == null) return [];
  const list = Array.isArray(raw) ? raw : [raw];
  return list
    .flatMap((s) => String(s).split(','))
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseDateRange(query) {
  const range = {};
  if (query.from != null && String(query.from).trim() !== '') {
    const start = new Date(`${String(query.from).trim()}T00:00:00.000Z`);
    if (Number.isNaN(start.getTime())) {
      const err = new Error('Invalid from date (use YYYY-MM-DD)');
      err.statusCode = 400;
      throw err;
    }
    range.$gte = start;
  }
  if (query.to != null && String(query.to).trim() !== '') {
    const end = new Date(`${String(query.to).trim()}T23:59:59.999Z`);
    if (Number.isNaN(end.getTime())) {
      const err = new Error('Invalid to date (use YYYY-MM-DD)');
      err.statusCode = 400;
      throw err;
    }
    range.$lte = end;
  }
  if (range.$gte && range.$lte && range.$gte > range.$lte) {
    const err = new Error('Date range invalid: from must be on or before to');
    err.statusCode = 400;
    throw err;
  }
  return Object.keys(range).length ? range : null;
}

function buildReportFilter(query, user) {
  const filter = {};

  const createdRange = parseDateRange(query);
  if (createdRange) {
    filter.createdAt = createdRange;
  }

  const result = String(query.result || 'all').toLowerCase();
  if (result === 'won') {
    filter.status = 'Won';
  } else if (result === 'lost') {
    filter.status = 'Lost';
  } else if (result === 'open') {
    filter.status = { $nin: ['Won', 'Lost'] };
  } else {
    const statuses = normalizeStatuses(query).filter((s) => LEAD_STATUSES.includes(s));
    if (statuses.length === 1) {
      filter.status = statuses[0];
    } else if (statuses.length > 1) {
      filter.status = { $in: statuses };
    }
  }

  if (query.leadSource != null && String(query.leadSource).trim() !== '') {
    const ls = String(query.leadSource).trim();
    if (!LEAD_SOURCES.includes(ls)) {
      const err = new Error('Invalid leadSource');
      err.statusCode = 400;
      throw err;
    }
    filter.leadSource = ls;
  }

  if (isSalesUser(user)) {
    filter.salesperson = new mongoose.Types.ObjectId(user.salespersonId);
  } else if (query.salesperson && mongoose.isValidObjectId(query.salesperson)) {
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

  return filter;
}

function formatMoney(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    Number(value),
  );
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return '—';
  }
}

function filterSummaryLine(query, user) {
  const parts = [];
  if (query.from) parts.push(`From: ${query.from}`);
  if (query.to) parts.push(`To: ${query.to}`);
  const result = String(query.result || 'all').toLowerCase();
  if (result === 'won') parts.push('Outcome: Won');
  else if (result === 'lost') parts.push('Outcome: Lost');
  else if (result === 'open') parts.push('Outcome: Open pipeline');
  else {
    const st = normalizeStatuses(query).filter((s) => LEAD_STATUSES.includes(s));
    if (st.length) parts.push(`Statuses: ${st.join(', ')}`);
    else parts.push('Outcome: All');
  }
  if (query.leadSource) parts.push(`Source: ${query.leadSource}`);
  if (query.search || query.q) parts.push(`Search: ${query.search || query.q}`);
  if (!isSalesUser(user) && query.salesperson) {
    parts.push(`Salesperson id: ${query.salesperson}`);
  }
  if (isSalesUser(user)) parts.push('Scope: Your leads only');
  return parts.join(' · ');
}

function roomFor(doc, heightNeeded) {
  const bottom = doc.page.height - doc.page.margins.bottom;
  return doc.y + heightNeeded <= bottom;
}

async function streamLeadsPdf(res, query, user) {
  const filter = buildReportFilter(query, user);

  const cursor = Lead.find(filter)
    .populate(POPULATE_SALESPERSON)
    .sort({ createdAt: -1 })
    .limit(MAX_LEADS_IN_PDF + 1)
    .lean();

  const leads = await cursor;
  const truncated = leads.length > MAX_LEADS_IN_PDF;
  const rows = truncated ? leads.slice(0, MAX_LEADS_IN_PDF) : leads;

  const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="leads-report.pdf"');
  doc.pipe(res);

  doc.fontSize(18).text('Leads report', { align: 'center' });
  doc.moveDown(0.4);
  doc.fontSize(9).fillColor('#444444').text(`Generated ${new Date().toISOString()}`, {
    align: 'center',
  });
  doc.fillColor('#000000');
  doc.moveDown(0.8);
  doc.fontSize(9).text(filterSummaryLine(query, user), { align: 'left' });
  doc.moveDown(1.2);

  if (rows.length === 0) {
    doc.fontSize(11).text('No leads matched these filters.');
  } else {
    doc.fontSize(10);
    for (let i = 0; i < rows.length; i += 1) {
      const lead = rows[i];
      const blockHeight = 72;
      if (!roomFor(doc, blockHeight)) {
        doc.addPage();
      }

      const name = lead.leadName || '—';
      const sp = lead.salesperson?.name || '—';
      doc.font('Helvetica-Bold').text(`${i + 1}. ${name}`, { continued: false });
      doc.font('Helvetica').fontSize(9);
      doc.text(
        `Status: ${lead.status} · Deal: ${formatMoney(lead.dealValue)} · Created: ${formatDate(lead.createdAt)}`,
      );
      doc.text(
        `Company: ${lead.companyName || '—'} · Email: ${lead.email || '—'} · Phone: ${lead.phoneNumber || '—'}`,
      );
      doc.text(`Source: ${lead.leadSource} · Salesperson: ${sp}`);
      doc.moveDown(0.6);
      doc.fontSize(10);
    }

    if (truncated) {
      doc.moveDown(0.5);
      doc
        .fontSize(9)
        .fillColor('#aa0000')
        .text(
          `Note: export limited to the first ${MAX_LEADS_IN_PDF} leads. Narrow filters to include the rest.`,
        );
      doc.fillColor('#000000');
    }
  }

  doc.end();
}

module.exports = {
  streamLeadsPdf,
};

const mongoose = require('mongoose');

const LEAD_SOURCES = ['website', 'linkedin', 'referral', 'cold_email', 'event'];

const LEAD_STATUSES = [
  'New',
  'Contacted',
  'Qualified',
  'Proposal Sent',
  'Won',
  'Lost',
];

const noteSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true },
);

const leadSchema = new mongoose.Schema(
  {
    leadName: {
      type: String,
      required: true,
      trim: true,
    },
    companyName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    leadSource: {
      type: String,
      required: true,
      enum: LEAD_SOURCES,
    },
    salesperson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salesperson',
      default: null,
    },
    status: {
      type: String,
      enum: LEAD_STATUSES,
      default: 'New',
    },
    dealValue: {
      type: Number,
      min: 0,
    },
    notes: {
      type: [noteSchema],
      default: [],
    },
  },
  { timestamps: true },
);

const Lead = mongoose.model('Lead', leadSchema);

module.exports = {
  Lead,
  LEAD_SOURCES,
  LEAD_STATUSES,
};

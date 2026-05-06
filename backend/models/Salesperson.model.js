const mongoose = require('mongoose');

const salespersonSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 320,
    },
    loginEmail: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 320,
    },
    passwordHash: {
      type: String,
      select: false,
    },
  },
  { timestamps: true },
);

salespersonSchema.index({ name: 1 }, { unique: true });
salespersonSchema.index(
  { loginEmail: 1 },
  { unique: true, sparse: true },
);

const Salesperson = mongoose.model('Salesperson', salespersonSchema);

module.exports = { Salesperson };

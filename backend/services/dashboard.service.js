const mongoose = require('mongoose');
const { Lead } = require('../models/Lead.model');

function isSalesUser(user) {
  return (user?.role || 'admin') === 'sales' && user?.salespersonId;
}

async function getDashboardStats(user) {
  const matchStage = {};
  if (isSalesUser(user)) {
    matchStage.salesperson = new mongoose.Types.ObjectId(user.salespersonId);
  }

  const pipeline = [
    ...(Object.keys(matchStage).length ? [{ $match: matchStage }] : []),
    {
      $group: {
        _id: null,
        totalLeads: { $sum: 1 },
        newLeads: {
          $sum: { $cond: [{ $eq: ['$status', 'New'] }, 1, 0] },
        },
        qualifiedLeads: {
          $sum: { $cond: [{ $eq: ['$status', 'Qualified'] }, 1, 0] },
        },
        wonLeads: {
          $sum: { $cond: [{ $eq: ['$status', 'Won'] }, 1, 0] },
        },
        lostLeads: {
          $sum: { $cond: [{ $eq: ['$status', 'Lost'] }, 1, 0] },
        },
        totalDealValue: {
          $sum: { $ifNull: ['$dealValue', 0] },
        },
        totalWonValue: {
          $sum: {
            $cond: [
              { $eq: ['$status', 'Won'] },
              { $ifNull: ['$dealValue', 0] },
              0,
            ],
          },
        },
      },
    },
  ];

  const [row] = await Lead.aggregate(pipeline);

  return {
    totalLeads: row?.totalLeads ?? 0,
    newLeads: row?.newLeads ?? 0,
    qualifiedLeads: row?.qualifiedLeads ?? 0,
    wonLeads: row?.wonLeads ?? 0,
    lostLeads: row?.lostLeads ?? 0,
    totalDealValue: row?.totalDealValue ?? 0,
    totalWonValue: row?.totalWonValue ?? 0,
  };
}

module.exports = {
  getDashboardStats,
};

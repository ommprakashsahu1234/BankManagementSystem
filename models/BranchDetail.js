const mongoose = require("mongoose");

const branchSchema = new mongoose.Schema(
  {
    branchName: { type: String, required: true, trim: true },
    branchId: { type: String, required: true, unique: true, trim: true }, // Custom Branch ID (like IFSC)
    address: { type: String, required: true, trim: true },
    contactNumber: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    totalBalance: { type: Number, required: true, default: 0 }, // Total amount available at this branch
    createdAt: { type: Date, default: Date.now }
  }
);

module.exports = mongoose.model("Branch", branchSchema);

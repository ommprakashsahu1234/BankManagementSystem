const mongoose = require("mongoose");

const branchManagerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    mobno: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    branchManagerId: { type: String, required: true, unique: true, trim: true }, 
    password: { type: String, required: true },
    branchId: { type: String, required: true, unique: true, trim: true }, 
    bankManagerId: { type: String, required: true }, 
    createdAt: { type: Date, default: Date.now }
  }
);

module.exports = mongoose.model("BranchManager", branchManagerSchema);

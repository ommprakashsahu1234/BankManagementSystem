const mongoose = require("mongoose");

const accountHolderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    mobno: { type: String, required: true, trim: true },
    accountNumber: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    branchId: { type: String, required: true }, 
    address: { type: String },
    balance: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
  }
);

module.exports = mongoose.model("AccountHolder", accountHolderSchema);
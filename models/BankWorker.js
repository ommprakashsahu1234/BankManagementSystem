const mongoose = require("mongoose");

const bankWorkerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    mobno: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    workerId: { type: String, required: true, unique: true, trim: true }, // Custom worker ID
    password: { type: String, required: true },
    branchId: { type: String, required: true }, // Assigned by branch manager
    branchManagerId: { type: String, required: true }, // To trace hierarchy
    createdAt: { type: Date, default: Date.now }
  }
);

module.exports = mongoose.model("BankWorker", bankWorkerSchema);

const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    transactionId: { type: String, required: true, unique: true, trim: true },
    fromAccountId: { type: String, required: true, trim: true },
    toAccountId: { type: String, required: true, trim: true },
    branchId: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    transactionType: { 
      type: String, 
      enum: ["debit", "credit", "loan payment", "transfer","loan credit","deposit","withdraw"], 
      required: true 
    },
    purpose: { type: String, trim: true },
    status: { 
      type: String, 
      enum: ["pending", "completed", "failed"], 
      default: "pending" 
    },
    transactionDate: { type: Date, default: Date.now },
    remarks: { type: String, trim: true }
  }
);

module.exports = mongoose.model("Transaction", transactionSchema);

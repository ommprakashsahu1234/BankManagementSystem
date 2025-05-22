  const mongoose = require("mongoose");

  const loanSchema = new mongoose.Schema(
    {
      loanId: { type: String, required: true, unique: true, trim: true }, 
      parentAmount: { type: Number, required: true }, 
      amountToBePaid: { type: Number, required: true }, 
      accountHolderNumber: { type: String, required: true, trim: true }, 
      appliedByWorkerId: { type: String, required: true, trim: true }, 
      approvedByBranchManagerId: { type: String, trim: true }, 
      purpose: { type: String, required: true, trim: true }, 
      status: { 
        type: String, 
        enum: ["pending", "approved", "rejected", "disbursed", "closed"], 
        default: "pending" 
      },
      applicationDate: { type: Date, default: Date.now },
      approvalDate: { type: Date },
      disbursementDate: { type: Date },
      closingDate: { type: Date },
      interestRate: { type: Number, default: 0 },
      tenureMonths: { type: Number, default: 12 },
      branchId: { type: String, required: true, trim: true },
      remarks: { type: String, trim: true }
    }
  );

  module.exports = mongoose.model("Loan", loanSchema);

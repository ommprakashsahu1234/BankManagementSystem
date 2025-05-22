const mongoose = require("mongoose");

const loanPaymentSchema = new mongoose.Schema(
  {
    paymentId: { type: String, required: true, unique: true, trim: true },
    loanId: { type: String, required: true, trim: true },
    accountHolderId: { type: String, required: true, trim: true },
    paymentAmount: { type: Number, required: true },
    paymentDate: { type: Date, default: Date.now },
    paymentMode: { type: String, trim: true, default: "online" },
    remarks: { type: String, trim: true }
  }
);

module.exports = mongoose.model("LoanPayment", loanPaymentSchema);

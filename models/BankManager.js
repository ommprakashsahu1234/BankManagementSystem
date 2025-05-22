const mongoose = require("mongoose");

const bankManagerSchema = new mongoose.Schema({
  managerId: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  mobno: { type: String, required: true, trim: true },
  address: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("BankManager", bankManagerSchema);

    const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    receiverId: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    purpose: { type: String, trim: true },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }
);

module.exports = mongoose.model("Notification", notificationSchema);

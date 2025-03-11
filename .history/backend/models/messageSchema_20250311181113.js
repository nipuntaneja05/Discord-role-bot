const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  messageCount: { type: Number, default: 0 },
});

module.exports = mongoose.model("UserMessage", messageSchema);

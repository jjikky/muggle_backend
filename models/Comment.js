const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema({
  text: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "order",
  },
  like: [mongoose.Schema.Types.ObjectId],
  count_li: {
    type: Number,
    default: 0,
  },
  type: {
    type: String,
  },
  reply: [mongoose.Schema.Types.ObjectId],
  count_reply: { type: Number, default: 0 },
});

const model = mongoose.model("Comment", CommentSchema);
module.exports = model;

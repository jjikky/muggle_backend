const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  title: {
    type: String,
  },
  description: {
    type: String,
  },
  views: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  hash: [String],
  like: [mongoose.Schema.Types.ObjectId],
  count_li: {
    type: Number,
    default: 0,
  },
  bookmark: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  count_bo: {
    type: Number,
    default: 0,
  },
  thumbnail:{
    type: String,
    ref: "Image",
  },
  public: {
    type: Number,
    default: 1,
  },
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
  ],
  image: [
    {
      type: String,
      ref: "Image",
    },
  ],
  link: String,
  count_co: {
    type: Number,
    default: 0,
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  delete_col: {
    type: Number,
    default: 0,
  },
  video_thumbnail: String,
  location: String,
});

const model = mongoose.model("Order", OrderSchema);
module.exports = model;

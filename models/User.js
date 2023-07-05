const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  phoneNumber: String,
  type: String,
  uid: { type: String, required: true, unique: true },
  firstName: String,
  lastName: String,
  gender: String,
  birth: Number,
  instagramId: String,
  nickname: { type: String },
  avatar: String,
  intro: {
    type: String,
    default: "자기소개를 작성해주세요.",
  },
  bookmark: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
  ],
  count_bo: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  order: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
  ],
  like: [mongoose.Schema.Types.ObjectId],
  follower: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  following: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  delete_col: {
    type: Number,
    default: 0,
  },
  pushToken: String,
  locale: String,
  pushFlag: {
    type: Number,
    default: 0,
  },
});

const model = mongoose.model("User", UserSchema);

module.exports = model;

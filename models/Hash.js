const mongoose = require("mongoose");

const HashSchema = new mongoose.Schema({
  text: {
    type: String,
  },
  count: {
    type: Number,
    default: 1,
  },
  order: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "order",
    },
  ],
});

const model = mongoose.model("Hash", HashSchema);
module.exports = model;

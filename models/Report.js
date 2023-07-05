const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
  },
  text: {
    type: String,
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const model = mongoose.model("Report", ReportSchema);
module.exports = model;

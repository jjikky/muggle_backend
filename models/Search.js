const mongoose = require("mongoose");

const Search_InfoSchema = new mongoose.Schema({
  user: [mongoose.Schema.Types.ObjectId],
  searchAt: {
    type: [Date],
    default: Date.now,
  },
});

const SearchSchema = new mongoose.Schema({
  text: String,
  count: {
    type: Number,
    default: 1,
  },
  info: Search_InfoSchema,
});

const model = mongoose.model("Search", SearchSchema);

module.exports = model;

const mongoose = require("mongoose");

const ImageSchema = new mongoose.Schema({
  latitude: {
    type: String,
  },
  longitude: {
    type: String,
  },
  image: {
    type: String,
  },
  file_width: {
    type: Number,
  },
  file_height: {
    type: Number,
  },
  dimensions: {
    type: String,
  },
  createdAt: { type: Date, default: Date.now },
});

const model = mongoose.model("Image", ImageSchema);
module.exports = model;

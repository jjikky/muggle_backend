const mongoose = require("mongoose");

const RecommentSchema = new mongoose.Schema({
    text: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    like: [mongoose.Schema.Types.ObjectId],
    count_li: {
        type: Number,
        default: 0
    }
});

const model = mongoose.model("Recomment", RecommentSchema);
module.exports = model;
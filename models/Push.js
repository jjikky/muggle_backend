const mongoose = require("mongoose");

const PushSchema = new mongoose.Schema(
  {
    title: {
      type: String,
    },
    description: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    sendPushToken: String,
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    sender_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    recipient: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    versionKey: false,
  }
);

// sendPushToken : 누가 보냈는지 보내는 이의 pushToken
// recipient : 받는 사람의 pushToken을 프론트에서 게시물(댓글 대댓글 게시글)의 creator를 보내줌.
// push토큰 sender만 있는 이유는 받는 사람의 푸쉬토큰은 api에서 참조하고 history api는 받는 이 입장에서만 펼쳐지기 때문.
// 또한 푸쉬토큰은 디바이스 기준으로 생성되기 때문에 히스토리 페이지가 내가아닌 다른 아이디로 로그인 했을 때 같은 디바이스 다른 아이디에 생기는것을 방지하기 위함!.
const model = mongoose.model("Push", PushSchema);
module.exports = model;

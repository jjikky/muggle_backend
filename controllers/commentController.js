const User = require("../models/User");
const Order = require("../models/order");
const Comment = require("../models/Comment");
const i18n = require("../i18n/i18n");
const pushHandler = require("./pushHandler");

exports.getAddComment = (req, res) => res.render("addComment");
exports.postAddComment = async (req, res) => {
  const user = await User.findOne({ uid: "ORjLacRKL8WwTYPUcdWoWvDVf8s2" });
  const {
    body: { comment, type, comment_id, taste_id },
  } = req;
  try {
    const order = await Order.findById(taste_id).populate({
      path: "creator",
      select: { _id: 1, uid: 1, nickname: 1, pushToken: 1, locale: 1 },
    });

    if (type == "comment") {
      const newComment = await Comment.create({
        text: comment,
        creator: user._id,
        order: taste_id,
        type: type,
      });
      order.comments.push(newComment._id);
      order.count_co += 1;
      order.save();
    } else if (type == "reply") {
      const newReply = await Comment.create({
        text: req.body.comment, // comment로 쓸 시 before initialization err, 위에선 안그럼
        creator: user._id,
        type: type,
        order: taste_id,
      });
      const origin_comment = await Comment.findById(comment_id);

      origin_comment.count_reply += 1;
      origin_comment.reply.push(newReply._id);
      origin_comment.save();
      order.count_co += 1;
      order.save();
    }

    i18n.initialize(order.creator.locale || "en_US");
    pushHandler.pushStack(
      `${user.nickname}${i18n.t("님이 나의 게시글에 댓글💬을 남겼어요")}`,
      order.creator._id,
      user._id,
      order._id
    );
    if (order.creator.pushToken && req.uid != order.creator.uid) {
      pushHandler.sendPush(
        order.creator.pushToken,
        `${user.nickname}${i18n.t("님이 나의 게시글에 댓글💬을 남겼어요")}`,
        { goto: "post", taste_id: req.body.taste_id }
      );
    }
    res.send({ code: 200, description: "OK" });
  } catch (error) {
    console.log(error);
    res.status(400);
    res.send({ code: 400, description: "Bad Request" });
  } finally {
    res.end();
  }
};

exports.getUpdateComment = (req, res) => res.render("updateComment");
exports.postUpdateComment = async (req, res) => {
  try {
    comment = await Comment.updateOne(
      { _id: req.body.comment_id },
      {
        text: req.body.text,
      }
    );
    res.send({ code: 200, description: "OK" });
  } catch (error) {
    console.log(error);
    res.send({ code: 400, description: "Bad Request" });
  }
};

exports.getLikeComment = (req, res) => res.render("likeComment");
exports.postLikeComment = async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.uid });
    const comment = await Comment.findById(req.body.comment_id);
    if (req.body.value == "1") {
      comment.like.push(user._id);
      comment.count_li += 1;
      comment.save();
    } else {
      comment.like.remove(user._id);
      comment.count_li -= 1;
      comment.save();
    }
    res.send({ code: 200, description: "OK" });
  } catch (error) {
    console.log(error);
    res.send({ code: 400, description: "Bad Request" });
  }
};

exports.getReadComment = (req, res) => res.render("readComment");
exports.postReadComment = async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.uid });
    if (req.body.choice == "1") {
      const order = await Order.findOne(
        { _id: req.body.taste_id },
        { comments: 1 }
      ).populate({
        path: "comments",
        options: { sort: { _id: -1 }, limit: 10 },
        populate: {
          path: "creator",
          select: {
            uid: 1,
            avatar: 1,
            firstName: 1,
            lastName: 1,
            nickname: 1,
          },
        },
      });

      let result = {};
      result.data = {};
      result.code = 200;
      result.description = "OK";
      result.data.comment = order.comments;
      result.data.login_id = user.id;
      res.send(result);
    } else if (req.body.choice == "2") {
      const order = await Order.findOne(
        { _id: req.body.taste_id },
        { comments: 1 }
      ).populate({
        path: "comments",
        match: { _id: { $lt: req.body.last_comment_id } },
        options: { sort: { _id: -1 } },
        populate: {
          path: "creator",
          select: {
            uid: 1,
            avatar: 1,
            firstName: 1,
            lastName: 1,
            nickname: 1,
          },
        },
      });
      let result = {};
      result.data = {};
      result.data.comment = [];
      for (var i in order.comments) {
        result.data.comment[i] = order.comments[i];
        if (i == 9) break;
      }

      // result.comment = order.comments;
      result.data.login_id = user.id;
      result.code = 200;
      result.description = "OK";
      res.send(result);
    }
  } catch (error) {
    console.log(error);
    res.send({ code: 400, description: "Bad Reauests" });
  }
};

exports.getReadReply = (req, res) => res.render("readReply");
exports.postReadReply = async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.uid });
    if (req.body.choice == "1") {
      const comment = await Comment.findOne({
        _id: req.body.comment_id,
      }).populate({
        path: "reply",
        options: { sort: { _id: -1 }, limit: 10 },
        populate: {
          path: "creator",
          select: {
            uid: 1,
            avatar: 1,
            firstName: 1,
            lastName: 1,
            nickname: 1,
          },
        },
      });
      let result = {};
      result.data = {};
      result.data.reply = comment.reply;
      result.data.login_id = user._id;
      result.code = 200;
      result.description = "OK";
      res.send(result);
    } else if (req.body.choice == "2") {
      const comment = await Comment.findOne({
        _id: req.body.comment_id,
      }).populate({
        path: "reply",
        match: { _id: { $lt: req.body.reply_id } },
        options: { sort: { _id: -1 } },
        populate: {
          path: "creator",
          select: {
            uid: 1,
            avatar: 1,
            firstName: 1,
            lastName: 1,
            nickname: 1,
          },
        },
      });
      let result = {};
      result.data = {};
      result.data.reply = [];
      for (var i in comment.reply) {
        result.data.reply[i] = comment.reply[i];
        if (i == 9) break;
      }
      result.data.login_id = user._id;
      result.code = 200;
      result.description = "OK";
      res.send(result);
    }
  } catch (error) {
    res.send({ code: 400, description: "Bad Request" });
    console.log(error);
  }
};

exports.getGoodbyeComment = (req, res) => res.render("goodbyeComment");
exports.postGoodbyeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.body.comment_id);
    const taste = await Order.findById(comment.order);

    taste.comments.remove(req.body.comment_id);
    taste.count_co -= 1 + comment.reply.length; // 매칭 되는 댓글 수(1) + 대댓글 수 만큼 감소
    taste.save();

    for (var i = 0; i < comment.reply.length; i++) {
      // 매칭되는 대댓글들 삭제
      await Comment.deleteOne({ _id: comment.reply[i] });
    }

    await Comment.deleteOne({ _id: req.body.comment_id }); // 해당 댓글 삭제
    res.send({ code: 200, description: "OK" });
  } catch (error) {
    console.log(error);
    res.send({ code: 400, description: "Bad Request" });
  }
};

// exports.getGoodbyeRecomment = (req, res) => res.render("goodbyeRecomment");
// exports.postGoodbyeRecomment = async (req, res) => {
//   try {
//     const comment = await Comment.findOne({ _id: req.body.comment_id });
//     comment.recomment.remove(req.body.recomment_id);
//     comment.count_reco -= 1;
//     comment.save();

//     const taste = await Order.findOne({ _id: comment.order });
//     taste.count_co -= 1;
//     taste.save();

//     await Recomment.deleteOne({ _id: req.body.recomment_id });

//     res.send({ code: 200, description: "OK" });
//   } catch (error) {
//     console.log(error);
//     res.send({ code: 400, description: "Bad Request" });
//   }
// };

// exports.getLikeRecomment = (req, res) => res.render("likeRecomment");
// exports.postLikeRecomment = async (req, res) => {
//   try {
//     const user = await User.findOne({ uid: req.uid });
//     const recomment = await Recomment.findById(req.body.recomment_id);
//     if (req.body.value == 1) {
//       recomment.like.push(user._id);
//       recomment.count_li += 1;
//       recomment.save();
//     } else {
//       recomment.like.remove(user._id);
//       recomment.count_li -= 1;
//       recomment.save();
//     }
//     res.send({ code: 200, description: "OK" });
//   } catch (error) {
//     console.log(error);
//     res.send({ code: 400, description: "Bad Request" });
//   }
// };

// exports.getAddRecomment = (req, res) => res.render("addRecomment");
// exports.postAddRecomment = async (req, res) => {
//   const user = await User.findOne({ uid: req.uid });
//   const {
//     body: { recomment },
//   } = req;
//   try {
//     const comment = await Comment.findById(req.body.comment_id).populate({
//       path: "creator",
//       select: { _id: 1, nickname: 1, pushToken: 1, locale: 1, uid: 1 },
//     });
//     const newRecomment = await Recomment.create({
//       text: recomment,
//       creator: user._id,
//     });
//     comment.recomment.push(newRecomment._id);
//     comment.count_reco += 1;
//     comment.save();

//     const order = await Order.findById(comment.order);
//     order.count_co += 1;
//     order.save();
//     i18n.initialize(comment.creator.locale || "en_US");
//     pushHandler.pushStack(
//       `${user.nickname}${i18n.t("님이 나의 댓글에 답글💬을 남겼어요")}`,
//       comment.creator._id,
//       user._id,
//       comment.order
//     );
//     if (comment.creator.pushToken && comment.creator.uid !== req.uid) {
//       pushHandler.sendPush(
//         comment.creator.pushToken,
//         `${user.nickname}${i18n.t("님이 나의 댓글에 답글💬을 남겼어요")}`,
//         { goto: "post", taste_id: comment.order }
//       );
//     }
//     res.send({ code: 200, description: "OK" });
//   } catch (error) {
//     console.log(error);
//     res.status(400);
//     res.send({ code: 400, description: "Bad Request" });
//   } finally {
//     res.end();
//   }
// };

// exports.getUpdateRecomment = (req, res) => res.render("updateRecomment");
// exports.postUpdateRecomment = async (req, res) => {
//   try {
//     await Comment.update({}, { $unset: { count_reco: 1 } }, { multi: true });
//     res.send({ code: 200, description: "OK" });
//   } catch (error) {
//     console.log(error);
//     res.send({ code: 400, description: "Bad Request" });
//   }
// };

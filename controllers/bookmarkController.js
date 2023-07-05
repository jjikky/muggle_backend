const routes = require("../routes");
const User = require("../models/User");
const Order = require("../models/order");
const Push = require("../models/Push");
const { json } = require("body-parser");
const { avatar, pushFlag, bookmark } = require("../routes");
const pushHandler = require("./pushHandler");
const i18n = require("../i18n/i18n");

exports.postBookmark = async (req, res) => {
  if (req.body.value == "1") {
    try {
      const user = await User.findOne({ uid: req.uid });
      user.bookmark.push(req.body.taste_id);
      user.save();

      const order = await Order.findById(req.body.taste_id).populate({path:'creator',select: { uid: 1, nickname: 1, pushToken: 1, locale: 1, avatar: 1 }});
      order.bookmark.push(user._id);
      order.count_bo += 1;
      order.save();
      i18n.initialize(order.creator.locale || 'en_US');
      pushHandler.pushStack(`${user.nickname}${i18n.t('님이 나의 게시글을 수집📥 했어요')}`, order.creator._id, user._id, order._id);
      if(order.creator.pushToken && order.creator.uid != req.uid){
        pushHandler.sendPush(
          order.creator.pushToken,
          `${user.nickname}${i18n.t('님이 나의 게시글을 수집📥 했어요')}`,
          {goto:'post',taste_id:req.body.taste_id})
      }
      res.send({ code: 200, description: "OK" });
    } catch (error) {
      console.log(error);
      res.send({ code: 400, description: "Bad Request" });
    }
  } else {
    try {
      const user = await User.findOne({ uid: req.uid });
      user.bookmark.remove(req.body.taste_id);
      user.save();

      const order = await Order.findById(req.body.taste_id);
      order.bookmark.remove(user._id);
      order.count_bo -= 1;
      order.save();
      res.send({ code: 200, description: "OK" });
    } catch (error) {
      console.log(error);
      res.send({ code: 400, description: "Bad Request" });
    }
  }
};

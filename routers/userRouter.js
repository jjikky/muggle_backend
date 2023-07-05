const express = require("express");
const routes = require("../routes");
const {
  getAvatar,
  postAvatar,
  getEditProfile,
  postEditProfile,
  getUserDetail,
  postUserDetail,
  getUserCollect,
  postUserCollect,
  getUserNext,
  postUserNext,
  getFollowList,
  postFollowList,
  getPushToken,
  postPushToken,
  getIdToPushToken,
  postIdToPushToken,
  getPushData,
  postPushData,
  getPushHistory,
  postPushHistory,
  getPushHistoryMore,
  postPushHistoryMore,
  getPushFlag,
  postPushFlag,
} = require("../controllers/userController");
const { getFile } = require("../controllers/tasteController");
const { verifyToken } = require("../controllers/credsHandler");

const userRouter = express.Router();

userRouter.get(routes.editProfile, getEditProfile);
userRouter.post(routes.editProfile, getFile.array("avatar"), postEditProfile);

userRouter.get(routes.avatar, getAvatar); // 미사용
userRouter.post(routes.avatar, getFile.array("avatar"), postAvatar); //미사용

userRouter.get(routes.followList, getFollowList);
userRouter.post(routes.followList, postFollowList);

userRouter.get(routes.userDetail, getUserDetail);
userRouter.post(routes.userDetail, postUserDetail);

userRouter.get(routes.userCollect, getUserCollect);
userRouter.post(routes.userCollect, postUserCollect);

userRouter.get(routes.userNext, getUserNext);
userRouter.post(routes.userNext, postUserNext);

userRouter.get(routes.pushToken, getPushToken);
userRouter.post(routes.pushToken, postPushToken);

userRouter.get(routes.idToPushToken, getIdToPushToken);
userRouter.post(routes.idToPushToken, postIdToPushToken);

userRouter.get(routes.pushData, getPushData);
userRouter.post(routes.pushData, postPushData);

userRouter.get(routes.pushHistory, getPushHistory);
userRouter.post(routes.pushHistory, postPushHistory);

userRouter.get(routes.pushHistoryMore, getPushHistoryMore);
userRouter.post(routes.pushHistoryMore, postPushHistoryMore);

userRouter.get(routes.pushFlag, getPushFlag);
userRouter.post(routes.pushFlag, postPushFlag);

userRouter.post(routes.creds, verifyToken);

module.exports = userRouter;

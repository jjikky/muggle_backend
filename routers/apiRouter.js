const express = require("express");
const {
  getFollow,
  postFollow,
  getTest,
  postTest,
  postTest2,
  getDeleteAvatarS3,
  getNicknameCheck,
  postNicknameCheck,
  postVersion,
  getVersion,
} = require("../controllers/userController");
const { verifyToken, revokeSession } = require("../controllers/credsHandler");
const routes = require("../routes");
const {uploadTaste} = require("../controllers/tasteUploadController");
const {
  othersTaste,
  getPostOthersTaste,
  postOthersTaste,
  getDeleteTasteImageS3,
  getBookmark,
  getLike,
  postLike,
  getGoodbyeTaste,
  postGoodbyeTaste,
  getGoodbyeUser,
  postGoodbyeUser,
  getReport,
  postReport,
  getSearch,
  postSearch,
  getHashtag,
  postHashtag,
  getHashtag2,
  postHashtag2,
} = require("../controllers/tasteController");
const {
  getLikeComment,
  postLikeComment,
  getGoodbyeComment,
  postGoodbyeComment,
} = require("../controllers/commentController");
const { postBookmark } = require("../controllers/bookmarkController");
const {
  upload,
  postDeleteTasteImageS3,
  postDeleteAvatarS3,
  postDeleteTasteImageOfUserS3,
  postDeleteAvatarOfUserS3,
} = require("../s3");
const {getMediaFile} = require("../controllers/mediaFileHandler");
const apiRouter = express.Router();

apiRouter.get(routes.test, getTest);
apiRouter.post(routes.test, getMediaFile.fields([{name: "media"}]), uploadTaste);
apiRouter.post(routes.login, verifyToken);
apiRouter.post(routes.logout, revokeSession);

apiRouter.get(routes.deleteTasteImage, getDeleteTasteImageS3);
apiRouter.post(routes.deleteTasteImage, postDeleteTasteImageS3); //update-taste 이전에 호출해야함,req는 json타입으로 받아

apiRouter.get(routes.deleteAvatar, getDeleteAvatarS3);
apiRouter.post(routes.deleteAvatar, postDeleteAvatarS3);

apiRouter.post(routes.othersTaste, othersTaste);

apiRouter.get(routes.postOthersTaste, getPostOthersTaste);
apiRouter.post(routes.postOthersTaste, postOthersTaste);

apiRouter.get(routes.search, getSearch);
apiRouter.post(routes.search, postSearch);

apiRouter.get(routes.like, getLike);
apiRouter.post(routes.like, postLike);

apiRouter.get(routes.likeComment, getLikeComment);
apiRouter.post(routes.likeComment, postLikeComment);

apiRouter.get(routes.bookmark, getBookmark);
apiRouter.post(routes.bookmark, postBookmark);

apiRouter.get(routes.follow, getFollow);
apiRouter.post(routes.follow, postFollow);

apiRouter.get(routes.nicknameCheck, getNicknameCheck);
apiRouter.post(routes.nicknameCheck, postNicknameCheck);

apiRouter.get(routes.goodbyeComment, getGoodbyeComment);
apiRouter.post(routes.goodbyeComment, postGoodbyeComment);

apiRouter.get(routes.goodbyeTaste, getGoodbyeTaste);
apiRouter.post(routes.goodbyeTaste, postGoodbyeTaste);

apiRouter.get(routes.goodbyeUser, getGoodbyeUser);
apiRouter.post(
  routes.goodbyeUser,
  postDeleteTasteImageOfUserS3,
  postDeleteAvatarOfUserS3,
  postGoodbyeUser
);

apiRouter.get(routes.report, getReport);
apiRouter.post(routes.report, postReport);

apiRouter.get(routes.hashtag, getHashtag);
apiRouter.post(routes.hashtag, postHashtag);
apiRouter.get(routes.hashtag2, getHashtag2);
apiRouter.post(routes.hashtag2, postHashtag2);

apiRouter.get(routes.version, getVersion);
apiRouter.post(routes.version, postVersion);

module.exports = apiRouter;

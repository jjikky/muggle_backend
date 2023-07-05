const express = require("express");
const routes = require("../routes");

const {
  getFile,
  getUploadTaste,
  postUploadTaste,
  getUpdateTaste,
  postUpdateTaste,
  getTasteDetail,
  postTasteDetail,
} = require("../controllers/tasteController");
const {
  getAddComment,
  postAddComment,
  getReadComment,
  postReadComment,
  getReadReply,
  postReadReply,
  getUpdateComment,
  postUpdateComment,
} = require("../controllers/commentController");
const { getRecentTastes } = require("../controllers/tasteListController");
const { upload } = require("../s3");

const tasteRouter = express.Router();

tasteRouter.get(routes.tasteDetail, getTasteDetail);
tasteRouter.post(routes.tasteDetail, postTasteDetail);

tasteRouter.get(routes.uploadTaste, getUploadTaste);
tasteRouter.post(routes.uploadTaste, getFile.array("image"), postUploadTaste); // form data로 받아야 파일 받을수있어 multer이 걸러서 나머지 바디로 줌

tasteRouter.get(routes.updateTaste, getUpdateTaste);
tasteRouter.post(routes.updateTaste, upload.single("image"), postUpdateTaste); // 이미지 업뎃 못함 추후 삭제하기

tasteRouter.get(routes.readComment, getReadComment);
tasteRouter.post(routes.readComment, postReadComment);

tasteRouter.get(routes.readReply, getReadReply);
tasteRouter.post(routes.readReply, postReadReply);

tasteRouter.get(routes.addComment, getAddComment);
tasteRouter.post(routes.addComment, postAddComment);

tasteRouter.get(routes.updateComment, getUpdateComment);
tasteRouter.post(routes.updateComment, postUpdateComment);

tasteRouter.post("/recent", getRecentTastes);

module.exports = tasteRouter;

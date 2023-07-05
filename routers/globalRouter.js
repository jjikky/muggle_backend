const express = require("express");
const routes = require("../routes");
const { home, search } = require("../controllers/tasteController");
const { getUserInfo, postUserInfo, getUserInfoDepth, postUserInfoDepth } = require("../controllers/userController");

const globalRouter = express.Router();

globalRouter.get(routes.home, home);
globalRouter.get(routes.search, search);

globalRouter.get(routes.userinfo, getUserInfo);
globalRouter.post(routes.userinfo, postUserInfo);   // save user information to mongo, when user sign in

globalRouter.get(routes.userinfoDepth, getUserInfoDepth);
globalRouter.post(routes.userinfoDepth, postUserInfoDepth);

module.exports = globalRouter;
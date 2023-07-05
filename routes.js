const HOME = "/"; // app.use
const USERINFO = "/getuserinfo";
const USERINFO_DEPTH = "/userinfo-depth";

// Users

const USERS = "/users"; // app.use
const EDIT_PROFILE = "/edit-profile";
const AVATAR = "/avatar"; //unused
const FOLLOW_LIST = "/follow-list";
const USER_DETAIL = "/user-detail";
const USER_COLLECT = "/user-collect";
const USER_NEXT = "/user-next";
const PUSH_TOKEN = "/push-token";
const IDTOPUSH_TOKEN = "/idtopush-token";
const PUSH_DATA = "/push-data";
const PUSH_HISTORY = "/push-history";
const PUSH_FLAG = "/push-flag";
const PUSH_HISTORY_MORE = "/push-history-more";
const CREDS = "/creds";

// Taste

const TASTE = "/taste"; // app.use
const UPLOAD_TASTE = "/upload-taste";
const UPDATE_TASTE = "/update-taste";
const TASTE_DETAIL = "/taste-detail";
const READ_COMMENT = "/read-comment";
const READ_REPLY = "/read-reply";
const ADD_COMMENT = "/add-comment";
const UPDATE_COMMENT = "/update-comment";
const HASH = "/hash";

// API
const API = "/api";
const TEST = "/test";
const LOGIN = "/login";
const LOGOUT = "/logout";
const OTHERS_TASTE = "/others-taste";
const POST_OTHERS_TASTE = "/post-others-taste";
const SEARCH = "/search";
const LIKE = "/like";
const LIKE_COMMENT = "/like-comment";
const BOOKMARK = "/bookmark";
const FOLLOW = "/follow";
const DELETE_TASTE_IMAGE = "/delete-taste-image";
const DELETE_AVATAR = "/delete-avatar";
const NICKNAME_CHECK = "/nickname-check";
const GOODBYE_COMMENT = "/goodbye-comment";
const GOODBYE_TASTE = "/goodbye-taste";
const GOODBYE_USER = "/goodbye-user";
const REPORT = "/report";
const HASHTAG = "/hashtag";
const HASHTAG2 = "/hashtag2";
const VERSION = "/version";

const routes = {
  login: LOGIN,
  logout: LOGOUT,
  home: HOME, // Global
  userinfo: USERINFO,
  userinfoDepth: USERINFO_DEPTH,
  users: USERS, // Users
  avatar: AVATAR,
  editProfile: EDIT_PROFILE,
  followList: FOLLOW_LIST,
  userDetail: USER_DETAIL,
  userCollect: USER_COLLECT,
  userNext: USER_NEXT,
  pushToken: PUSH_TOKEN,
  idToPushToken: IDTOPUSH_TOKEN,
  pushData: PUSH_DATA,
  pushHistory: PUSH_HISTORY,
  pushFlag: PUSH_FLAG,
  pushHistoryMore: PUSH_HISTORY_MORE,
  creds: CREDS,
  taste: TASTE, // Taste
  uploadTaste: UPLOAD_TASTE,
  updateTaste: UPDATE_TASTE,
  tasteDetail: TASTE_DETAIL,
  readComment: READ_COMMENT,
  readReply: READ_REPLY,
  addComment: ADD_COMMENT,
  updateComment: UPDATE_COMMENT,
  api: API, // API
  test: TEST,
  othersTaste: OTHERS_TASTE,
  postOthersTaste: POST_OTHERS_TASTE,
  search: SEARCH,
  bookmark: BOOKMARK,
  like: LIKE,
  likeComment: LIKE_COMMENT,
  follow: FOLLOW,
  deleteTasteImage: DELETE_TASTE_IMAGE,
  deleteAvatar: DELETE_AVATAR,
  nicknameCheck: NICKNAME_CHECK,
  goodbyeComment: GOODBYE_COMMENT,
  goodbyeTaste: GOODBYE_TASTE,
  goodbyeUser: GOODBYE_USER,
  report: REPORT,
  hashtag: HASHTAG,
  hashtag2: HASHTAG2,
  version: VERSION,
};

module.exports = routes;

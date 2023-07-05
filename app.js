const createError = require("http-errors");
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { localsMiddleware } = require("./middlewares");
const {getSessionUid} = require("./controllers/credsHandler");
const routes = require("./routes");
const userRouter = require("./routers/userRouter");
const tasteRouter = require("./routers/tasteRouter");
const globalRouter = require("./routers/globalRouter");
const apiRouter = require("./routers/apiRouter");
const path = require("path");
const {handleError} = require("./Exception");

const app = express();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(helmet());
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});
app.use(cors());
app.use(cookieParser());
app.use(bodyParser.json({ limit: 5000000 }));
app.use(
  bodyParser.urlencoded({
    limit: 5000000,
    extended: true,
    parameterLimit: 50000,
  })
);
app.use(morgan("dev"));

app.use(localsMiddleware);
app.use(getSessionUid);
app.use(routes.home, globalRouter);
app.use(routes.users, userRouter);
app.use(routes.taste, tasteRouter);
app.use(routes.api, apiRouter);
app.use(handleError);

app.use(express.static("public"));

app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;

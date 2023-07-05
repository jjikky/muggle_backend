const dotenv = require("dotenv");
require("./db");
require("./firebase.js");
const app = require("./app");
const http = require("http");
require("./s3");
dotenv.config();
require("./models/order");
require("./models/User");
require("./models/Comment");
require("./models/Recomment");
require("./models/Report");
require("./models/Hash");
require("./models/Push");
require("./models/Image");
require("./models/Search");

const PORT = process.env.PORT || "3000";
app.set("port", PORT);

const server = http.createServer(app);

const handleListening = function () {
  console.log(`✅ Listening on: http://localhost:${PORT}`);
};

server.listen(PORT, handleListening);

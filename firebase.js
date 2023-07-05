const admin = require("firebase-admin");
admin.initializeApp({
    credential: admin.credential.cert("./credentials/special-order-e82b5-firebase-adminsdk-rmkrt-c5d2d24bc1.json")
});

module.exports = admin;

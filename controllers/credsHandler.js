const routes = require("../routes");
const admin = require("../firebase");
const pushHandler = require("./pushHandler");

const asyncHandler = fn => (req, res, next) => {
    return Promise
        .resolve(fn(req, res, next))
        .catch(next);
};
exports.getSessionUid = asyncHandler(async (req, res, next) => {
    const sessionCookie = req.cookies.session || '';
    await admin
        .auth()
        .verifySessionCookie(sessionCookie, true /** checkRevoked */)
        .then((decodedClaims) => {
            if (decodedClaims.uid === req.cookies.uid) {
                req.uid = req.cookies.uid;
            }
            next();
        })
        .catch((error) => {
            next();
        });
})


exports.verifyToken = async (req, res) => {
    const expiresIn = 60 * 60 * 24 * 10 * 1000;
    await admin
        .auth()
        .verifyIdToken(req.body.idToken)
        .then(async (decodedToken) => {
            const uid = decodedToken.uid;
            if (new Date().getTime() / 1000 < decodedToken.exp && uid === req.body.uid) {
                await admin.auth().createSessionCookie(req.body.idToken, {expiresIn})
                    .then(
                        (sessionCookie) => {
                            const options = {maxAge: expiresIn};
                            res.cookie("session", sessionCookie, options);
                            res.cookie("uid", decodedToken.uid, options);
                            req.uid = decodedToken.uid;
                            req.body.pushToken && pushHandler.updatePushToken(req, res);
                            res.send({code: 200, description: "OK"});
                        },
                        (error) => {
                            console.log('authorize denied',req.body);
                            res.send({code: 400, description: "error"});
                        }
                    );
            } else {
                console.log('authorize denied',req.body);
                res.send({
                    code: 404,
                    description: "ExpiredToken",
                });
            }
        })
        .catch((error) => {
            console.log('authorize denied',req.body);
            res.send({code: 400, description: "error"})
        });
};
exports.revokeSession = async (req, res) => {
    const sessionCookie = req.cookies.session || '';
    req.body.pushToken && pushHandler.revokePushToken(req.body.pushToken);
    res.clearCookie('session');
    res.clearCookie('uid');
    admin
        .auth()
        .verifySessionCookie(sessionCookie)
        .then((decodedClaims) => {
            return admin.auth().revokeRefreshTokens(decodedClaims.sub);
        })
        .then(() => {
        })
        .catch((error) => {
        });
    res.send({code: 200, description: "OK"});
}

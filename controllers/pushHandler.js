const routes = require("../routes");
const User = require("../models/User");
const Order = require("../models/order");
const Push = require("../models/Push");
const {json} = require("body-parser");
const i18n = require("../i18n/i18n");
const admin = require("../firebase");

exports.updatePushToken = async (req, res) => {
    try {
        await User.updateOne(
            {uid: req.uid},
            {
                pushToken: req.body.pushToken,
                locale: req.body.locale
            }
        );
    } catch (error) {
        console.log(error);
    }
};

exports.sendPush = (registrationToken, bodyMessage, data) => {
    // if(registrationToken.isArray()) sendPushAll(registrationToken, bodyMessage, data);
    // else
    sendPush(registrationToken, bodyMessage, data);
};
const sendPush = (registrationToken, bodyMessage, data) => {
    const message = {
        data: data,
        notification: {
            title: i18n.t("🍽 머글에서 알림이 왔어요! 💌"),
            body: bodyMessage,
        },
        token: registrationToken
    };
    admin.messaging().send(message)
        .then((response) => {
            // Response is a message ID string.
            console.log('Successfully sent message:', response);
        })
        .catch((error) => {
            handlePushError(error, registrationToken);
        });
}

const sendPushAll = (registrationToken, bodyMessage, data) => {
    const messages = {
        data: data,
        notification: {
            title: i18n.t("🍽 머글에서 알림이 왔어요! 💌"),
            body: bodyMessage,
        },
        tokens: registrationToken
    };
    admin.messaging().sendMulticast(messages)
        .then((response) => {
            if (response.failureCount > 0) {
                const failedTokens = [];
                response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        handlePushError(resp.error, registrationToken[idx])
                    }
                });
            }
        })
}

const handlePushError = (error, pushToken) => {
    console.log('Error sending message:', error);
    switch (error.errorInfo.code) {
        case 'messaging/invalid-registration-token':
        case 'messaging/registration-token-not-registered':
            revokePushToken(pushToken);
    }
}

const revokePushToken = async (pushToken) => {
    try {
        await User.updateOne(
            {pushToken: pushToken},
            {
                pushToken: null,
                locale: null
            }
        );
    } catch (error) {
        console.log(error);
    }
}

exports.pushStack = (bodyMessage, recipient, sender_id, order) => {
    try {
        Push.create({
            title: i18n.t("🍽 머글에서 알림이 왔어요! 💌"),
            description: bodyMessage,
            recipient: recipient,
            sender_id: sender_id,
            order: order,
        }).then(doc => doc.save())
        User.updateMany({_id: recipient}, {pushFlag: 1});
    } catch (error) {
        console.log(error);
    }
}


exports.revokePushToken = revokePushToken;

const routes = require("../routes");
const User = require("../models/User");
const Order = require("../models/order");
const Comment = require("../models/Comment");
const Recomment = require("../models/Recomment");
const Report = require("../models/Report");
const Hash = require("../models/Hash");
const Image = require("../models/Image");
const Search = require("../models/Search");
const multer = require("multer");
const pushHandler = require("./pushHandler");
const i18n = require("../i18n/i18n");
const mongoose = require("mongoose");
const querystring = require('querystring');


exports.getRecentTastes = async (req, res) => {
    try {
        const taste_id = querystring.escape(req.body.taste_id);
        const size = parseInt(querystring.escape(req.body.size));
        const order = await Order.find(
            {delete_col: 0, _id: req.body.taste_id ? {$lt: taste_id} : {$ne: null}},
            {
                _id: 1,
                title: 1,
                count_co: 1,
                count_li: 1,
                count_bo: 1,
                image: 1,
                hash: 1,
                video_thumbnail: 1,
                thumbnail: {
                    $ifNull: [
                        '$thumbnail', '$video_thumbnail', {$arrayElemAt: ['$image', 0]}
                    ]
                },
                countFile: {$size: '$image'},
                createdAt: 1,
            }
        )
            .limit((size && size < 30) ? size : 10)
            .sort({_id: -1})
            .populate("creator", {uid: 1, avatar: 1, firstName: 1, lastName: 1});
        res.send({
            code: 200,
            description: "OK",
            data: order,
        });
    } catch (error) {
        console.log(error);
        res.send({code: 400, description: "Bad Request"});
    }
};

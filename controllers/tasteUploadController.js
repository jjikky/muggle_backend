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
const fs = require("fs");
const AWS = require("aws-sdk");
const ffmpeg = require("fluent-ffmpeg");
const {mime, ext} = require('./mediaTypes.js');
const path = require('path');
const {handleMediaFile} = require('./mediaFileHandler');
const {MugglException} = require("../Exception");


exports.uploadTaste = async (req, res, next) => {
    if(!req.uid){
        throw new MugglException('Permission Denied',{ code: 403, description: "Permission Denied" })
    }
    await handleMediaFile(req, res)
        .then(async files => {
            await insertTaste(req, res, files);
            res.send({code: 200, description: "OK"});
        })
        .catch(err => {
            if (err instanceof MugglException) {
                res.send(err.data);
            } else {
                console.log(err);
                res.send({code: 400, description: "Bad Request"});
            }
        });
}

const insertTaste = async (req, res, uploadedFile) => {
    try {
        const user = await User.findOne({ uid: req.uid });
        const hashArr = req.body.hash? req.body.hash.match(/(?<=#)[\p{L}|\p{N}]+(?=\s|#|$)/gu) : [];//hash.split("#");
        const set = new Set(hashArr); // 중복제거
        const uniqueHashArr = [...set]; // 중복제거
        // const coordinate = {latitude: req.body.latitude, longitude: req.body.longitude};
        // latitudeInfo = req.body.latitude.replace(/\s/g, ""); // 공백 제거
        // const latitudeInfoArr = latitudeInfo.split("#"); // # 기준으로 배열에 넣기
        // const filteredLatitudeInfo = latitudeInfoArr.filter((el) => el != "");
        //
        // longitudeInfo = req.body.longitude.replace(/\s/g, "");
        // const longitudeArr = longitudeInfo.split("#"); //
        // const filteredLongitudeInfo = longitudeArr.filter((el) => el != "");

        // const filtered = hashArr.filter((el) => el != "");
        if(uploadedFile.media) Image.insertMany(uploadedFile.media.map(url => ({image:url.location})));

        const order = await Order.create({
            title: req.body.title,
            description: req.body.description,
            hash: uniqueHashArr,
            link: req.body.link,
            creator: user._id,
            image: uploadedFile.media?uploadedFile.media.map(url => url.location):undefined,
            thumbnail: uploadedFile.thumbnail?uploadedFile.thumbnail[0].location:undefined,
            // location: req.body.location,
        }).then(doc => doc.save());

        if (req.body.hash) {
            await Hash.bulkWrite(uniqueHashArr.map(text => ({
                    updateOne: {
                        filter: {text: text},
                        update: [{
                            $set:
                                {
                                    count: {$sum: ['$count', 1]},
                                    order: {
                                        $concatArrays: [
                                            {$ifNull:['$order', []]},
                                            [mongoose.Types.ObjectId(order._id)],
                                        ]
                                    }
                                }
                        }],
                        upsert: true
                    }
                })
            ));
        }

    } catch (e) {
        console.log(e);
        throw new MugglException('S3 Error',{ code: 400, description: "Bad Request" });
    }
}




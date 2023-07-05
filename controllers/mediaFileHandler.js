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
const mongoose = require("mongoose");
const fs = require("fs");
const AWS = require("aws-sdk");
const ffmpeg = require("fluent-ffmpeg");
const {mime, ext} = require('./mediaTypes.js');
const path = require('path');
const {MugglException} = require("../Exception");


const s3 = new AWS.S3({
    accessKeyId: process.env.IAM_ID,
    secretAccessKey: process.env.IAM_SECRET,
});

exports.getMediaFile = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, "uploads/");
        },
        filename: function (req, file, cb) {
            cb(null, req.uid + "_" + file.originalname);
        },
    }),
    fileFilter: function (req, file, cb) {
        let ext = path.extname(file.originalname).toLowerCase();
        if (mime[ext] && mime[ext].includes(file.mimetype)) {
            return cb(null, true)
        }
        return cb(new Error('Wrong file type'));
    }
    // limits: { fileSize: 5 * 1024 * 1024 },
})
// const uploadMulter = getMediaFile.fields([{name: "media"}]);


const getVideoStream = async (path) => {
    const result = await probeMedia(path);
    if (result.err) throw {code: 400, description: "Bad Requestvs"}
    for (const stream of result.data.streams) {
        if (stream.codec_type === 'video') {
            return stream;
        }
    }
}

const probeMedia = async (path) => {
    return await new Promise((resolve, reject) => {
        ffmpeg.ffprobe(
            path,
            function (err, data) {
                // console.log(err,data);
                resolve({err, data});
            })
    });
}

const getVideoSize = async (path) => {
    const stream = await getVideoStream(path);
    return getSize(stream.width, stream.height, stream.rotation);
}

const getImageSize = async (filePath) => {
    console.log(filePath);
    let result = await probeMedia(filePath);
    // console.log(filePath, result);
    return getSize(result.data.streams[0].width, result.data.streams[0].height, result.data.streams[0].rotation);
}

const getSize = (width, height, rotation) => {
    let upperLength = width >= height ? width : height;
    let scaleRatio = upperLength > 1280 ? upperLength / 1280 : 1;
    switch (rotation % 360) {
        case 90:
        case -90:
        case 270:
        case -270:
            return `${height / scaleRatio}x${width / scaleRatio}`;
        default:
            return `${width / scaleRatio}x${height / scaleRatio}`;
    }
}

const resizeVideo = async (file) => {
    let size = await getVideoSize(file.path);
    let result = await new Promise((resolve, reject) => {
        let getFileTime = Date.now();
        ffmpeg(file.path)
            .output(
                `${file.destination}${getFileTime}_${size}_${file.filename}`
                // `uploads/${getFileTime}_${filename[0]}_600x600.${filename[1]}`
            )
            .size(size)
            .on("error", function (err) {
                console.log("An error occurred: " + err.message);
                resolve({err})
                // res.send({ code: 500, description: "Resizing Failed" });
            })
            .on('end', function (stdout, stderr) {
                uploadToS3(file.destination, `${getFileTime}_${size}_${file.filename}`, resolve, reject);
                // resolve({output:`${file.destination}${file.filename}`});
                // console.log('Transcoding succeeded !',stdout,stderr);
            })
            .run();
    })
    if (result.err) throw {code: 400, description: "Bad Requestv"};
    return result;
}

const resizeImage = async (file) => {
    let size = await getImageSize(file.path);

    let result = await new Promise((resolve, reject) => {
        let getFileTime = Date.now();
        ffmpeg(file.path)
            .output(
                `${file.destination}${getFileTime}_${size}_${file.filename}`
            )
            .size(size)
            .on("error", function (err) {
                console.log("An error occurred: " + err.message);
                resolve({err})
            })
            .on('end', function (stdout, stderr) {
                console.log('upload')
                uploadToS3(file.destination, `${getFileTime}_${size}_${file.filename}`, resolve, reject);
                console.log('end')
                // resolve({path:`${file.destination}${getFileTime}_${size}_${file.filename}`, filename:`${getFileTime}_${size}_${file.filename}`});
            })
            .run();
    })
    if (result.err) throw {code: 400, description: "Bad Requesti"};
    console.log('resolved', result);
    return result;
}

exports.testS3 = async(req, res) => {
    // try{

    // throw new MugglException('S3 Error',{ code: 400, description: "Bad Request" });
    // const files = await handleMediaFile(req, res)
    //     .catch(err => {
    //         if (err instanceof MugglException) {
    //             res.send(err.data);
    //         } else {
    //             console.log(err);
    //             res.send({code: 400, description: "Bad Request"});
    //         }
    //     });
    res.send(files);
}

const uploadToS3 = (destination, keyFile, resolve, reject) => {
    const folder = Math.random()
        .toString(36)
        .replace(/[^a-z]+/g, "")
        .substr(0, 6);
    const fileContent = fs.readFileSync(`${destination}${keyFile}`);
    const params = {
        Bucket: process.env.S3_BUCKET,
        Key: `${folder}/${keyFile}`,
        Body: fileContent,
        ACL: "public-read",
    };
    s3.upload(params, function (err, data) {

        if (err) {
            console.log(err);
            reject(new MugglException('S3 Upload Error',{ code: 500, description: "S3 Upload Error" }));
        } else if (data) {
            console.log("Upload Success", data.Location);
            resolve({location:data.Location,origin:`${destination}${keyFile}`});
        }

    });
}

const getThumbnail = async (req, file, origin) => {
    return await new Promise((resolve, reject) => {
        let getFileTime = Date.now();
        ffmpeg(origin) //클라이언트에서보낸 비디오저장경로
            .on("end", function () {
                console.log("4 : Screenshots taken");
                uploadToS3('uploads/thumbnails/', `${req.uid}${getFileTime}_${file.filename}.jpg`, resolve, reject);
            })
            .on("error", function (err) {
                console.log(err);
                reject(new MugglException('ffmpeg Error (thumbnail)',{ code: 400, description: "ffmpeg Error (thumbnail)" }));
            })
            .screenshots({
                count: 1,
                folder: "uploads/thumbnails",
                filename: `${req.uid}${getFileTime}_${file.filename}.jpg`,
            });
    });
}

exports.handleMediaFile = async (req, res) => {
    // await new Promise((resolve, reject) => {
    //     upload(req, res, function (err) {
    //         if (err instanceof multer.MulterError) {
    //             reject(err);
    //         } else if (err) {
    //             reject(err);
    //         }
    //         resolve();
    //     })
    // });
    let result = {};
    if (req.files['media']) {
        let promises = [];
        for (let i = 0; i < req.files['media'].length; i++) {
            let fileExt = path.extname(req.files['media'][i].originalname).toLowerCase();
            if (ext.image.includes(fileExt)) {

                promises.push(new Promise(resolve => resolve(resizeImage(req.files['media'][i]))));
            } else {
                promises.push(new Promise(resolve => resolve(resizeVideo(req.files['media'][i]))));
            }
        }
        result.media = await Promise.all(promises)
        let firstFileExt = path.extname(req.files['media'][0].originalname).toLowerCase();
        if (ext.video.includes(firstFileExt)) {
            result.thumbnail = await Promise.all([getThumbnail(req, req.files['media'][0], result.media[0].origin)])
        } else {
            result.thumbnail = result.media[0].location;
        }
    }
    return result;
}



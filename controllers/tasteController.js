const routes = require("../routes");
const User = require("../models/User");
const Order = require("../models/order");
const Report = require("../models/Report");
const Hash = require("../models/Hash");
const Image = require("../models/Image");
const Search = require("../models/Search");
const multer = require("multer");
const pushHandler = require("./pushHandler");
const i18n = require("../i18n/i18n");
const mongoose = require("mongoose");

exports.home = (req, res) => res.render("home");
exports.search = (req, res) => res.send("Search");

exports.getDeleteTasteImageS3 = (req, res) => res.render("deleteTasteImageS3");

exports.getFile = multer({
  // 여기서 저장할때도 특정값(date?  유저식별 값?)붙여야하는데 이값을 어떻게 아래로 전달? (안그러면 같은이름파일로 연속 두번 요청받았을때, 같은이름 파일이 있다면 파일을 하나 더 만들지 않아서 하나를 지우고 나면 다른 하나에서 에러 발생 가능성)
  // login_uid로 해놓았으나 나중에 err터질시 바꿀 것 (같은유저가 같은 이름의 파일을 1초(?) 안에 한번 올리고 다시올리는 행위가 가능하다면 err 발생 그 외에는 없음)
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
      cb(null, req.uid + "_" + file.originalname);
    },
  }),
  // limits: { fileSize: 5 * 1024 * 1024 },
});
exports.getUploadTaste = (req, res) => res.render("uploadTaste");
exports.postUploadTaste = async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.uid });
    if (req.files.length > 0) {
      var ffmpeg = require("fluent-ffmpeg");
      const fs = require("fs");
      const AWS = require("aws-sdk");
      const s3 = new AWS.S3({
        accessKeyId: process.env.IAM_ID,
        secretAccessKey: process.env.IAM_SECRET,
      });
      var firstFilename = req.files[0].originalname.split(".");

      latitudeInfo = req.body.latitude.replace(/\s/g, ""); // 공백 제거
      const latitudeInfoArr = latitudeInfo.split("#"); // # 기준으로 배열에 넣기
      const filteredLatitudeInfo = latitudeInfoArr.filter((el) => el != "");

      longitudeInfo = req.body.longitude.replace(/\s/g, "");
      const longitudeArr = longitudeInfo.split("#"); //
      const filteredLongitudeInfo = longitudeArr.filter((el) => el != "");

      dimensions = req.body.dimensions.replace(/\s/g, "");
      const dimensionsArr = dimensions.split("#"); //
      const filteredDimensions = dimensionsArr.filter((el) => el != "");

      loc = [];

      var size = "";
      var file_width = [];
      var file_height = [];
      file();

      async function file() {
        try {
          for (var i = 0; i < req.files.length; i++) {
            await fileInfo(i);
            await fileAsync(i);
            await Image.create({
              latitude: filteredLatitudeInfo[i],
              longitude: filteredLongitudeInfo[i],
              image: loc[i],
              file_width: file_width[i],
              file_height: file_height[i],
              dimensions: filteredDimensions[i],
            });
            if (i == req.files.length - 1) {
              if (req.body.hash) {
                hash = req.body.hash.replace(/\s/g, ""); // 공백 제거
                const hashArr = hash.split("#"); // # 기준으로 배열에 넣기
                const filtered = hashArr.filter((el) => el != "");
                if (mime[0] == "video") {
                  const order = await Order.create({
                    title: req.body.title,
                    description: req.body.description,
                    hash: filtered,
                    creator: user._id,
                    link: req.body.link,
                    image: loc,
                    video_thumbnail: thumbnailUrl,
                    location: req.body.location,
                  });
                  const set = new Set(filtered); // 중복제거
                  const uniqueHashArr = [...set]; // 중복제거
                  for (var i in uniqueHashArr) {
                    var aleady = await Hash.findOne({
                      text: `${uniqueHashArr[i]}`,
                    });
                    if (aleady) {
                      aleady.count += 1;
                      aleady.order.push(order._id);
                      aleady.save();
                    } else {
                      const newHash = await Hash.create({
                        text: uniqueHashArr[i],
                      });
                      newHash.order.push(order._id);
                      newHash.save();
                    }
                  }
                  user.order.push(order._id);
                  user.save();
                } else {
                  const order = await Order.create({
                    title: req.body.title,
                    description: req.body.description,
                    hash: filtered,
                    creator: user._id,
                    link: req.body.link,
                    image: loc,
                    location: req.body.location,
                  });
                  const set = new Set(filtered); // 중복제거
                  const uniqueHashArr = [...set]; // 중복제거
                  for (var i in uniqueHashArr) {
                    var aleady = await Hash.findOne({
                      text: `${uniqueHashArr[i]}`,
                    });
                    if (aleady) {
                      aleady.count += 1;
                      aleady.order.push(order._id);
                      aleady.save();
                    } else {
                      const newHash = await Hash.create({
                        text: uniqueHashArr[i],
                      });
                      newHash.order.push(order._id);
                      newHash.save();
                    }
                  }
                  user.order.push(order._id);
                  user.save();
                }
              } else {
                if (mime[0] == "video") {
                  const order = await Order.create({
                    title: req.body.title,
                    description: req.body.description,
                    link: req.body.link,
                    creator: user._id,
                    image: loc,
                    video_thumbnail: thumbnailUrl,
                    location: req.body.location,
                  });
                  user.order.push(order._id);
                  user.save();
                } else {
                  const order = await Order.create({
                    title: req.body.title,
                    description: req.body.description,
                    link: req.body.link,
                    creator: user._id,
                    image: loc,
                    location: req.body.location,
                  });
                  user.order.push(order._id);
                  user.save();
                }
              }
            }
          }
        } catch (err) {
          console.log(err);
        }
      }

      function fileInfo(i) {
        return new Promise((resolve) => {
          ffmpeg.ffprobe(
            `./uploads/${req.uid}_${req.files[i].originalname}`,
            function (err, metadata) {
              console.log(metadata, err, req.files[i]);
              if (metadata.streams[0].width) {
                if (metadata.streams[0].rotation == -90) {
                  filteredDimensions[i] = "h";
                }
                var w = metadata.streams[0].width;
                var h = metadata.streams[0].height;
                if (w > h) {
                  var height = (600 / w) * h;
                  file_height[i] = height.toFixed(0);
                  file_width[i] = 600;
                  size = "600x" + height.toFixed(0);
                } else if (h > w) {
                  var width = (600 / h) * w;
                  file_width[i] = width.toFixed(0);
                  file_height[i] = 600;
                  size = width.toFixed(0) + "x600";
                } else {
                  file_width[i] = 600;
                  file_height[i] = 600;
                  size = "600x600";
                  filteredDimensions[i] = "w";
                }
              } else if (metadata.streams[1].width) {
                if (metadata.streams[1].rotation == -90) {
                  filteredDimensions[i] = "h";
                }
                var w = metadata.streams[1].width;
                var h = metadata.streams[1].height;
                if (w > h) {
                  var height = (600 / w) * h;
                  file_height[i] = height.toFixed(0);
                  file_width[i] = 600;
                  size = "600x" + height.toFixed(0);
                } else if (h > w) {
                  var width = (600 / h) * w;
                  file_width[i] = width.toFixed(0);
                  file_height[i] = 600;
                  size = width.toFixed(0) + "x600";
                } else {
                  file_width[i] = 600;
                  file_height[i] = 600;
                  size = "600x600";
                  filteredDimensions[i] = "w";
                }
              }

              resolve(size);
            }
          );
        });
      }

      function fileAsync(i) {
        return new Promise(async (resolve) => {
          var filename = req.files[i].originalname.split(".");
          var getFileTime = Date.now();
          var folder = Math.random()
            .toString(36)
            .replace(/[^a-z]+/g, "")
            .substr(0, 6);
          loc[
            i
          ] = `https://tastenote.s3.ap-northeast-2.amazonaws.com/${folder}/${getFileTime}_${filename[0]}_600x600.${filename[1]}`;
          var filetype = req.files[i].mimetype.split("/"); // ex. image/jpeg
          var filename = req.files[i].originalname.split("."); //filename[0] : name , filename[1]: mimetype (ex. mp4)
          if (filetype[0] == "image") {
            await ffmpeg(`./uploads/${req.uid}_${req.files[i].originalname}`) // 파일 해상도 조정
              // Generate 720P video
              .output(
                `uploads/${getFileTime}_${filename[0]}_600x600.${filename[1]}`
              )
              .size(size)
              .on("error", function (err) {
                console.log("An error occurred: " + err.message);
                res.send({ code: 500, description: "Resizing Failed" });
              })
              .on("end", function () {
                // console.log(`${i}번째 가공파일 만들기 완료`);
                const uploadFile = (fileName) => {
                  const fileContent = fs.readFileSync(fileName);
                  const params = {
                    Bucket: process.env.S3_BUCKET,
                    Key: `${folder}/${getFileTime}_${filename[0]}_600x600.${filename[1]}`,
                    Body: fileContent,
                    ACL: "public-read",
                  };
                  s3.upload(params, function (err, data) {
                    // console.log(`${i}번째 파일 s3업로드`);
                    if (err) {
                      res.send({ code: 500, description: "S3 Upload Failed" });
                      throw err;
                    }
                  });
                };
                uploadFile(
                  `uploads/${getFileTime}_${filename[0]}_600x600.${filename[1]}`,
                  console.log("s3")
                );
                fs.unlinkSync(
                  `uploads/${getFileTime}_${filename[0]}_600x600.${filename[1]}`
                );
                fs.unlinkSync(
                  `./uploads/${req.uid}_${req.files[i].originalname}`
                );
              })
              .run();
          } else if (filetype[0] == "video") {
            ffmpeg(`./uploads/${req.uid}_${req.files[i].originalname}`)
              // Generate 720P video
              .output(
                `uploads/${getFileTime}_${filename[0]}_600x600.${filename[1]}`
              )
              .videoCodec("libx264")
              .size(size)
              .on("error", function (err) {
                console.log("An error occurred: " + err.message);
                res.send({ code: 500, description: "Resizing Failed" });
              })
              .on("progress", function (progress) {
                console.log("... frames: " + progress.frames);
              })
              .on("end", function () {
                // console.log(`${i}번째 가공파일 만들기 완료`);
                const uploadFile = (fileName) => {
                  const fileContent = fs.readFileSync(fileName);
                  const params = {
                    Bucket: process.env.S3_BUCKET,
                    Key: `${folder}/${getFileTime}_${filename[0]}_600x600.${filename[1]}`,
                    Body: fileContent,
                    ACL: "public-read",
                  };
                  s3.upload(params, function (err, data) {
                    console.log(`${i}번째 파일 s3업로드`);
                    if (err) {
                      res.send({ code: 500, description: "S3 Upload Failed" });
                      throw err;
                    }
                  });
                };
                uploadFile(
                  `uploads/${getFileTime}_${filename[0]}_600x600.${filename[1]}`
                );
                fs.unlinkSync(
                  `uploads/${getFileTime}_${filename[0]}_600x600.${filename[1]}`
                );
                //첫파일이 .mov로 끝나면 삭제 x 썸네일 자르고 삭제할거
                if (firstFilename[1] != "mov") {
                  fs.unlinkSync(
                    `./uploads/${req.uid}_${req.files[i].originalname}`
                  );
                }
              })
              .run();
          }
          resolve();
        });
      }

      var thumbnailUrl = "";
      var ext = req.files[0].originalname.split(".");
      var mime = req.files[0].mimetype.split("/");
      if (mime[0] == "video") {
        const AWS = require("aws-sdk");
        const s3 = new AWS.S3({
          accessKeyId: process.env.IAM_ID,
          secretAccessKey: process.env.IAM_SECRET,
        });
        const ffmpeg = require("fluent-ffmpeg");
        const fs = require("fs");
        var filePath = "";
        file_name = req.files[0].originalname.split(".");
        const local_fileName = `${Date.now()}_${file_name[0]}_thumbnail`;
        thumbnailUrl = `https://tastenote.s3.ap-northeast-2.amazonaws.com/${folder}/${local_fileName}.jpg`;
        //비디오 정보 가져오기

        const getThumbnailAndS3 = () => {
          ffmpeg(`./uploads/${req.uid}_${req.files[0].originalname}`) //클라이언트에서보낸 비디오저장경로
            .on("filenames", function (filenames) {
              //해당 url에있는 동영상을 밑에 스크린샷옵션을 기반으로
              //캡처한후 filenames라는 이름에 파일이름들을 저장
              filePath = "uploads/thumbnails/" + filenames[0];
            })
            .on("end", function () {
              console.log("4 : Screenshots taken");
              const uploadFile = (fileName) => {
                const fileContent = fs.readFileSync(fileName);
                const params = {
                  Bucket: process.env.S3_BUCKET,
                  Key: `uploads/${local_fileName}.jpg`, // .mp4와 같은이름으로 올리려고 local_fileName 사용안함
                  Body: fileContent,
                  ACL: "public-read",
                };
                s3.upload(params, function (err, data) {
                  if (err) {
                    res.send({
                      code: 500,
                      description: "Thumbnail Creation Failed",
                    });
                    throw err;
                  }
                });
              };
              uploadFile(
                `./uploads/thumbnails/${local_fileName}.jpg`,
                console.log("5 : s3 upload success")
              );
              //fileDuration :비디오 러닝타임
            })
            .on("error", function (err) {
              console.log(err);
            })
            .screenshots({
              count: 1,
              folder: "uploads/thumbnails",
              filename: `${local_fileName}.jpg`,
            });
        };

        // delete file  (push해보고 동시에 할때 안되면 수정)
        setTimeout(function () {
          fs.unlinkSync(`./uploads/thumbnails/${local_fileName}.jpg`);
        }, 6000);
        // var firstFilename = req.files[0].originalname.split(".");
        if (firstFilename[1] == "mov") {
          setTimeout(function () {
            // if문 첫파일로 걸고
            fs.unlinkSync(`./uploads/${req.uid}_${req.files[0].originalname}`);
          }, 6000);
        }
        getThumbnailAndS3();
      }
    } else {
      if (req.body.hash) {
        hash = req.body.hash.replace(/\s/g, ""); // 공백 제거
        const hashArr = hash.split("#"); // # 기준으로 배열에 넣기
        const filtered = hashArr.filter((el) => el != "");

        const order = await Order.create({
          title: req.body.title,
          description: req.body.description,
          hash: filtered,
          link: req.body.link,
          creator: user._id,
          location: req.body.location,
        });

        const set = new Set(filtered); // 중복제거
        const uniqueHashArr = [...set]; // 중복제거
        for (var i in uniqueHashArr) {
          var aleady = await Hash.findOne({ text: `${uniqueHashArr[i]}` });
          if (aleady) {
            aleady.count += 1;
            aleady.order.push(order._id);
            aleady.save();
          } else {
            const newHash = await Hash.create({
              text: uniqueHashArr[i],
            });
            newHash.order.push(order._id);
            newHash.save();
          }
        }

        user.order.push(order._id);
        user.save();
      } else {
        const order = await Order.create({
          title: req.body.title,
          description: req.body.description,
          link: req.body.link,
          creator: user._id,
          location: req.body.location,
        });
        user.order.push(order._id);
        user.save();
      }
    }
    res.send({ code: 200, description: "OK" });
  } catch (error) {
    console.log(error);
    res.send({ code: 400, description: "Bad Request" });
  }
};

exports.getUpdateTaste = (req, res) => res.render("updateTaste");
exports.postUpdateTaste = async (req, res) => {
  try {
    //// 기존 내용 삭제
    const order = await Order.findOne({ _id: req.body.taste_id });
    if (order.hash[0]) {
      for (var i in order.hash) {
        hash = await Hash.findOne({ text: order.hash[i] });
        hash.count -= 1;
        hash.order.remove(order._id);
        hash.save();
      }

      var count = order.hash.length; // for문 돌면서 배열의 길이가 줄어들어서, 여기서 고정
      for (var i = 0; i < count; i++) {
        await order.hash.remove(order.hash[0]);
      }
      order.save();
    }

    if (order.link) {
      await Order.updateOne(
        { _id: req.body.taste_id },
        { $unset: { link: order.link } }
      );
    }

    if (order.location) {
      await Order.updateOne(
        { _id: req.body.taste_id },
        { $unset: { location: order.location } }
      );
    }

    if (order.description) {
      await Order.updateOne(
        { _id: req.body.taste_id },
        { $unset: { description: order.description } }
      );
    }

    ///// 새로운 내용 추가
    if (req.file) {
      /// if user upload include image file
      await Order.updateOne(
        { _id: req.body.taste_id },
        {
          title: req.body.title,
          image: req.file.location,
        }
      );
      if (req.body.hash) {
        hash = req.body.hash.replace(/\s/g, ""); // 공백 제거
        const hashArr = hash.split("#"); // # 기준으로 배열에 넣기
        const filtered = hashArr.filter((el) => el != "");
        for (var j in filtered) {
          await order.hash.push(filtered[j]);
        }

        const set = new Set(filtered); // 중복제거
        const uniqueHashArr = [...set]; // 중복제거
        for (var i in uniqueHashArr) {
          var aleady = await Hash.findOne({ text: `${uniqueHashArr[i]}` });
          if (aleady) {
            aleady.count += 1;
            aleady.order.push(order._id);
            aleady.save();
          } else {
            const newHash = await Hash.create({
              text: uniqueHashArr[i],
            });
            newHash.order.push(order._id);
            newHash.save();
          }
        }

        order.save();
      }
      if (req.body.link) {
        await Order.updateOne(
          { _id: req.body.taste_id },
          { link: req.body.link }
        );
      }
      if (req.body.description) {
        await Order.updateOne(
          { _id: req.body.taste_id },
          { description: req.body.description }
        );
      }
    } else {
      await Order.updateOne(
        { _id: req.body.taste_id },
        {
          title: req.body.title,
        }
      );
      if (req.body.hash) {
        hash = req.body.hash.replace(/\s/g, ""); // 공백 제거
        const hashArr = hash.split("#"); // # 기준으로 배열에 넣기
        const filtered = hashArr.filter((el) => el != "");
        for (var j in filtered) {
          await order.hash.push(filtered[j]);
        }

        const set = new Set(filtered); // 중복제거
        const uniqueHashArr = [...set]; // 중복제거
        for (var i in uniqueHashArr) {
          var aleady = await Hash.findOne({ text: `${uniqueHashArr[i]}` });
          if (aleady) {
            aleady.count += 1;
            aleady.order.push(order._id);
            aleady.save();
          } else {
            const newHash = await Hash.create({
              text: uniqueHashArr[i],
            });
            newHash.order.push(order._id);
            newHash.save();
          }
        }
        order.save();
      }
      if (req.body.link) {
        await Order.updateOne(
          { _id: req.body.taste_id },
          { link: req.body.link }
        );
      }
      if (req.body.description) {
        await Order.updateOne(
          { _id: req.body.taste_id },
          { description: req.body.description }
        );
      }
      if (req.body.location) {
        await Order.updateOne(
          { _id: req.body.taste_id },
          { location: req.body.location }
        );
      }
    }
    res.send({ code: 200, description: "OK" });
  } catch (error) {
    console.log(error);
    res.send({ code: 400, description: "Bad Request" });
  }
};

exports.getTasteDetail = async (req, res) => res.render("tasteDetail");
exports.postTasteDetail = async (req, res) => {
  try {
    const order = await Order.aggregate([
      {
        $match: {
          _id: mongoose.Types.ObjectId(req.body.taste_id),
          delete_col: 0,
        },
      },
      {
        $lookup: {
          from: "users",
          let: {
            creatorid: "$creator",
          },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$creatorid"] },
              },
            },
            {
              $project: {
                uid: 1,
                avatar: 1,
                firstName: 1,
                lastName: 1,
              },
            },
          ],
          as: "creator",
        },
      },
      {
        $unwind: {
          path: "$creator",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users", // collection name in db
          let: {
            bookmarkId: "$bookmark",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$uid", req.uid] },
                    { $in: ["$_id", "$$bookmarkId"] },
                  ],
                },
              },
            },
            {
              $project: {
                uid: 1,
                avatar: 1,
                firstName: 1,
                lastName: 1,
              },
            },
          ],
          as: "bookmarkEntries",
        },
      },
      {
        $lookup: {
          from: "users",
          let: {
            likeId: "$like",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$uid", req.uid] },
                    { $in: ["$_id", "$$likeId"] },
                  ],
                },
              },
            },
          ],
          as: "likeEntries",
        },
      },
      {
        $lookup: {
          from: "images",
          let: {
            uri: "$image",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ["$image", "$$uri"],
                },
              },
            },
            {
              $sort: {
                _id: 1,
              },
            },
            {
              $project: {
                width: "$file_width",
                height: "$file_height",
                uri: "$image",
                dimensions: 1,
                _id: 0,
              },
            },
          ],
          as: "image",
        },
      },
      {
        $addFields: {
          bookmarkStatus: {
            $gt: [
              {
                $arrayElemAt: ["$bookmarkEntries", 0],
              },
              null,
            ],
          },
          likeStatus: {
            $gt: [
              {
                $arrayElemAt: ["$likeEntries", 0],
              },
              null,
            ],
          },
        },
      },
      {
        $project: {
          bookmarkEntries: 0,
          bookmark: 0,
          likeEntries: 0,
          like: 0,
          delete_col: 0,
          __v: 0,
          comments: 0,
        },
      },
    ]).then((result) => result[0]);
    const result = { data: { ...order } };
    if (order) {
      result.code = 200;
      result.description = "OK";
    } else {
      result.code = 404;
      result.description = "Not Found";
    }
    res.send(result);
  } catch (error) {
    console.log(error);
    res.send({ code: 400, description: "Bad Request" });
  }
};

exports.othersTaste = async (req, res) => {
  try {
    let result = [];
    const order = await Order.find(
      { delete_col: 0 },
      {
        _id: 1,
        title: 1,
        count_co: 1,
        count_li: 1,
        count_bo: 1,
        image: 1,
        hash: 1,
        video_thumbnail: 1,
        createdAt: 1,
      }
    )
      .limit(10)
      .sort({ _id: -1 })
      .populate("creator", { uid: 1, avatar: 1, firstName: 1, lastName: 1 });

    for (var i in order) {
      result[i] = {};
      result[i].hash = order[i].hash;
      result[i].count_li = order[i].count_li;
      result[i].count_bo = order[i].count_bo;
      result[i].count_co = order[i].count_co;
      if (order[i].video_thumbnail) {
        result[i].video_thumbnail = order[i].video_thumbnail;
      } else {
        if (order[i].image[0]) {
          result[i].image = order[i].image[0];
        }
      }
      if (order[i].image[0]) {
        result[i].count_file = order[i].image.length;
      }
      result[i]._id = order[i]._id;
      result[i].title = order[i].title;
      result[i].creator = order[i].creator;
      result[i].createdAt = order[i].createdAt;
    }
    res.send(result);
  } catch (error) {
    console.log(error);
  }
};

exports.getPostOthersTaste = (req, res) => res.render("postOthersTaste");
exports.postOthersTaste = async (req, res) => {
  try {
    const count = req.body.taste_id;
    let result = [];
    const order = await Order.find(
      { delete_col: 0, _id: { $lt: `${count}` } },
      {
        _id: 1,
        title: 1,
        count_co: 1,
        count_li: 1,
        count_bo: 1,
        image: 1,
        hash: 1,
        video_thumbnail: 1,
        createdAt: 1,
      }
    )
      .limit(10)
      .sort({ _id: -1 })
      .populate("creator", { uid: 1, avatar: 1, firstName: 1, lastName: 1 });

    for (var i in order) {
      result[i] = {};
      result[i].hash = order[i].hash;
      result[i].count_li = order[i].count_li;
      result[i].count_bo = order[i].count_bo;
      result[i].count_co = order[i].count_co;
      if (order[i].video_thumbnail) {
        result[i].video_thumbnail = order[i].video_thumbnail;
      } else {
        if (order[i].image[0]) {
          result[i].image = order[i].image[0];
        }
      }
      if (order[i].image[0]) {
        result[i].count_file = order[i].image.length;
      }
      result[i]._id = order[i]._id;
      result[i].title = order[i].title;
      result[i].creator = order[i].creator;
      result[i].createdAt = order[i].createdAt;
    }
    res.send(result);
  } catch (error) {
    console.log(error);
    res.send({ code: 400, description: "Bad Request" });
  }
};
exports.getLike = (req, res) => res.render("like");
exports.postLike = async (req, res) => {
  if(!req.uid){
    return res.send({ code: 403, description: "Permission Denied" });
  }
  const uid = req.uid;
    try {
      const user = await User.aggregate(
          [
            {$match: {uid:uid, delete_col:0}},
            {
              $lookup: {
                from: "orders",
                as: "targetOrder",
                pipeline: [
                  {
                    $match: {
                      $expr:
                          {
                            $and: [
                              {$eq: ["$_id", mongoose.Types.ObjectId(req.body.taste_id)]},
                              {$eq: ["$delete_col", 0]},
                            ],
                          }
                    },
                  },
                  {
                    $lookup: {
                      from: "users",
                      let: {
                        creatorId: "$creator",
                      },
                      as: "creator",
                      pipeline: [
                        {
                          $match: {
                            $expr: { $eq: ["$_id", "$$creatorId"] },
                          },
                        },
                        {
                          $project: {
                            _id:1,
                            nickname: 1,
                            pushToken: 1,
                            locale: 1,
                            avatar: 1,
                            firstName: 1,
                            lastName: 1,
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
            {
              $unwind: {
                path: "$targetOrder",
                preserveNullAndEmptyArrays: true,
              }
            },
            {
              $project: {
                _id:1, nickname: 1, pushToken: 1, locale: 1, uid: 1, targetOrder: 1
              }
            }
          ],
      )
          .then(res=>{console.log(res);return res[0]});
      const {targetOrder} = user;
      console.log(user,targetOrder);
      if(!user || !targetOrder)return res.send({
        code: 404,
        description: "Not Found",
      })
      console.log(mongoose.Types.ObjectId(user._id));
      const result = await Promise.all([
        Order.updateOne(
            {_id:req.body.taste_id, delete_col:0},
            [{
              $set: {
                count_li: {
                  $sum:[
                      '$count_li',
                    {$cond: req.body.likeStatus?{
                      if: {$not: {$in: [mongoose.Types.ObjectId(user._id), "$like"]}},
                        then: 1,
                        else: 0
                    }:{
                      if: {$in: [mongoose.Types.ObjectId(user._id), "$like"]},
                        then: -1,
                        else: 0
                    }}
                  ]
                },
                like: req.body.likeStatus?
                    {
                      $concatArrays: [
                        '$like',
                        {
                          $cond:
                              {
                                if: {$not: {$in: [mongoose.Types.ObjectId(user._id), "$like"]}},
                                then: [user._id],
                                else: []
                              }
                        },
                      ]
                    }:{
                      $filter: {
                        input: "$like",
                        as: "likeUser",
                        "cond": {
                          $ne: [
                            "$$likeUser",
                            mongoose.Types.ObjectId(user._id)
                          ]
                        }
                      }
                    }
              }
            }]
        )
          ,
        User.updateOne(
            {uid:req.uid, delete_col:0},
            [{
              $set: {
                like: req.body.likeStatus?
                    {
                      $concatArrays: [
                        '$like',
                        {
                          $cond:
                              {
                                if: {$not: {$in: [targetOrder._id, "$like"]}},
                                then: [targetOrder._id],
                                else: []
                              }
                        },
                      ]
                    }:{
                      $filter: {
                        input: "$like",
                        as: "likeOrder",
                        "cond": {
                          $ne: [
                            "$$likeOrder",
                            targetOrder._id
                          ]
                        }
                      }
                    }
              }
            }]
        )
          ]
      )
      res.send({ code: 200, description: "OK", likeStatus: req.body.likeStatus});
        i18n.initialize(targetOrder.creator.locale || "en_US");
        pushHandler.pushStack(
            `${user.nickname}${i18n.t("님이 나의 게시글에 좋아요💖를 눌렀어요")}`,
            targetOrder.creator._id,
            user._id,
            targetOrder._id
        );
        if (targetOrder.creator.pushToken && targetOrder.creator.uid !== req.uid) {
          pushHandler.sendPush(
              targetOrder.creator.pushToken,
              `${user.nickname}${i18n.t("님이 나의 게시글에 좋아요💖를 눌렀어요")}`,
              { goto: "post", taste_id: req.body.taste_id }
          );
        }
    } catch (error) {
      console.log(error);
      res.send({
        code: 400,
        description: "Bad Request",
      });
    }
    // try {
    //   const user = await User.findOne({ uid: req.uid });
    //   user.like.remove(req.body.taste_id);
    //   user.save();
    //
    //   const order = await Order.findById(req.body.taste_id);
    //   order.like.remove(user._id);
    //   order.count_li -= 1;
    //   order.save();
    //   res.send({ code: 200, description: "OK", requid: uid || null });
    // } catch (error) {
    //   console.log(error);
    //   res.send({
    //     code: 400,
    //     description: "Bad Request",
    //     requid: uid || null,
    //     error: error,
    //   });
    // }
};

exports.getBookmark = (req, res) => res.render("bookmark");

exports.getGoodbyeTaste = (req, res) => res.render("goodbyeTaste");
exports.postGoodbyeTaste = async (req, res) => {
  // user db like, bookmark에서 지우기
  // 댓글 대댓글 삭제
  // creator로 작성자 찾아서 order array에서 해당 글 지우기
  // 게시물 delete_col 변경
  const taste = await Order.findById(req.body.taste_id);
  try {
    for (var i in taste.like) {
      // delete like from user
      user = await User.findOne({ _id: taste.like[i] });
      user.like.remove(req.body.taste_id);
      user.save();
    }

    for (var i in taste.bookmark) {
      // delete bookmark from user
      user = await User.findOne({ _id: taste.bookmark[i] });
      user.bookmark.remove(req.body.taste_id);
      user.save();
    }

    for (var i in taste.hash) {
      let hash = await Hash.findOne({ text: taste.hash[i] });
      hash.count -= 1;
      hash.order.remove(req.body.taste_id);
      hash.save();
    }

    for (var i in taste.comments) {
      // delete comment and recomment
      comment = await Comment.findOne({ _id: taste.comments[i] });
      for (var j in comment.reply) {
        await Comment.deleteOne({ _id: comment.reply[j] });
      }
      await Comment.deleteOne({ _id: taste.comments[i] });
    }

    const creator = await User.findOne({ _id: taste.creator });
    creator.order.remove(req.body.taste_id);
    creator.save();

    await Order.updateOne(
      { _id: req.body.taste_id },
      {
        $unset: {
          bookmark: "",
          count_bo: "",
          like: "",
          count_li: "",
          comments: "",
          count_co: "",
        },
        delete_col: 1,
      }
    );

    res.send({ code: 200, description: "OK" });
  } catch (error) {
    console.log(error);
    res.send({ code: 400, description: "Bad Request" });
  }
}; // user 삭제는 위에꺼 활용 해보잣

exports.getGoodbyeUser = (req, res) => res.render("goodbyeUser");
exports.postGoodbyeUser = async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.uid });

    /**********************유저가 작성한 게시글 삭제***********************/
    for (var t in user.order) {
      var taste = await Order.findById(user.order[t]);

      for (var i in taste.like) {
        // delete like from user
        userlike = await User.findOne({ _id: taste.like[i] });
        userlike.like.remove(user.order[t]);
        userlike.save();
      }

      for (var i in taste.bookmark) {
        // delete bookmark from user
        userbookmark = await User.findOne({ _id: taste.bookmark[i] });
        userbookmark.bookmark.remove(user.order[t]);
        userbookmark.save();
      }

      for (var i in taste.comments) {
        // delete comment and recomment
        comment = await Comment.findOne({ _id: taste.comments[i] });
        for (var j in comment.reply) {
          await Comment.deleteOne({ _id: comment.reply[j] });
        }
        await Comment.deleteOne({ _id: taste.comments[i] });
      }

      await Order.updateOne(
        { _id: user.order[t] },
        {
          delete_col: 1,
          $unset: {
            bookmark: "",
            count_bo: "",
            like: "",
            count_li: "",
            comments: "",
            count_co: "",
          },
        }
      );
    }

    /**************유저가 한 bookmark, like 삭제 ***************/
    for (var b in user.bookmark) {
      // bookmark한 게시물의 bookmark arr에서 해당 유저 아이디 삭제
      order = await Order.findById(user.bookmark[b]);
      order.bookmark.remove(user._id);
      order.count_bo -= 1;
      order.save();
    }

    for (var l in user.like) {
      // like한 게시물의 like arr에서 해당 유저 아이디 삭제
      order = await Order.findById(user.like[l]);
      order.like.remove(user._id);
      order.count_li -= 1;
      order.save();
    }

    /*********************팔로워 팔로잉 삭제 ***********************/
    for (var follower in user.follower) {
      // 해당 유저를 팔로우하는 유저의 following arr 에서 해당 유저 아이디 삭제
      user_follower = await User.findById(user.follower[follower]);
      user_follower.following.remove(user._id);
      user_follower.save();
    }

    for (var following in user.following) {
      // 해당 유저가 팔로우하는 유저의 follower arr 에서 해당 유저 아이디 삭제
      user_following = await User.findById(user.following[following]);
      user_following.follower.remove(user._id);
      user_following.save();
    }

    await User.updateOne(
      { uid: req.uid },
      {
        $unset: {
          order: "",
          bookmark: "",
          like: "",
          follower: "",
          following: "",
        },
        delete_col: 1,
      }
    );
    // avatar삭제는 postDeleteavatarS3 사용
    res.send({ code: 200, description: "OK" });
  } catch (error) {
    console.log(error);
    res.send({ code: 400, description: "Bad Request" });
  }
};

exports.getReport = (req, res) => res.render("report");
exports.postReport = async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.uid });
    await Report.create({
      order: req.body.taste_id,
      text: req.body.text,
      reporter: user._id,
    });
    res.send({ code: 200, description: "OK" });
  } catch (error) {
    console.log(error);
    res.send({ code: 400, description: "Bad Request" });
  }
};
exports.getSearch = (req, res) => res.render("search");
exports.postSearch = async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.uid }, { _id: 1 });

    const search = await Search.findOne({
      text: req.body.search,
      delete_col: 0,
    });

    if (search) {
      search.count += 1;
      search.info.user.push(user._id);
      search.info.searchAt.push(Date.now());

      search.save();
    } else {
      await Search.create({
        text: req.body.search,
        info: {
          user: user._id,
        },
      });
    }

    if (req.body.value == "1") {
      // all
      const tags = await Hash.find(
        {
          text: { $regex: req.body.search, $options: "i" },
          count: { $gt: 0 },
        },
        { text: 1, count: 1 }
      );

      const user_nickname = await User.find(
        // (100,110,101,111)
        {
          nickname: { $regex: req.body.search, $options: "i" }, // n in i
          delete_col: 0,
        },
        {
          avatar: 1,
          nickname: 1,
          firstName: 1,
          lastName: 1,
          intro: 1,
          uid: 1,
        }
      );

      const user_firstName = await User.find(
        // (010)(011)
        {
          firstName: { $regex: req.body.search, $options: "i" }, // f in i
          nickname: { $not: { $regex: req.body.search, $options: "i" } }, // n not in i
          delete_col: 0,
        },
        {
          avatar: 1,
          nickname: 1,
          firstName: 1,
          lastName: 1,
          intro: 1,
          uid: 1,
        }
      );

      const user_lastName = await User.find(
        // (001)
        {
          lastName: { $regex: req.body.search, $options: "i" }, // l in i
          nickname: { $not: { $regex: req.body.search, $options: "i" } }, // n not in i
          firstName: { $not: { $regex: req.body.search, $options: "i" } }, // f not in i
          delete_col: 0,
        },
        {
          avatar: 1,
          nickname: 1,
          firstName: 1,
          lastName: 1,
          intro: 1,
          uid: 1,
        }
      );

      const result = {};
      result.tags = tags;
      result.user_filter1 = user_nickname;
      result.user_filter2 = user_firstName;
      result.user_filter3 = user_lastName;

      res.send(result);
    } else if (req.body.value == "2") {
      //tags
      const result = await Hash.find(
        {
          text: { $regex: req.body.search, $options: "i" },
          count: { $gt: 0 },
        },
        { text: 1, count: 1 }
      );
      res.send(result);
    } else if (req.body.value == "3") {
      const user_nickname = await User.find(
        // (100,110,101,111)
        {
          nickname: { $regex: req.body.search, $options: "i" }, // n in i
          delete_col: 0,
        },
        {
          avatar: 1,
          nickname: 1,
          firstName: 1,
          lastName: 1,
          intro: 1,
          uid: 1,
        }
      );

      const user_firstName = await User.find(
        // (010)(011)
        {
          firstName: { $regex: req.body.search, $options: "i" }, // f in i
          nickname: { $not: { $regex: req.body.search, $options: "i" } }, // n not in i
          delete_col: 0,
        },
        {
          avatar: 1,
          nickname: 1,
          firstName: 1,
          lastName: 1,
          intro: 1,
          uid: 1,
        }
      );

      const user_lastName = await User.find(
        // (001)
        {
          lastName: { $regex: req.body.search, $options: "i" }, // l in i
          nickname: { $not: { $regex: req.body.search, $options: "i" } }, // n not in i
          firstName: { $not: { $regex: req.body.search, $options: "i" } }, // f not in i
          delete_col: 0,
        },
        {
          avatar: 1,
          nickname: 1,
          firstName: 1,
          lastName: 1,
          intro: 1,
          uid: 1,
        }
      );
      const result = {};
      result.user_filter1 = user_nickname;
      result.user_filter2 = user_firstName;
      result.user_filter3 = user_lastName;

      res.send(result);
    }
  } catch (error) {
    console.log(error);
  }
};

exports.getHashtag = (req, res) => {
  res.render("hashtag");
};
exports.postHashtag = async (req, res) => {
  // indexing으로 속도 높이던지, order로 찾지말고 hash로 찾아서 order 뿌려주기
  try {
    let result = [];
    const order = await Order.find(
      { hash: req.body.hash, delete_col: 0 },
      {
        _id: 1,
        title: 1,
        count_co: 1,
        count_li: 1,
        count_bo: 1,
        image: 1,
        hash: 1,
        createdAt: 1,
        video_thumbnail: 1,
      }
    )
      .limit(10)
      .sort({ _id: -1 })
      .populate("creator", { uid: 1, avatar: 1, firstName: 1, lastName: 1 });
    for (var i in order) {
      result[i] = {};
      result[i].hash = order[i].hash;
      result[i].count_li = order[i].count_li;
      result[i].count_bo = order[i].count_bo;
      result[i].count_co = order[i].count_co;
      if (order[i].video_thumbnail) {
        result[i].video_thumbnail = order[i].video_thumbnail;
      } else {
        if (order[i].image[0]) {
          result[i].image = order[i].image[0];
        }
      }
      if (order[i].image[0]) {
        result[i].count_file = order[i].image.length;
      }
      result[i]._id = order[i]._id;
      result[i].title = order[i].title;
      result[i].creator = order[i].creator;
      result[i].createdAt = order[i].createdAt;
    }
    res.send(result);
  } catch (error) {
    console.log(error);
  }
};
exports.getHashtag2 = async (req, res) => {
  res.render("hashtag2");
};
exports.postHashtag2 = async (req, res) => {
  // indexing으로 속도 높이던지, order로 찾지말고 hash로 찾아서 order 뿌려주기
  try {
    let result = [];
    const count = req.body.taste_id;
    const order = await Order.find(
      {
        hash: req.body.hash,
        delete_col: 0,
        _id: { $lt: `${count}` },
      },
      {
        _id: 1,
        title: 1,
        count_co: 1,
        count_li: 1,
        count_bo: 1,
        image: 1,
        hash: 1,
        createdAt: 1,
        video_thumbnail: 1,
      }
    )
      .limit(10)
      .sort({ _id: -1 })
      .populate("creator", { uid: 1, avatar: 1, firstName: 1, lastName: 1 });
    for (var i in order) {
      result[i] = {};
      result[i].hash = order[i].hash;
      result[i].count_li = order[i].count_li;
      result[i].count_bo = order[i].count_bo;
      result[i].count_co = order[i].count_co;
      if (order[i].video_thumbnail) {
        result[i].video_thumbnail = order[i].video_thumbnail;
      } else {
        if (order[i].image[0]) {
          result[i].image = order[i].image[0];
        }
      }
      if (order[i].image[0]) {
        result[i].count_file = order[i].image.length;
      }
      result[i]._id = order[i]._id;
      result[i].title = order[i].title;
      result[i].creator = order[i].creator;
      result[i].createdAt = order[i].createdAt;
    }
    res.send(result);
  } catch (error) {
    console.log(error);
  }
};

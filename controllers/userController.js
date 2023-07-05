const routes = require("../routes");
const User = require("../models/User");
const Order = require("../models/order");
const Push = require("../models/Push");
const { json } = require("body-parser");
const { avatar, pushFlag, bookmark } = require("../routes");
const pushHandler = require("./pushHandler");
const i18n = require("../i18n/i18n");
const mongoose = require("mongoose");

exports.getUserInfo = (req, res) => res.render("getUserinfo");
exports.postUserInfo = (req, res) => {
  try {
    const low_nickname = req.body.nickname.toLowerCase();
    User.create({
      phoneNumber: req.body.phoneNumber,
      uid: req.uid,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      nickname: low_nickname,
    });
    res.send({ code: 200, description: "OK" });
  } catch (error) {
    res.send({ code: 400, description: "Bad Request" });
  }
};

exports.getUserInfoDepth = (req, res) => res.render("userinfoDepth");
exports.postUserInfoDepth = async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.uid });
    if (user)
      res.send({
        code: 200,
        description: "OK",
        data: { data_code: 200, data_description: "registered user" },
      });
    else
      res.send({
        code: 200,
        description: "OK",
        data: { data_code: 404, data_description: "unregistered user" },
      });
  } catch (error) {
    res.send({ code: 400, description: "Bad Request" });
  }
};

exports.getFollow = (req, res) => res.render("follow");
exports.postFollow = async (req, res) => {
  if(!req.uid){
    return res.send({ code: 403, description: "Permission Denied" });
  }
  try {
    const users = await User.find({uid: {$in: [req.uid, req.body.uid]}});
    if (users.length !== 2) {
      return res.send({code: 404, description: "Not Found"});
    }
    let fromUser = users[0].uid === req.uid ? users[0] : users[1];
    let toUser = users[0].uid !== req.uid ? users[0] : users[1];

    await User.updateMany({uid: {$in: [req.uid, req.body.uid]}},
        [
          {
            $set: {
              following: req.body.followStatus ?
                  {
                    $concatArrays: [
                      '$following',
                      {
                        $cond:
                            {
                              if: {
                                $and: [
                                  {$not: {$in: [mongoose.Types.ObjectId(toUser._id), "$following"]}},
                                  {$eq: ["$_id", mongoose.Types.ObjectId(fromUser._id)]},
                                ]
                              },
                              then: [mongoose.Types.ObjectId(toUser._id)],
                              else: []
                            }
                      },
                    ]
                  } : {
                    $filter: {
                      input: "$following",
                      as: "followingObject",
                      "cond": {
                        $ne: [
                          "$$followingObject",
                          mongoose.Types.ObjectId(toUser._id)
                        ]
                      }
                    }
                  },
              follower: req.body.followStatus ? {
                    $concatArrays: [
                      '$follower',
                      {
                        $cond:
                            {
                              if: {
                                $and: [
                                  {$not: {$in: [mongoose.Types.ObjectId(fromUser._id), "$follower"]}},
                                  {$eq: ["$_id", mongoose.Types.ObjectId(toUser._id)]},
                                ]
                              },
                              then: [mongoose.Types.ObjectId(fromUser._id)],
                              else: []
                            }
                      },
                    ]
                  } :
                  {
                    $filter: {
                      input: "$follower",
                      as: "followerObject",
                      "cond": {
                        $ne: [
                          "$$followerObject",
                          mongoose.Types.ObjectId(fromUser._id)
                        ]
                      }
                    }
                  }
            },
          }
        ]
    );
    if (req.body.followStatus) {
      try {
        i18n.initialize(toUser.locale || "en_US");
        pushHandler.pushStack(
            `${fromUser.nickname}${i18n.t("님이 나를 팔로우👋 합니다")}`,
            toUser._id,
            fromUser._id
        );
        if (toUser.pushToken) {
          pushHandler.sendPush(
              toUser.pushToken,
              `${fromUser.nickname}${i18n.t("님이 나를 팔로우👋 합니다")}`,
              {goto: "profile", uid: req.body.uid}
          );
        }
      } catch (error) {
        console.log(error);
      }
    }
    res.send({code: 200, description: "OK", followStatus:req.body.followStatus});
  } catch (error) {
    console.log(error);
    res.send({ code: 400, description: "Bad Request" });
  }

};

exports.getAvatar = (req, res) => res.render("avatar");
exports.postAvatar = async (req, res) => {
  if (req.files.length > 0) {
    var ffmpeg = require("fluent-ffmpeg");
    const fs = require("fs");
    const AWS = require("aws-sdk");
    const s3 = new AWS.S3({
      accessKeyId: process.env.IAM_ID,
      secretAccessKey: process.env.IAM_SECRET,
    });
    loc = [];

    file();
    async function file() {
      for (var i = 0; i < req.files.length; i++) {
        await fileAsync(i);
      }
    }
    function fileAsync(i) {
      return new Promise((resolve) => {
        var getFileTime = Date.now();
        var filename = req.files[i].originalname.split(".");
        var folder = Math.random()
          .toString(36)
          .replace(/[^a-z]+/g, "")
          .substr(0, 6);
        loc[
          i
        ] = `https://tastenote.s3.ap-northeast-2.amazonaws.com/${folder}/${getFileTime}_${filename[0]}_150x150.${filename[1]}`;

        var filetype = req.files[i].mimetype.split("/"); // ex. image/jpeg
        var filename = req.files[i].originalname.split("."); //filename[0] : name , filename[1]: mimetype (ex. mp4)
        if (filetype[0] == "image") {
          ffmpeg(`./uploads/${req.uid}_${req.files[i].originalname}`) // 파일 해상도 조정
            // Generate 720P video
            .output(
              `uploads/${getFileTime}_${filename[0]}_150x150.${filename[1]}`
            )
            .size("150x150") // fileresolution 처리안됨, 프론트에서 잘라준다면?
            .on("error", function (err) {
              console.log("An error occurred: " + err.message);
            })
            .on("end", function () {
              // console.log(`${i}번째 가공파일 만들기 완료`);
              const uploadFile = (fileName) => {
                const fileContent = fs.readFileSync(fileName);
                const params = {
                  Bucket: process.env.S3_BUCKET,
                  Key: `${folder}/${getFileTime}_${filename[0]}_150x150.${filename[1]}`,
                  Body: fileContent,
                  ACL: "public-read",
                };
                s3.upload(params, function (err, data) {
                  // console.log(`${i}번째 파일 s3업로드`);
                  if (err) {
                    throw err;
                  }
                });
              };
              uploadFile(
                `uploads/${getFileTime}_${filename[0]}_150x150.${filename[1]}`,
                console.log("s3")
              );
              fs.unlinkSync(
                `uploads/${getFileTime}_${filename[0]}_150x150.${filename[1]}`
              );
              fs.unlinkSync(
                `./uploads/${req.uid}_${req.files[i].originalname}`
              );
            })
            .run();
        }
        resolve();
      });
    }

    try {
      const user = await User.findOne({ uid: req.uid });
      user.avatar = loc[0];
      user.save();
      res.send({ code: 200, description: "OK" });
    } catch (error) {
      console.log(error);
      res.send({ code: 400, description: "Bad Request" });
    }
  }
};

exports.getUserDetail = (req, res) => res.render("userDetail");
exports.postUserDetail = async (req, res) => {
  try {
    const user = await User.aggregate([
      {
        $match: {
          uid:req.body.uid
        }
      },
      {
        $lookup: {
          from: "orders",
          let: {
            orderId: "$order",
          },
          as: "mytaste",
          pipeline: [
            {
              $match: {
                $expr: { $in: ["$_id", "$$orderId"] },
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
                      uid: 1,
                      avatar: 1,
                      firstName: 1,
                      lastName: 1,
                    },
                  },
                ],
              },
            },
            {
              $unwind: {
                path: "$creator",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $sort: {
                '_id': -1
              }
            },
            {
              $project: {
                _id: 1,
                title: 1,
                count_co: 1,
                count_li: 1,
                count_bo: 1,
                hash: 1,
                createdAt: 1,
                creator: 1,
                thumbnail: {
                  $ifNull: [
                      '$thumbnail',
                    '$video_thumbnail',
                    {$arrayElemAt: ['$image',0]},
                  ]
                },
                video_thumbnail: 1,
              },
            },
          ],
        }
      },
      {
        $lookup: {
          from: "users",
          let: {
            follower: "$follower",
          },
          as: "followerEntries",
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$uid", req.uid] },
                    { $in: ["$_id", "$$follower"] },
                  ],
                },

              },
            },
          ],
        },
      },
      {
        $project: {
          intro: 1,
          mytaste: 1,
          nickname: 1,
          firstName: 1,
          lastName: 1,
          instagramId: 1,
          avatar: 1,
          gender: 1,
          birth: 1,
          totalRecord: {$size:'$order'},
          totalCollect: {$size:'$bookmark'},
          followStatus: {
            $gt: [
              {
                $arrayElemAt: ["$followerEntries", 0],
              },
              null,
            ],
          },
          following_num: {
            $size:'$following'
          },
          follower_num: {
            $size:'$follower'
          },
          collect_num: {
            $sum: [
                {$size:'$bookmark'}, {$size:'$order'},
            ]
          }
        }
      }
    ]).then((result) => result[0]);
    if(user){
      user.main = user.avatar;
      res.send({
        code: 200,
        description: "OK",
        data: {...user},
      })
    } else {
      res.send({
        code: 404,
        description: "Not Found",
      })
    }
  } catch (err) {
    console.log(err);
    res.send({ code: 400, description: "Bad Request" });
  }
};

exports.getUserCollect = (req, res) => res.render("userCollect");
exports.postUserCollect = async (req, res) => {
  try {
    const user_collect = await User.find(
      { uid: req.body.uid },
      { bookmark: 1 }
    ).populate({
      path: "bookmark",
      select: {
        _id: 1,
        title: 1,
        count_co: 1,
        count_li: 1,
        count_bo: 1,
        image: 1,
        hash: 1,
        createdAt: 1,
        video_thumbnail: 1,
      },
      populate: {
        path: "creator",
        select: { uid: 1, firstName: 1, lastName: 1, avatar: 1 },
      },
    });

    let result = {};
    result.data = [];
    let arr = user_collect[0].bookmark.length;
    for (var i in user_collect[0].bookmark) {
      //북마크의 길이부터 역순으로 보내주기(최신순)
      result.data[i] = {};
      result.data[i].hash = user_collect[0].bookmark[arr - 1 - i].hash;
      result.data[i].count_li = user_collect[0].bookmark[arr - 1 - i].count_li;
      result.data[i].count_bo = user_collect[0].bookmark[arr - 1 - i].count_bo;
      result.data[i].count_co = user_collect[0].bookmark[arr - 1 - i].count_co;
      if (user_collect[0].bookmark[arr - 1 - i].video_thumbnail) {
        result.data[i].video_thumbnail =
          user_collect[0].bookmark[arr - 1 - i].video_thumbnail;
      } else {
        if (user_collect[0].bookmark[arr - 1 - i].image[0]) {
          result.data[i].image = user_collect[0].bookmark[arr - 1 - i].image[0];
        }
      }
      if (user_collect[0].bookmark[arr - 1 - i].image[0]) {
        result.data[i].count_file =
          user_collect[0].bookmark[arr - 1 - i].image.length;
      }
      result.data[i]._id = user_collect[0].bookmark[arr - 1 - i]._id;
      result.data[i].title = user_collect[0].bookmark[arr - 1 - i].title;
      result.data[i].creator = user_collect[0].bookmark[arr - 1 - i].creator;
      result.data[i].createdAt =
        user_collect[0].bookmark[arr - 1 - i].createdAt;
      if (i == 9) break;
    }
    result.code = 200;
    result.description = "OK";
    res.send(result);
  } catch (err) {
    console.log(err);
    res.send({ code: 400, description: "Bad Request" });
  }
};

exports.getUserNext = (req, res) => res.render("userNext");
exports.postUserNext = async (req, res) => {
  try {
    const count = req.body.last_taste_id;
    let result = {};
    result.data = [];
    if (req.body.value == "1") {
      // myTaste
      const myTaste = await User.find(
        { uid: req.body.uid },
        { order: 1 }
      ).populate({
        path: "order",
        match: { delete_col: { $eq: 0 }, _id: { $lt: `${count}` } },
        options: { sort: { _id: -1 } },
        select: {
          _id: 1,
          title: 1,
          count_co: 1,
          count_li: 1,
          count_bo: 1,
          image: 1,
          hash: 1,
          createdAt: 1,
          video_thumbnail: 1,
        },
        populate: {
          path: "creator",
          select: { uid: 1, firstName: 1, lastName: 1, avatar: 1 },
        },
      });

      for (var i in myTaste[0].order) {
        //위에서 limit(10)을 하면 limit과 정렬과 lt가 충돌일어나서 일단..
        result.data[i] = {};
        result.data[i].hash = myTaste[0].order[i].hash;
        result.data[i].count_li = myTaste[0].order[i].count_li;
        result.data[i].count_bo = myTaste[0].order[i].count_bo;
        result.data[i].count_co = myTaste[0].order[i].count_co;
        if (myTaste[0].order[i].video_thumbnail) {
          result.data[i].video_thumbnail = myTaste[0].order[i].video_thumbnail;
        } else {
          if (myTaste[0].order[i].image[0]) {
            result.data[i].image = myTaste[0].order[i].image[0];
          }
        }
        if (myTaste[0].order[i].image[0]) {
          result.data[i].count_file = myTaste[0].order[i].image.length;
        }
        result.data[i]._id = myTaste[0].order[i]._id;
        result.data[i].title = myTaste[0].order[i].title;
        result.data[i].creator = myTaste[0].order[i].creator;
        result.data[i].createdAt = myTaste[0].order[i].createdAt;

        if (i == 9) {
          break;
        }
      }
    } else if (req.body.value == "2") {
      // collect
      const user_collect = await User.find(
        { uid: req.body.uid },
        { bookmark: 1 }
      ).populate({
        path: "bookmark",
        select: {
          _id: 1,
          title: 1,
          count_co: 1,
          count_li: 1,
          count_bo: 1,
          image: 1,
          hash: 1,
          createdAt: 1,
          video_thumbnail: 1,
        },
        populate: {
          path: "creator",
          select: { uid: 1, firstName: 1, lastName: 1, avatar: 1 },
        },
      });

      const order_count = await User.findOne({ uid: req.body.uid }).populate({
        path: "bookmark",
        select: { _id: 1 },
      });

      let count = 0; // 마지막 게시물이 몇번째로 수집한 것인지
      for (var c in order_count.bookmark) {
        if (
          JSON.stringify(req.body.last_taste_id) ==
          JSON.stringify(order_count.bookmark[c]._id)
        ) {
          count = c;
          break;
        }
      } // count가 1 : arr[1] 길이는 12
      if (count != 0) {
        for (var i in user_collect[0].bookmark) {
          result.data[i] = {};
          result.data[i].hash = user_collect[0].bookmark[count - i - 1].hash; //(arr-1)-i-(arr-(count+1))-1
          result.data[i].count_li =
            user_collect[0].bookmark[count - i - 1].count_li;
          result.data[i].count_bo =
            user_collect[0].bookmark[count - i - 1].count_bo;
          result.data[i].count_co =
            user_collect[0].bookmark[count - i - 1].count_co;
          if (user_collect[0].bookmark[count - i - 1].video_thumbnail) {
            result.data[i].video_thumbnail =
              user_collect[0].bookmark[count - i - 1].video_thumbnail;
          } else {
            if (user_collect[0].bookmark[count - i - 1].image[0]) {
              result.data[i].image =
                user_collect[0].bookmark[count - i - 1].image[0];
            }
          }
          if (user_collect[0].bookmark[count - i - 1].image[0]) {
            result.data[i].count_file =
              user_collect[0].bookmark[count - i - 1].image.length;
          }
          result.data[i]._id = user_collect[0].bookmark[count - i - 1]._id;
          result.data[i].title = user_collect[0].bookmark[count - i - 1].title;
          result.data[i].creator =
            user_collect[0].bookmark[count - i - 1].creator;
          result.data[i].createdAt =
            user_collect[0].bookmark[count - i - 1].createdAt;
          if (i == 9) {
            break;
          }
          if (count - i == 1) break;
        }
      }
    }
    result.code = 200;
    result.description = "OK";
    res.send(result);
  } catch (e) {
    console.log(e);
    res.send({ code: 400, description: "Bad Request" });
  }
};

exports.getFollowList = (req, res) => res.render("followList");
exports.postFollowList = async (req, res) => {
  let result = {};
  result.data = {};
  result.data.list = [];
  result.data.followStatus = [];
  if (req.body.choice == "1") {
    if (req.body.value == "1") {
      try {
        f_list = await User.findOne(
          // 팔로우 관계 파악을 위한 list
          { uid: req.body.uid },
          { follower: 1 }
        ).populate({
          path: "follower",
          match: { delete_col: { $eq: 0 } },
          select: {
            firstName: 1,
            lastName: 1,
            nickname: 1,
            avatar: 1,
            uid: 1,
            follower: 1,
          },
        });

        list = await User.findOne(
          { uid: req.body.uid },
          { follower: 1 }
        ).populate({
          path: "follower",
          match: { delete_col: { $eq: 0 } },
          select: {
            firstName: 1,
            lastName: 1,
            nickname: 1,
            avatar: 1,
            uid: 1,
          },
        });

        const user = await User.findOne({ uid: req.uid }, { _id: 1 });

        for (var i in f_list.follower) {
          if (f_list.follower[i].follower.includes(user._id)) {
            if (
              JSON.stringify(f_list.follower[i]._id) ===
              JSON.stringify(user._id)
            ) {
              result.data.list.push(list.follower[i]);
              result.data.followStatus.push(2);
            } else {
              result.data.list.push(list.follower[i]);
              result.data.followStatus.push(1);
            }
          }
        }

        for (var i in f_list.follower) {
          if (f_list.follower[i].follower.includes(user._id)) {
          } else {
            if (
              JSON.stringify(f_list.follower[i]._id) ===
              JSON.stringify(user._id)
            ) {
              result.data.list.push(list.follower[i]);
              result.data.followStatus.push(2);
            } else {
              result.data.list.push(list.follower[i]);
              result.data.followStatus.push(0);
            }
          }
        }

        result.data.list = result.data.list.slice(0, 10);
        result.data.followStatus = result.data.followStatus.slice(0, 10);
        result.code = 200;
        result.description = "OK";
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    } else if (req.body.value == "2") {
      try {
        f_list = await User.findOne(
          { uid: req.body.uid },
          { following: 1 }
        ).populate("following", {
          firstName: 1,
          lastName: 1,
          nickname: 1,
          avatar: 1,
          uid: 1,
          follower: 1,
        });

        list = await User.findOne(
          { uid: req.body.uid },
          { following: 1 }
        ).populate("following", {
          firstName: 1,
          lastName: 1,
          nickname: 1,
          avatar: 1,
          uid: 1,
        });

        const user = await User.findOne({ uid: req.uid }, { _id: 1 });

        for (var i in f_list.following) {
          if (f_list.following[i].follower.includes(user._id)) {
            if (
              JSON.stringify(f_list.following[i]._id) ===
              JSON.stringify(user._id)
            ) {
              result.data.list.push(list.following[i]);
              result.data.followStatus.push(2);
            } else {
              result.data.list.push(list.following[i]);
              result.data.followStatus.push(1);
            }
          }
        }

        for (var i in f_list.following) {
          if (f_list.following[i].follower.includes(user._id)) {
          } else {
            if (
              JSON.stringify(f_list.following[i]._id) ===
              JSON.stringify(user._id)
            ) {
              result.data.list.push(list.following[i]);
              result.data.followStatus.push(2);
            } else {
              result.data.list.push(list.following[i]);
              result.data.followStatus.push(0);
            }
          }
        }

        result.data.list = result.data.list.slice(0, 10);
        result.data.followStatus = result.data.followStatus.slice(0, 10);
        result.code = 200;
        result.description = "OK";
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    } else res.send({ code: 400, description: "Bad Request" });
  } else if (req.body.choice == "2") {
    const lastUser = await User.findOne({ uid: req.body.last_uid }, { _id: 1 });
    if (req.body.value == "1") {
      try {
        f_list = await User.findOne(
          { uid: req.body.uid },
          { follower: 1 }
        ).populate({
          path: "follower",
          match: { delete_col: { $eq: 0 } },
          select: {
            firstName: 1,
            lastName: 1,
            nickname: 1,
            avatar: 1,
            uid: 1,
            follower: 1,
          },
        });

        list = await User.findOne(
          { uid: req.body.uid },
          { follower: 1 }
        ).populate({
          path: "follower",
          match: { delete_col: { $eq: 0 } },
          select: {
            firstName: 1,
            lastName: 1,
            nickname: 1,
            avatar: 1,
            uid: 1,
          },
        });

        const user = await User.findOne({ uid: req.uid }, { _id: 1 });

        for (var i in f_list.follower) {
          if (f_list.follower[i].follower.includes(user._id)) {
            if (
              JSON.stringify(f_list.follower[i]._id) ===
              JSON.stringify(user._id)
            ) {
              result.data.list.push(list.follower[i]);
              result.data.followStatus.push(2);
            } else {
              result.data.list.push(list.follower[i]);
              result.data.followStatus.push(1);
            }
          }
        }

        for (var i in f_list.follower) {
          if (f_list.follower[i].follower.includes(user._id)) {
          } else {
            if (
              JSON.stringify(f_list.follower[i]._id) ===
              JSON.stringify(user._id)
            ) {
              result.data.list.push(list.follower[i]);
              result.data.followStatus.push(2);
            } else {
              result.data.list.push(list.follower[i]);
              result.data.followStatus.push(0);
            }
          }
        }

        var last_user = 0;
        for (var i in result.data.list) {
          if (
            JSON.stringify(result.data.list[i]._id) ==
            JSON.stringify(lastUser._id)
          ) {
            last_user = i;
            break;
          }
        }
        result.data.list = result.data.list.slice(
          Number(last_user) + 1,
          Number(last_user) + 11
        );
        result.data.followStatus = result.data.followStatus.slice(
          Number(last_user) + 1,
          Number(last_user) + 11
        );
        result.code = 200;
        result.description = "OK";
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    } else if (req.body.value == "2") {
      try {
        f_list = await User.findOne(
          { uid: req.body.uid },
          { following: 1 }
        ).populate("following", {
          firstName: 1,
          lastName: 1,
          nickname: 1,
          avatar: 1,
          uid: 1,
          follower: 1,
        });

        list = await User.findOne(
          { uid: req.body.uid },
          { following: 1 }
        ).populate("following", {
          firstName: 1,
          lastName: 1,
          nickname: 1,
          avatar: 1,
          uid: 1,
        });

        const user = await User.findOne({ uid: req.uid }, { _id: 1 });

        for (var i in f_list.following) {
          if (f_list.following[i].follower.includes(user._id)) {
            if (
              JSON.stringify(f_list.following[i]._id) ===
              JSON.stringify(user._id)
            ) {
              result.data.list.push(list.following[i]);
              result.data.followStatus.push(2);
            } else {
              result.data.list.push(list.following[i]);
              result.data.followStatus.push(1);
            }
          }
        }

        for (var i in f_list.following) {
          if (f_list.following[i].follower.includes(user._id)) {
          } else {
            if (
              JSON.stringify(f_list.following[i]._id) ===
              JSON.stringify(user._id)
            ) {
              result.data.list.push(list.following[i]);
              result.data.followStatus.push(2);
            } else {
              result.data.list.push(list.following[i]);
              result.data.followStatus.push(0);
            }
          }
        }
        var last_user = 0;
        for (var i in result.data.list) {
          if (
            JSON.stringify(result.data.list[i]._id) ==
            JSON.stringify(lastUser._id)
          ) {
            last_user = i;
            break;
          }
        }
        result.data.list = result.data.list.slice(
          Number(last_user) + 1,
          Number(last_user) + 11
        );
        result.data.followStatus = result.data.followStatus.slice(
          Number(last_user) + 1,
          Number(last_user) + 11
        );
        result.code = 200;
        result.description = "OK";
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    } else res.send({ code: 400, description: "Bad Request" });
  }
};

exports.getDeleteAvatarS3 = (req, res) => res.render("deleteAvatarS3");

exports.getEditProfile = (req, res) => res.render("editProfile");
exports.postEditProfile = async (req, res) => {
  if (req.files.length > 0) {
    var ffmpeg = require("fluent-ffmpeg");
    const fs = require("fs");
    const AWS = require("aws-sdk");
    const s3 = new AWS.S3({
      accessKeyId: process.env.IAM_ID,
      secretAccessKey: process.env.IAM_SECRET,
    });
    const getFileTime = Date.now();

    loc = [];

    file();
    async function file() {
      for (var i = 0; i < req.files.length; i++) {
        await fileAsync(i);
      }
    }
    function fileAsync(i) {
      return new Promise((resolve) => {
        var filename = req.files[i].originalname.split(".");
        loc[
          i
        ] = `https://tastenote.s3.ap-northeast-2.amazonaws.com/uploads/${getFileTime}_${filename[0]}_150x150.${filename[1]}`;

        var filetype = req.files[i].mimetype.split("/"); // ex. image/jpeg
        var filename = req.files[i].originalname.split("."); //filename[0] : name , filename[1]: mimetype (ex. mp4)
        if (filetype[0] == "image") {
          ffmpeg(`./uploads/${req.uid}_${req.files[i].originalname}`)
            .output(
              `uploads/${getFileTime}_${filename[0]}_150x150.${filename[1]}`
            )
            .size("150x150")
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
                  Key: `uploads/${getFileTime}_${filename[0]}_150x150.${filename[1]}`,
                  Body: fileContent,
                  ACL: "public-read",
                };
                s3.upload(params, function (err, data) {
                  // console.log(`${i}번째 파일 s3업로드`);
                  if (err) {
                    console.log("s3 upload failed");
                    res.send({ code: 500, description: "S3 Upload Failed" });
                    throw err;
                  }
                });
              };
              uploadFile(
                `uploads/${getFileTime}_${filename[0]}_150x150.${filename[1]}`
              );
              fs.unlinkSync(
                `uploads/${getFileTime}_${filename[0]}_150x150.${filename[1]}`
              );
              fs.unlinkSync(
                `./uploads/${req.uid}_${req.files[i].originalname}`
              );
            })
            .run();
        }
        resolve();
      });
    }

    try {
      const user = await User.findOne({ uid: req.uid });
      user.avatar = loc[0];
      user.save();
    } catch (error) {
      console.log(error);
    }
  }

  ///////////////////////////////////////////
  try {
    await User.updateOne(
      { uid: req.uid },
      {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        nickname: req.body.nickname,
        intro: req.body.intro,
        instagramId: req.body.instagramId,
        gender: req.body.gender,
        birth: req.body.birth,
      }
    );

    res.send({ code: 200, description: "OK" });
  } catch (error) {
    console.log(error);
    res.send({ code: 400, description: "Bad Request" });
  }
};

exports.getNicknameCheck = (req, res) => res.render("nicknameCheck");
exports.postNicknameCheck = async (req, res) => {
  try {
    const user = await User.findOne({
      nickname: req.body.nickname,
      delete_col: { $ne: 1 },
    });
    if (user) res.send({ data: 1 });
    else res.send({ data: 0 });
  } catch (error) {
    console.log(error);
    res.send({ code: 400, description: "Bad Request" });
  }
};

exports.getTest = (req, res) => res.render("test");
exports.postTest = async (req, res, next) => {
  req.test = 123;
  next();
};
exports.postTest2 = (req, res, next) => {
  console.log(req.test, req.uid);
  res.send(200);
};

exports.getPushToken = (req, res) => res.render("pushToken");
exports.postPushToken = async (req, res) => {
  try {
    await User.updateOne(
      {
        uid: req.uid,
      },
      {
        pushToken: req.body.pushToken,
        locale: req.body.locale,
      }
    );
    res.send({ code: 200, description: "OK" });
  } catch (error) {
    console.log(error);
    res.send({ code: 400, description: "Bad Request" });
  }
};
exports.getIdToPushToken = (req, res) => res.render("idToPushToken");
exports.postIdToPushToken = async (req, res) => {
  try {
    const senderToken = await User.findOne(
      {
        uid: req.uid,
      },
      { pushToken: 1, nickname: 1 }
    );
    const recipientToken = req.body.recipient_id;
    for (let i in recipientToken) {
      recipientToken[i] = await User.findById(recipientToken[i], {
        pushToken: 1,
      });
    }
    res.send({ senderToken, recipientToken });
  } catch (error) {
    console.log(error);
  }
};

exports.getPushData = (req, res) => res.render("pushData");
exports.postPushData = async (req, res) => {
  try {
    const newPush = await Push.create({
      title: req.body.title,
      description: req.body.description,
      sendPushToken: req.body.senderToken,
      sender_id: req.body.sender_id,
      order: req.body.order,
    });
    const recipient_id = req.body.recipient_id;
    for (let i in recipient_id) {
      newPush.recipient.push(req.body.recipient_id[i]);
      //user flag = 1;
      await User.updateOne({ _id: req.body.recipient_id[i] }, { pushFlag: 1 });
    }
    newPush.save();
    res.send({ code: 200, description: "OK" });
  } catch (error) {
    console.log(error);
    res.send({ code: 400, description: "Bad Request" });
  }
};

exports.getPushHistory = (req, res) => res.render("pushHistory");
exports.postPushHistory = async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.uid }, { _id: 1 });
    const history = await Push.find(
      { recipient: user._id },
      { _id: 1, description: 1, createdAt: 1 },
      {
        recipient: 0,
        title: 0,
        sendPushToken: 0,
      }
    )
      .populate("sender_id", { uid: 1, avatar: 1 })
      .populate({
        path: "order",
        select: {
          title: 1,
          count_bo: 1,
          count_co: 1,
          count_li: 1,
          _id: 1,
          delete_col: 1,
        },
        populate: {
          path: "creator",
          select: {
            avatar: 1,
            firstName: 1,
            lastName: 1,
          },
        },
      })
      .sort({ _id: -1 })
      .limit(20);
    //user flag = 0;
    await User.updateOne({ _id: user._id }, { pushFlag: 0 });
    res.send(history);
  } catch (error) {
    console.log(error);
  }
};
exports.getPushHistoryMore = (req, res) => res.render("pushHistoryMore");
exports.postPushHistoryMore = async (req, res) => {
  try {
    const count = req.body.push_id;
    const user = await User.findOne({ uid: req.uid }, { _id: 1 });
    const history = await Push.find(
      { recipient: user._id, _id: { $lt: `${count}` } },
      { _id: 1, description: 1, createdAt: 1 },
      {
        recipient: 0,
        title: 0,
        sendPushToken: 0,
      }
    )
      .populate("sender_id", { uid: 1, avatar: 1 })
      .populate({
        path: "order",
        select: {
          title: 1,
          count_bo: 1,
          count_co: 1,
          count_li: 1,
          _id: 1,
          delete_col: 1,
        },
        populate: {
          path: "creator",
          select: {
            avatar: 1,
            firstName: 1,
            lastName: 1,
          },
        },
      })
      .sort({ _id: -1 })
      .limit(10);
    res.send(history);
  } catch (error) {
    console.log(error);
  }
};

exports.getPushFlag = (req, res) => res.render("pushFlag");
exports.postPushFlag = async (req, res) => {
  try {
    const taste = await User.find({ uid: req.uid }, { pushFlag: 1 });
    let result = {};
    result.pushFlag = taste[0].pushFlag;
    res.send(result);
  } catch (error) {
    console.log(error);
  }
};
exports.getVersion = (req, res) => res.render("version");
exports.postVersion = (req, res) => {
  if (req.body.client_version == process.env.CURRENT_VERSION) {
    res.send({ data: 1, version: "최신" });
  } else if (
    parseFloat(req.body.client_version.slice(0, 3)) >=
    parseFloat(process.env.REQUIRED_VERSION.slice(0, 3))
  ) {
    res.send({ data: 2, version: "update 권장" });
  } else if (
    parseFloat(req.body.client_version.slice(0, 3)) <
    parseFloat(process.env.REQUIRED_VERSION.slice(0, 3))
  ) {
    res.send({ data: 3, version: "update 필수" });
  }
};

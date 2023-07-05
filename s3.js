const AWS = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");
const Order = require("./models/order");
const User = require("./models/User");

const s3 = new AWS.S3({
  accessKeyId: process.env.IAM_ID,
  secretAccessKey: process.env.IAM_SECRET,
});

const storage = multerS3({
  s3: s3,
  bucket: process.env.S3_BUCKET,
  contentType: multerS3.AUTO_CONTENT_TYPE,
  acl: "public-read",
  metadata: function (req, file, cb) {
    cb(null, { fieldName: file.fieldname });
  },
  key: function (req, file, cb) {
    cb(null, `uploads/${Date.now()}_${file.originalname}`);
  },
});

exports.upload = multer({ storage: storage });

exports.postDeleteTasteImageS3 = async (req, res) => {
  try {
    const image_url = await Order.findOne(
      { _id: req.body.taste_id },
      { image: 1 }
    );
    if (image_url.image) {
      const image_split = image_url.image.split("/");
      const image_name = image_split[3] + "/" + image_split[4];

      s3.deleteObject(
        {
          // s3에서 삭제
          Bucket: process.env.S3_BUCKET,
          Key: image_name,
        },
        (err, data) => {
          if (err) {
            throw err;
          }
          console.log("s3 deleteObject ", data);
        }
      );

      await Order.updateOne(
        { _id: req.body.taste_id },
        {
          // db에서 삭제
          $unset: { image: image_url.image },
        }
      );
    }
    res.send({ code: 200, description: "OK" });
  } catch (error) {
    console.log(error);
    res.send({ code: 400, description: "Bad Request" });
  }
};

exports.postDeleteAvatarS3 = async (req, res) => {
  try {
    const avatar_url = await User.findOne(
      { uid: req.uid },
      { avatar: 1 }
    );
    if (avatar_url.avatar) {
      const avatar_split = avatar_url.avatar.split("/");
      const avatar_name = avatar_split[3] + "/" + avatar_split[4];

      s3.deleteObject(
        {
          // s3에서 삭제
          Bucket: process.env.S3_BUCKET,
          Key: avatar_name,
        },
        (err, data) => {
          if (err) {
            throw err;
          }
          console.log("s3 deleteObject ", data);
        }
      );

      const user = await User.updateOne(
        { uid: req.uid },
        {
          // db에서 삭제
          $unset: { avatar: avatar_url.avatar },
        }
      );
    }
    res.send({ code: 200, description: "OK" });
  } catch (error) {
    console.log(error);
    res.send({ code: 400, description: "Bad Request" });
  }
};

exports.postDeleteTasteImageOfUserS3 = async (req, res, next) => {
  try {
    let image_url = await User.findOne(
      { uid: req.uid },
      { order: 1 }
    ).populate("order", { image: 1 });

    for (let i in image_url.order) {
      if (image_url.order[i].image) {
        const image_split = image_url.order[i].image.split("/");
        const image_name = image_split[3] + "/" + image_split[4];

        s3.deleteObject(
          {
            // s3에서 삭제
            Bucket: process.env.S3_BUCKET,
            Key: image_name,
          },
          (err, data) => {
            if (err) {
              throw err;
            }
            console.log("s3 deleteObject ", data);
          }
        );
      }
    }
    for (let j in image_url.order) {
      await Order.updateOne(
        { _id: image_url.order[j]._id },
        {
          // db에서 삭제
          $unset: { image: image_url.order[j].image },
        }
      );
    }
  } catch (error) {
    console.log(error);
  }
  next();
};

exports.postDeleteAvatarOfUserS3 = async (req, res, next) => {
  try {
    const avatar_url = await User.findOne(
      { uid: req.uid },
      { avatar: 1 }
    );
    if (avatar_url.avatar) {
      const avatar_split = avatar_url.avatar.split("/");
      const avatar_name = avatar_split[3] + "/" + avatar_split[4];

      s3.deleteObject(
        {
          // s3에서 삭제
          Bucket: process.env.S3_BUCKET,
          Key: avatar_name,
        },
        (err, data) => {
          if (err) {
            throw err;
          }
          console.log("s3 deleteObject ", data);
        }
      );

      const user = await User.updateOne(
        { uid: req.uid },
        {
          // db에서 삭제
          $unset: { avatar: avatar_url.avatar },
        }
      );
    }
  } catch (error) {
    console.log(error);
  }
  next();
};

// exports.postGoodByeTasteS3 = async (req, res, next) => {
//     try {
//         const image_url = await Order.findOne({ _id: req.body.taste_id }, { image: 1 });
//         const image_split = image_url.image.split('/');
//         const image_name = image_split[3] + "/" + image_split[4];

//         s3.deleteObject({                  // s3에서 삭제
//             Bucket: process.env.S3_BUCKET,
//             Key: image_name
//         }, (err, data) => {
//             if (err) { throw err; }
//             console.log('s3 deleteObject ', data)
//         })
//     } catch (error) {
//         console.log(error);
//     }
//     next();
// }

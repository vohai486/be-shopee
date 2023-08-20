const cloudinary = require("cloudinary").v2;
const sharp = require("sharp");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { initializeApp } = require("firebase/app");
const {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} = require("firebase/storage");
const getPublicIdCloudinary = (url) => {
  const regex = /\/v\d+\/(.*?)\./;
  const match = url.match(regex);
  return match[1];
};
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const mimeExtension = {
  "image/jpeg": ".jpeg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
};
const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(null, false);
    req.fileError = true;
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});
exports.uploadImage = upload.single("image");
exports.uploadImages = upload.array("images", 5);
exports.resizeImages = async (req, res, next) => {
  if (!req.files) return next();
  const result = [];
  for (let i = 0; i < req.files.length; i++) {
    const file = req.files[i];
    const filename = `${Date.now()}-${i + 1}${mimeExtension[file.mimetype]}`;
    await sharp(file.buffer).resize(400, 400).toFile(`public/${filename}`);
    result.push(filename);
  }
  req.body.images = [...result];
  next();
};
exports.resizeImage400 = async (req, res, next) => {
  if (!req.file) return next();
  req.body.image = `${Date.now()}${mimeExtension[req.file.mimetype]}`;
  await sharp(req.file.buffer)
    .resize(400, 400)
    .toFile(`public/${req.body.image}`);
  next();
};
exports.resizeImage750 = async (req, res, next) => {
  if (!req.file) return next();
  req.body.image = `${Date.now()}${mimeExtension[req.file.mimetype]}`;
  req.body.mimetype = req.file.mimetype;
  await sharp(req.file.buffer)
    .resize(750, 750)
    .toFile(`public/${req.body.image}`);
  next();
};
exports.uploadFile = async (req, folder, model, field) => {
  const pathName = path.join(process.cwd(), "public", req.body.image);
  const result = await cloudinary.uploader.upload(pathName, { folder });
  await fs.unlink(path.join(pathName), (err) => {
    if (err) throw new Error(err);
  });

  if (model[field]) {
    const publicId = getPublicIdCloudinary(model[field]);
    await cloudinary.api.delete_resources([publicId]);
  }
  model[field] = result.secure_url;
  return await model.save({ validateBeforeSave: false });
};
exports.uploadFiles = (folder) => async (req, res, next) => {
  if (!req.body.images) next();
  const [...urlImages] = await Promise.all(
    req.body.images.map(async (url) => {
      const pathName = path.join(process.cwd(), "public", url);
      const result = await cloudinary.uploader.upload(pathName, { folder });
      if (result) {
        fs.unlink(path.join(pathName), (err) => {
          if (err) throw new Error(err);
        });
      }
      return result ? result.secure_url : null;
    })
  );
  req.body.images = urlImages.map((image) => image) || [];
  next();
};
// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBOvQvUVco5ry4nn2uBK16V2AcpU6c1waQ",
  authDomain: "department-7dfa4.firebaseapp.com",
  projectId: "department-7dfa4",
  storageBucket: "department-7dfa4.appspot.com",
  messagingSenderId: "586964284791",
  appId: "1:586964284791:web:495eae280933d06c519d72",
};
initializeApp(firebaseConfig);
exports.uploadProduct = async (req) => {
  const pathName = path.join(process.cwd(), "public", req.body.image);
  const storageRef = ref(storage, `product-image/product-${Date.now()}`);
  const imageBuffer = await fs.promises.readFile(path.join(pathName));

  const metadata = {
    contentType: req.body.mimetype,
  };
  const snapshot = await uploadBytesResumable(
    storageRef,
    imageBuffer,
    metadata
  );
  const downloadURL = await getDownloadURL(snapshot.ref);

  await fs.unlink(path.join(pathName), (err) => {
    if (err) throw new Error(err);
  });
  return downloadURL;
};

const storage = getStorage();

const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("./cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "my_uploads", // optional folder in Cloudinary
    allowed_formats: ["jpg", "png", "jpeg", "pdf", "mp4"],
  },
});

const upload = multer({ storage });

module.exports = upload;

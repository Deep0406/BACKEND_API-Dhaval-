const cloudinary = require("cloudinary").v2;

// This will automatically use process.env.CLOUDINARY_URL if set
cloudinary.config({
  secure: true, // ensures HTTPS URLs
});

module.exports = cloudinary;

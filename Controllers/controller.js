const Item = require("../Models/model");
const cloudinary = require("../config/cloudinary"); // 👈 Cloudinary config
const upload = require("../config/multer"); // 👈 Multer-Cloudinary

// =============== CLOUDINARY VERSION =============== //

// 1) Create item with form-data upload
exports.createItem = async (req, res) => {
  try {
    const { name, price, note } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "Photo/file is required" });
    }

    // Multer-storage-cloudinary already uploads directly to Cloudinary
    const uploaded = req.file; // multer gives us Cloudinary response

    // Save in DB
    const item = await Item.create({
      name,
      price: Number(price),
      note,
      photoUrl: uploaded.path, // Cloudinary URL
      photoKey: uploaded.filename, // Cloudinary public_id
    });

    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2) Fetch all items
exports.getItems = async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3) Update item (metadata + optional new file)
exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, note } = req.body;

    const item = await Item.findById(id);
    if (!item) return res.status(404).json({ error: "Item not found" });

    if (req.file) {
      // delete old from Cloudinary
      if (item.photoKey) {
        await cloudinary.uploader.destroy(item.photoKey);
      }

      // new upload is handled by multer-cloudinary
      item.photoUrl = req.file.path;
      item.photoKey = req.file.filename;
    }

    if (name !== undefined) item.name = name;
    if (price !== undefined) item.price = Number(price);
    if (note !== undefined) item.note = note;

    const updatedItem = await item.save();
    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4) Delete item
exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Item.findById(id);

    if (!item) return res.status(404).json({ error: "Item not found" });

    if (item.photoKey) {
      await cloudinary.uploader.destroy(item.photoKey);
    }

    await Item.findByIdAndDelete(id);

    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============== OLD AWS S3 VERSION (Backup) =============== //

/*const Item = require("../Models/model");
const { s3,  uploadToS3 } = require("../config/s3"); // 👈 import s3 + helper

// 1) Generate a signed URL for uploading (optional, still works)
exports.getUploadUrl = async (req, res) => {
  try {
    const fileName = `${Date.now()}-${req.query.name}`;
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileName,
      Expires: 60, // valid for 60s
      ContentType: req.query.type, // e.g., image/png
      ACL: "public-read", // 👈 ensure public link
    };

    const uploadUrl = await s3.getSignedUrlPromise("putObject", params);

    res.json({
      uploadUrl,
      fileUrl: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`,
      fileKey: fileName,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2) Save item with form-data upload
exports.createItem = async (req, res) => {
  try {
    const { name, price, note } = req.body;

    const uploadedFile =
      (req.files?.photo && req.files.photo[0]) ||
      (req.files?.file && req.files.file[0]);

    if (!uploadedFile) {
      return res.status(400).json({ error: "Photo/file is required" });
    }

    const fileKey = `${Date.now()}-${uploadedFile.originalname}`;

    // Upload to S3 via helper
    const uploadResult = await uploadToS3(
      uploadedFile.buffer,
      fileKey,
      uploadedFile.mimetype
    );

    // Save in DB
    const item = await Item.create({
      name,
      price: Number(price),
      note,
      photoUrl: uploadResult.Location, // direct public URL
      photoKey: fileKey,
    });

    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3) Fetch all items
exports.getItems = async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4) Update item (metadata + optional new photo/file)
exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, note } = req.body;

    const item = await Item.findById(id);
    if (!item) return res.status(404).json({ error: "Item not found" });

    const uploadedFile =
      (req.files?.photo && req.files.photo[0]) ||
      (req.files?.file && req.files.file[0]);

    if (uploadedFile) {
      // delete old from S3
      if (item.photoKey) {
        await s3
          .deleteObject({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: item.photoKey,
          })
          .promise();
      }

      const newFileKey = `${Date.now()}-${uploadedFile.originalname}`;
      const uploadResult = await uploadToS3(
        uploadedFile.buffer,
        newFileKey,
        uploadedFile.mimetype
      );

      item.photoUrl = uploadResult.Location;
      item.photoKey = newFileKey;
    }

    if (name !== undefined) item.name = name;
    if (price !== undefined) item.price = Number(price);
    if (note !== undefined) item.note = note;

    const updatedItem = await item.save();
    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 5) Delete item (DB + S3)
exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Item.findById(id);

    if (!item) return res.status(404).json({ error: "Item not found" });

    if (item.photoKey) {
      await s3
        .deleteObject({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: item.photoKey,
        })
        .promise();
    }

    await Item.findByIdAndDelete(id);

    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
*/
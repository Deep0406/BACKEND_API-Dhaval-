const AWS = require("aws-sdk");
const Item = require("../Models/model");

// configure AWS SDK (reads from .env)
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,   // update names to match AWS
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// 1) Generate a signed URL for uploading (optional if you keep this method)
exports.getUploadUrl = async (req, res) => {
  try {
    const fileName = `${Date.now()}-${req.query.name}`;
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileName,
      Expires: 60, // URL valid for 60s
      ContentType: req.query.type, // e.g., "image/png"
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
    if (!req.file) {
      return res.status(400).json({ error: "Photo file is required" });
    }

    // unique file key
    const fileKey = `${Date.now()}-${req.file.originalname}`;

    // upload buffer to S3
    const uploadResult = await s3
      .upload({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileKey,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      })
      .promise();

    // Save in DB
    const item = await Item.create({
      name,
      price,
      note,
      photoUrl: uploadResult.Location, // S3 file URL
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

// 4) Update item (metadata + optional new photo via form-data)
exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, note } = req.body;

    const item = await Item.findById(id);
    if (!item) return res.status(404).json({ error: "Item not found" });

    // If new photo uploaded → delete old and upload new
    if (req.file) {
      // delete old
      await s3
        .deleteObject({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: item.photoKey,
        })
        .promise();

      const newFileKey = `${Date.now()}-${req.file.originalname}`;
      const uploadResult = await s3
        .upload({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: newFileKey,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        })
        .promise();

      item.photoUrl = uploadResult.Location;
      item.photoKey = newFileKey;
    }

    if (name !== undefined) item.name = name;
    if (price !== undefined) item.price = price;
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

    // delete photo from S3
    await s3
      .deleteObject({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: item.photoKey,
      })
      .promise();

    // delete from DB
    await Item.findByIdAndDelete(id);

    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

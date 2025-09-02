const AWS = require("aws-sdk");
const Item = require("../Models/model");

// configure AWS SDK (reads from .env)
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_REGION,
});

// 1) Generate a signed URL for uploading
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

// 2) Save item after successful upload
exports.createItem = async (req, res) => {
  try {
    const { name, price, note, photoUrl, photoKey } = req.body;

    const item = await Item.create({ name, price, note, photoUrl, photoKey });
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

// 4) Update item (metadata + optional new photo)
exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, note, photoUrl, photoKey } = req.body;

    const item = await Item.findById(id);
    if (!item) return res.status(404).json({ error: "Item not found" });

    // if new photo provided → delete old from S3
    if (photoUrl && photoKey && (photoKey !== item.photoKey)) {
      await s3
        .deleteObject({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: item.photoKey,
        })
        .promise();

      item.photoUrl = photoUrl;
      item.photoKey = photoKey;
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
const express = require("express");
const multer = require("multer");
const {
  getUploadUrl,
  createItem,
  updateItem,
  deleteItem,
  getItems,
} = require("../Controllers/controller");

const router = express.Router();

// Multer setup (store files in memory before uploading to S3)
const upload = multer({ storage: multer.memoryStorage() });

// Step 1: get signed upload URL (optional if using direct form-data uploads)
router.get("/upload-url", getUploadUrl);

// Step 2: save item metadata + photo (form-data)
// Accepts either "photo" or "file" as the field name for the uploaded file
router.post(
  "/",
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "file", maxCount: 1 },
  ]),
  createItem
);

// Fetch all items
router.get("/", getItems);

// Update item (metadata + optional new photo via form-data)
router.patch(
  "/:id",
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "file", maxCount: 1 },
  ]),
  updateItem
);

// Delete item (DB + S3)
router.delete("/:id", deleteItem);

module.exports = router;

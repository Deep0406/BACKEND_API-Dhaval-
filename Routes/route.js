const express = require("express");
const { getUploadUrl, createItem, updateItem, deleteItem, getItems } = require("../Controllers/controller");

const router = express.Router();

// Step 1: get signed upload URL
router.get("/upload-url", getUploadUrl);

// Step 2: save item metadata
router.post("/", createItem);

// Fetch all items
router.get("/", getItems);
// Update item (metadata only, partial update)
router.patch("/:id", updateItem);

// Delete item (DB + S3)
router.delete("/:id", deleteItem);

module.exports = router;

const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: false, trim: true },
    price: { type: Number, required: true, min: 0 },
    note: { type: String, trim: true },
    photoUrl: { type: String, required: true }, // S3 file URL
    photoKey: { type: String, required: true }, // S3 object key (for delete/updates)
  },
  { timestamps: true }
);

module.exports = mongoose.model("Item", itemSchema);

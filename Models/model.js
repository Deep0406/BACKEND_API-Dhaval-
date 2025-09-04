const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: "" }, // not required
    price: { type: Number, required: true, min: 0 }, // must be a number >= 0
    note: { type: String, trim: true, default: "" },
    photoUrl: { type: String, required: true }, // S3 file URL
    photoKey: { type: String, required: true }, // S3 object key (for delete/updates)
  },
  { timestamps: true }
);

module.exports = mongoose.model("Item", itemSchema);

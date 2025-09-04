const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: false,
    },
    price: {
      type: Number,
      required: true,
    },
    note: {
      type: String,
    },
    category: {
      type: String,
      required: true,   // 👈 make category mandatory
    },
    photoUrl: {
      type: String,
      required: true,
    },
    photoKey: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Item", itemSchema);

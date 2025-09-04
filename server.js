const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // modern replacement for body-parser
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
mongoose.connect(process.env.Mongo_DB)
  .then(() => console.log("Database connected successfully..."))
  .catch((err) => console.error("Database connection error:", err));

// Routes
app.get("/", (req, res) => {
  res.send("Initializing Backend...");
});

app.use("/api/items", require("./Routes/route"));

// Start server
const PORT = process.env.PORTS || 3001;
app.listen(PORT, () => {
  console.log(`Server is listening on http://localhost:${PORT}`);
});

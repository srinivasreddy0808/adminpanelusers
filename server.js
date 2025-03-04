const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

let DB = process.env.DATABASE;
DB = DB.replace("<PASSWORD>", process.env.DATABASE_PASSWORD);

// Connect to MongoDB
mongoose
  .connect(DB)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Failed to connect to MongoDB", err));

// Define Mongoose Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  imageUrl: { type: String, required: true },
  notificationMessage: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

// Multer configuration for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// API to handle image, name, and message upload
app.post("/upload", upload.single("image"), async (req, res) => {
  const { name, message } = req.body;
  const imageUrl = `${process.env.HOST}/uploads/${req.file.filename}`;

  try {
    // Save user data to MongoDB
    const user = new User({ name, imageUrl, notificationMessage: message });
    await user.save();

    // Simulate sending a notification to another website
    console.log(
      `Notification sent: User ${name} with image ${imageUrl} and message: ${message}`
    );

    res.status(200).json({
      message: "Upload successful",
      name,
      imageUrl,
      notificationMessage: message,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error saving data to database" });
  }
});

app.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching data from database" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const Registration = require("./models/Registration");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Multer setup (memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log("✅ MongoDB connected");

  // Start server only after DB connection
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
})
.catch((err) => console.error("❌ MongoDB error:", err));

// Helper: buffer to data URL
const bufferToDataURL = (file) => {
  const mimetype = file.mimetype;
  const base64 = file.buffer.toString("base64");
  return `data:${mimetype};base64,${base64}`;
};

// Root route
app.get("/", (req, res) => {
  res.send("🚀 Server is running!");
});

// Registration API
app.post("/register", upload.single("paymentScreenshot"), async (req, res) => {
  try {
    const {
      name, fatherName, age, dob, mobile,
      email, address, membership, date,
      paymentMode, amount
    } = req.body;

    // Validate mandatory fields
    if (!name || !fatherName || !age || !dob || !mobile || !email ||
        !address || !membership || !date || !paymentMode) {
      return res.status(400).json({ message: "All fields are required" });
    }

    let screenshotUrl = null;

    if (paymentMode === "online") {
      if (!amount || !req.file) {
        return res.status(400).json({
          message: "Payment amount and screenshot required for online payment"
        });
      }

      // Convert buffer to data URL and upload
      const dataUrl = bufferToDataURL(req.file);
      const result = await cloudinary.uploader.upload(dataUrl, {
        folder: "mandir_upload",
        use_filename: true,
        unique_filename: false,
        overwrite: false,
      });

      screenshotUrl = result.secure_url;
    }

    const newRegistration = new Registration({
      name, fatherName, age, dob, mobile,
      email, address, membership, date,
      paymentMode, amount, paymentScreenshot: screenshotUrl
    });

    await newRegistration.save();
    res.status(201).json({ message: "Registration successful" });

  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

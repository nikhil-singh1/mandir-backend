const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const path = require("path");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

const Registration = require("./models/Registration");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Multer setup (temporary local storage)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Connect MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// Registration API
app.post("/register", upload.single("paymentScreenshot"), async (req, res) => {
  try {
    const {
      name,
      fatherName,
      age,
      dob,
      mobile,
      email,
      address,
      membership,
      date,
      paymentMode,
      amount,
    } = req.body;

    // Validate mandatory fields
    if (
      !name ||
      !fatherName ||
      !age ||
      !dob ||
      !mobile ||
      !email ||
      !address ||
      !membership ||
      !date ||
      !paymentMode
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // If online payment, amount & screenshot are required
    if (paymentMode === "online") {
      if (!amount || !req.file) {
        return res
          .status(400)
          .json({ message: "Payment amount and screenshot are required for online payment" });
      }
    }

    let screenshotUrl = null;

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "mandir_upload",
        use_filename: true,
        unique_filename: false,
        overwrite: false,
      });
      screenshotUrl = result.secure_url;

      // Remove local file after upload
      fs.unlinkSync(req.file.path);
    }

    const newRegistration = new Registration({
      name,
      fatherName,
      age,
      dob,
      mobile,
      email,
      address,
      membership,
      date,
      paymentMode,
      amount,
      paymentScreenshot: screenshotUrl,
    });

    await newRegistration.save();
    res.status(201).json({ message: "Registration successful" });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
 
// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

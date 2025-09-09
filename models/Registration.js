const mongoose = require("mongoose");

const RegistrationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  fatherName: { type: String, required: true },
  age: { type: Number, required: true },
  dob: { type: Date, required: true },
  mobile: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String, required: true },
  membership: { type: String, required: true },
  date: { type: Date, required: true },
  paymentMode: { type: String, required: true },
  amount: { type: Number },
  paymentScreenshot: { type: String }, // Cloudinary URL
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Registration", RegistrationSchema);

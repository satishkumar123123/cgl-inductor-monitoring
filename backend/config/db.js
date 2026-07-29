const mongoose = require("mongoose");

async function connectDB() {
  // Agar .env me MONGO_URI nahi mila toh local Compass URI fallback use karega
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/cgl_dashboard";

  try {
    await mongoose.connect(uri);
    console.log("Local MongoDB Compass connected:", mongoose.connection.host);
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
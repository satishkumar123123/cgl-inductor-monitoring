const mongoose = require("mongoose");

async function connectDB() {
  // Check MONGODB_URI (Render) or MONGO_URI (.env) or fallback to local Compass
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/cgl_dashboard";

  try {
    const conn = await mongoose.connect(uri);
    console.log("MongoDB Connected successfully to host:", conn.connection.host);
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
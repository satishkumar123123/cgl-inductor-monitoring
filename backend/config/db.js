const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/cgl_database";

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("MongoDB Connected successfully to host:", conn.connection.host);
  } catch (err) {
    console.error("MongoDB connection warning/failed:", err.message);
    // Don't kill process immediately on connection lag
  }
}

module.exports = connectDB;
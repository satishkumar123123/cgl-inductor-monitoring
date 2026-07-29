/**
 * Seeds three demo users (Admin, Engineer, Operator) so the Login page works
 * immediately after connecting MongoDB Atlas.
 *
 * Run with: npm run seed   (from the backend/ folder, after setting .env)
 */
require("dotenv").config();
const connectDB = require("../config/db");
const User = require("../models/User");

const demoUsers = [
  { name: "Site Admin", username: "admin", password: "admin123", role: "Admin" },
  { name: "Duty Engineer", username: "engineer", password: "engineer123", role: "Engineer" },
  { name: "Shift Operator", username: "operator", password: "operator123", role: "Operator" },
];

(async () => {
  await connectDB();
  for (const u of demoUsers) {
    const existing = await User.findOne({ username: u.username });
    if (existing) {
      console.log(`User "${u.username}" already exists — skipping`);
      continue;
    }
    await User.create(u);
    console.log(`Created user "${u.username}" / password "${u.password}" (${u.role})`);
  }
  console.log("Seeding complete.");
  process.exit(0);
})().catch((err) => {
  console.error("Seeding failed:", err.message);
  process.exit(1);
});

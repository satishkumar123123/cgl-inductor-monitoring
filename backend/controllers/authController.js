const User = require("../models/User");
const generateToken = require("../utils/generateToken");

/**
 * POST /api/auth/login
 * Body: { username, password }
 */
async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const user = await User.findOne({ username: username.toLowerCase().trim() });
    if (!user) return res.status(401).json({ message: "Invalid username or password" });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ message: "Invalid username or password" });

    const token = generateToken(user);
    res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me — return the currently logged-in user (from JWT).
 */
async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, me };

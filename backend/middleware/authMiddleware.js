const protect = (req, res, next) => {
  req.user = {
    _id: "60f7b1b2f1d2c80015f8b1a1",
    username: "admin",
    role: "Admin"
  };
  next();
};

const adminOnly = (req, res, next) => {
  next();
};

module.exports = { protect, adminOnly };
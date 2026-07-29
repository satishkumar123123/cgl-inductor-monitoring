/**
 * Restrict a route to one or more roles, e.g. allowRoles("Admin") or
 * allowRoles("Admin", "Engineer"). Must run after authMiddleware.protect.
 */
function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Not authorized" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Role "${req.user.role}" is not permitted to perform this action` });
    }
    next();
  };
}

module.exports = allowRoles;

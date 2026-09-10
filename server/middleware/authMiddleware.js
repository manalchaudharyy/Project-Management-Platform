const jwt = require("jsonwebtoken");
const BlacklistedToken = require("../models/BlacklistedToken");

// Protects routes - checks for a valid JWT in the Authorization header,
// and that it hasn't been explicitly revoked (logged out) before its
// natural expiry.
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Older tokens issued before this change won't have a jti — treat
    // those as always valid (they'll simply expire naturally in 7 days).
    if (decoded.jti) {
      const revoked = await BlacklistedToken.findOne({ jti: decoded.jti });
      if (revoked) {
        return res.status(401).json({ message: "Not authorized, token has been revoked" });
      }
    }

    req.user = decoded; // { id, role, jti, iat, exp }
    next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorized, token failed or expired" });
  }
};

// Restricts routes to specific roles - use AFTER protect
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: insufficient permissions" });
    }
    next();
  };
};

module.exports = { protect, authorize };
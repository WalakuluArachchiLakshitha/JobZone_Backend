import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Maps JWT error names to user-friendly messages
const JWT_ERROR_MESSAGES = {
  JsonWebTokenError: "Invalid token. Please log in again.",
  TokenExpiredError: "Token has expired. Please log in again.",
};

/**
 * Middleware: protectRoute
 * Verifies the JWT token sent in the Authorization header.
 * If valid, attaches the user object to req.user and calls next().
 * If invalid or missing, returns 401 Unauthorized.
 *
 * Usage on any protected route:
 *   router.get("/profile", protectRoute, userController.getProfile);
 */
const protectRoute = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Token is valid but user no longer exists.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    const friendlyMessage = JWT_ERROR_MESSAGES[error.name];

    if (friendlyMessage) {
      return res.status(401).json({ success: false, message: friendlyMessage });
    }

    return res.status(500).json({
      success: false,
      message: "Server error during authentication.",
    });
  }
};

/**
 * Middleware: restrictTo
 * Restricts access to specific roles.
 * Must be used AFTER protectRoute so req.user is available.
 *
 * Usage: router.post("/jobs", protectRoute, restrictTo("employer", "admin"), ...)
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Only ${roles.join(" or ")} can perform this action.`,
      });
    }
    next();
  };
};

export { protectRoute, restrictTo };

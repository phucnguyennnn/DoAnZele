const jwt = require("jsonwebtoken");
const sendResponse = require("../utils/response");

const authMiddleware = (req, res, next) => {
  const token = req.cookies?.jwt || req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return sendResponse(res, 401, "No token provided");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    let user = decoded.user;
    req.user = user; // Attach user to request object
    next();
  } catch (error) {
    return sendResponse(res, 401, "Invalid token");
  }
};

module.exports = authMiddleware;

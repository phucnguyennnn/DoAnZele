const jwt = require("jsonwebtoken");

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

const verifyToken = (accessToken) => {
  return jwt.verify(accessToken, process.env.JWT_SECRET);
};

module.exports = { generateToken, verifyToken };

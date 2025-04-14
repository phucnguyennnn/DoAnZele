const jwt = require("jsonwebtoken");

const generateToken = (user, res) => {
  const token = jwt.sign(
    { userId: user._id, user: user },
    process.env.JWT_SECRET,
    {
      expiresIn: "30d",
    }
  );
  res.cookie("jwt", token, {
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 ngày
    secure: process.env.NODE_ENV === "production" ? true : false, // Chỉ gửi cookie qua HTTPS trong môi trường sản xuất
    sameSite: "strict",
  });
  return token;
};

const verifyToken = (accessToken) => {
  return jwt.verify(accessToken, process.env.JWT_SECRET);
};

module.exports = { generateToken, verifyToken };

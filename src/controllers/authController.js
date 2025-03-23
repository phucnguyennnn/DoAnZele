const AuthService = require("../services/authService");
const sendResponse = require("../utils/response");

const registerUser = async (req, res) => {
  const { phone, email, name, password } = req.body;
  try {
    const user = await AuthService.registerUser(phone, email, name, password);
    sendResponse(res, 201, "User registered successfully", user);
  } catch (error) {
    sendResponse(res, 400, error.message);
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const { user, accessToken } = await AuthService.loginUser(email, password);
    sendResponse(res, 200, "User logged in successfully", {
      user,
      accessToken,
    });
  } catch (error) {
    sendResponse(res, 400, error.message);
  }
};

const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  try {
    await AuthService.verifyOTP(email, otp);
    sendResponse(res, 200, "OTP verified successfully");
  } catch (error) {
    sendResponse(res, 400, error.message);
  }
};

const resendOTP = async (req, res) => {
  const { email } = req.body;
  try {
    sendResponse(res, 200, "OTP resent successfully");
  } catch (error) {
    sendResponse(res, 400, error.message);
  }
};

module.exports = { registerUser, verifyOTP, resendOTP, loginUser };

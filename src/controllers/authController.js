const AuthService = require("../services/authService");
const sendResponse = require("../utils/response");

const registerUser = async (req, res) => {
  const { phone, email, name, password } = req.body;
  try {
    const user = await AuthService.registerUser(phone, email, name, password);
    sendResponse(res, 201, "Đăng ký thành công!");
  } catch (error) {
    sendResponse(res, 400, error.message);
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const { user, accessToken } = await AuthService.loginUser(email, password);
    sendResponse(res, 200, "Đăng nhập thành công!", {
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
    sendResponse(res, 200, "OTP đã được xác thực thành công!");
  } catch (error) {
    sendResponse(res, 400, error.message);
  }
};

const resendOTP = async (req, res) => {
  const { email } = req.body;
  try {
    sendResponse(res, 200, "OTP đã được gửi lại thành công!");
  } catch (error) {
    sendResponse(res, 400, error.message);
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    await AuthService.forgotPassword(email);
    sendResponse(res, 200, "OTP reset password đã được gửi thành công!");
  } catch (error) {
    sendResponse(res, 400, error.message);
  }
};

const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    await AuthService.resetPassword(email, otp, newPassword);
    sendResponse(res, 200, "Mật khẩu đã được đặt lại thành công!");
  } catch (error) {
    sendResponse(res, 400, error.message);
  }
};

module.exports = {
  registerUser,
  verifyOTP,
  resendOTP,
  loginUser,
  forgotPassword,
  resetPassword,
};

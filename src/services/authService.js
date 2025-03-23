const UserRepository = require("../repositories/userRepository");
const generateOTP = require("../utils/generateOTP");
const bcrypt = require("bcryptjs");
const transporter = require("../config/email");
const handleValidationError = require("../utils/errorHandler");
const { generateToken } = require("../utils/jwt");

class AuthService {
  static async registerUser(phone, email, name, password) {
    // Kiểm tra người dùng đã tồn tại
    // const existingUser = await UserRepository.findUserByEmailOrPhone(
    //   email,
    //   phone
    // );
    // if (existingUser) {
    //   throw new Error("Email hoặc số điện thoại đã được đăng ký!");
    // }

    // Tạo OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 1 * 60 * 1000); // OTP hết hạn sau 1 phút
    const otpSentAt = new Date(); // Lưu thời điểm gửi OTP

    // Mật khẩu không được để trống và phải có ít nhất 6 ký tự
    if (!password || password.length < 6) {
      throw new Error("Mật khẩu phải có ít nhất 6 ký tự!");
    }

    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      phone,
      email,
      name,
      password_hash: hashedPassword,
      otp,
      otp_expiry: otpExpiry,
      otp_sent_at: otpSentAt,
    };

    try {
      // Lưu người dùng mới
      const savedUser = await UserRepository.saveUser(newUser);

      // Gửi OTP qua email
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Xác thực tài khoản",
        text: `Mã OTP của bạn là: ${otp}`,
      };

      await transporter.sendMail(mailOptions);

      return savedUser;
    } catch (error) {
      throw new Error(handleValidationError(error));
    }
  }

  static async loginUser(email, password) {
    const user = await UserRepository.findUserByEmail(email);
    if (!user) {
      throw new Error("Người dùng không tồn tại!");
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new Error("Mật khẩu không chính xác!");
    }

    const accessToken = generateToken(user._id);

    // Chỉ gửi thông tin cần thiết của người dùng
    const userToSend = {
      _id: user._id,
      email: user.email,
      name: user.name,
    };

    return { user: userToSend, accessToken };
  }

  static async resendOTP(email) {
    const user = await UserRepository.findUserByEmail(email);
    if (!user) {
      throw new Error("Người dùng không tồn tại!");
    }

    if (user.otp_verified) {
      throw new Error("Tài khoản đã được xác thực trước đó!");
    }

    // Tạo OTP mới
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 1 * 60 * 1000); // OTP hết hạn sau 1 phút
    const otpSentAt = new Date(); // Lưu thời điểm gửi OTP

    // Cập nhật OTP và thời điểm gửi OTP
    await UserRepository.updateUser(user._id, {
      otp,
      otp_expiry: otpExpiry,
      otp_sent_at: otpSentAt,
    });

    // Gửi OTP qua email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Gửi lại mã OTP",
      text: `Mã OTP mới của bạn là: ${otp}`,
    };

    await transporter.sendMail(mailOptions);
  }

  static async verifyOTP(email, otp) {
    const user = await UserRepository.findUserByEmail(email);
    if (!user) {
      throw new Error("Người dùng không tồn tại!");
    }

    if (user.otp_verified) {
      throw new Error("Tài khoản đã được xác thực trước đó!");
    }

    const currentTime = new Date();
    if (currentTime > user.otp_expiry) {
      throw new Error("Mã OTP đã hết hạn!");
    }

    if (user.otp === otp) {
      // Cập nhật trạng thái OTP đã xác thực
      await UserRepository.updateUser(user._id, { otp_verified: true });

      // Thông báo tới người dùng
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Xác thực tài khoản thành công",
        text: "Tài khoản của bạn đã được xác thực thành công!",
      };

      await transporter.sendMail(mailOptions);

      return;
    } else {
      throw new Error("Mã OTP không chính xác!");
    }
  }
}

module.exports = AuthService;

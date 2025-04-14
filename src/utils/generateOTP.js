const generateOTP = () => {
  const otp = Math.floor(100000 + Math.random() * 900000); // OTP gồm 6 chữ số
  return otp.toString();
};

module.exports = generateOTP;

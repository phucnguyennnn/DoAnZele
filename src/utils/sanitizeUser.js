module.exports = (user) => {
  const {
    password_hash,
    registration_otp,
    registration_otp_expiry,
    password_reset_otp,
    password_reset_otp_expiry,
    otp,
    otp_expiry,
    otp_sent_at,
    ...sanitizedUser
  } = user.toObject();
  return sanitizedUser;
};

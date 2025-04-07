const User = require("../models/User");

exports.updateUserById = async (userId, updateData) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  // Prevent updates to email and password_hash
  if (updateData.email || updateData.password) {
    throw new Error("Updating email or password is not allowed");
  }

  // Update other fields
  Object.keys(updateData).forEach((key) => {
    user[key] = updateData[key];
  });

  await user.save();
  //   Trả về các thông tin cần thiết của người dùng
  let userToSend = {
    _id: user._id,
    email: user.email,
    name: user.name,
    dob: user.dob,
    phone: user.phone,
    avatar_images: user.avatar_images,
    primary_avatar: user.primary_avatar,
  };
  return userToSend;
};

exports.addOrUpdateAvatar = async (userId, imageUrl) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  if (user.avatar_images.includes(imageUrl)) {
    // If the image already exists, set it as the primary avatar
    user.primary_avatar = imageUrl;
  } else {
    // If the image doesn't exist, add it to the list and set it as the primary avatar
    user.avatar_images.push(imageUrl);
    user.primary_avatar = imageUrl;
  }

  await user.save();
  //   Trả về các thông tin cần thiết của người dùng
  let userToSend = {
    _id: user._id,
    email: user.email,
    name: user.name,
    dob: user.dob,
    phone: user.phone,
    avatar_images: user.avatar_images,
    primary_avatar: user.primary_avatar,
  };
  return userToSend;
};

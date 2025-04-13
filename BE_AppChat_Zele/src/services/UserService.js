const User = require("../models/User");
const UserRepository = require("../repositories/userRepository");
const sanitizeUser = require("../utils/sanitizeUser");

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
  return sanitizeUser(user);
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
  return sanitizeUser(user);
};

exports.getUserByIdOrEmail = async (userId, email) => {
  const user = await UserRepository.findUserByIdOrEmail(userId, email);

  if (!user) {
    return null;
  }

  return sanitizeUser(user);
};

exports.getAllUsers = async ({ page, limit }) => {
  const { users, totalDocuments } = await UserRepository.findAllUsers({
    page,
    limit,
  });

  // Calculate total pages
  const totalPages = Math.ceil(totalDocuments / limit);

  // Return an empty array if the requested page exceeds the total pages
  // if (page > totalPages) {
  //   return { users: [], totalPages };
  // }

  // Sanitize each user
  const sanitizedUsers = users.map(sanitizeUser);

  return { users: sanitizedUsers, totalPages };
};

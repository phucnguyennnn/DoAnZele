const UserService = require("../services/UserService");
const sendResponse = require("../utils/response");

exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    const updatedUser = await UserService.updateUserById(userId, updateData);

    if (!updatedUser) {
      return sendResponse(res, 404, "User not found", "error");
    }

    sendResponse(res, 200, "User updated successfully", "success", updatedUser);
  } catch (error) {
    sendResponse(res, 500, "Error updating user", "error", {
      error: error.message,
    });
  }
};

exports.addOrUpdateAvatar = async (req, res) => {
  try {
    const { userId } = req.params;
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return sendResponse(res, 400, "Image URL is required", "error");
    }

    const updatedUser = await UserService.addOrUpdateAvatar(userId, imageUrl);

    sendResponse(
      res,
      200,
      "Avatar updated successfully",
      "success",
      updatedUser
    );
  } catch (error) {
    sendResponse(res, 500, "Error updating avatar", "error", {
      error: error.message,
    });
  }
};

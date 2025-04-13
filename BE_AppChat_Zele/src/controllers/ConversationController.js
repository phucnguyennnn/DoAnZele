const ConversationService = require("../services/ConversationService");
const sendResponse = require("../utils/response");

exports.getConversationsByUserId = async (req, res) => {
  try {
    const userId = req.user._id; // Lấy userId từ token đã xác thực

    const conversations = await ConversationService.getConversationsByUserId(
      userId
    );

    if (!conversations || conversations.length === 0) {
      return sendResponse(res, 404, "No conversations found", "error");
    }

    sendResponse(
      res,
      200,
      "Conversations fetched successfully",
      "success",
      conversations
    );
  } catch (error) {
    sendResponse(res, 500, "Error fetching conversations", "error", {
      error: error.message,
    });
  }
};

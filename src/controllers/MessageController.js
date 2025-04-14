const MessageService = require("../services/MessageService");
const sendResponse = require("../utils/response");

exports.sendMessage = async (req, res) => {
  try {
    const senderId = req.user._id; // Extract sender ID from authenticated user
    const {
      receiverId,
      message_type,
      content,
      file_id,
      mentions,
      self_destruct_timer,
    } = req.body;

    if (!receiverId || !message_type) {
      return sendResponse(
        res,
        400,
        "Receiver ID and message type are required",
        "error"
      );
    }

    const message = await MessageService.sendMessage(senderId, receiverId, {
      message_type,
      content,
      file_id,
      mentions,
      self_destruct_timer,
    });

    sendResponse(res, 200, "Message sent successfully", "success", message);
  } catch (error) {
    sendResponse(res, 500, "Error sending message", "error", {
      error: error.message,
    });
  }
};

exports.getMessagesByConversationId = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const messages = await MessageService.getMessagesByConversationId(
      conversationId
    );

    if (!messages || messages.length === 0) {
      return sendResponse(res, 404, "No messages found", "error");
    }

    sendResponse(
      res,
      200,
      "Messages fetched successfully",
      "success",
      messages
    );
  } catch (error) {
    sendResponse(res, 500, "Error fetching messages", "error", {
      error: error.message,
    });
  }
};

exports.revokeMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id; // Lấy ID người dùng từ token

    const result = await MessageService.revokeMessage(messageId, userId);

    if (!result) {
      return sendResponse(
        res,
        403,
        "You are not allowed to revoke this message",
        "error"
      );
    }

    sendResponse(res, 200, "Message revoked successfully", "success", result);
  } catch (error) {
    sendResponse(res, 500, "Error revoking message", "error", {
      error: error.message,
    });
  }
};

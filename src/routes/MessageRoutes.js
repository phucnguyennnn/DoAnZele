const express = require("express");
const router = express.Router();
const MessageController = require("../controllers/MessageController");

// Route to send a message
// http://localhost:5000/api/message/send
router.post("/send", MessageController.sendMessage);

module.exports = router;

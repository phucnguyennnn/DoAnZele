const express = require("express");
const router = express.Router();
const UserController = require("../controllers/UserController");

// http://localhost:5000/api/update/:userId
router.put("/update/:userId", UserController.updateUser); // Route to update user information

// http://localhost:5000/api/updateAvatar/:userId
router.put("/updateAvatar/:userId", UserController.addOrUpdateAvatar); // Route to add or update avatar

module.exports = router;

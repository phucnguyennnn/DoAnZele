const express = require("express");
const router = express.Router();
const UserController = require("../controllers/UserController");

// http://localhost:5000/api/user/update/:userId
router.put("/update/:userId", UserController.updateUser); // Route to update user information

// http://localhost:5000/api/user/updateAvatar/:userId
router.put("/updateAvatar/:userId", UserController.addOrUpdateAvatar); // Route to add or update avatar

// http://localhost:5000/api/user/getUser
router.get("/getUser", UserController.getUserByIdOrEmail); // Route to get user by ID or email

// http://localhost:5000/api/user/getAllUsers?page=1&limit=10
router.get("/getAllUsers", UserController.getAllUsers); // Route to get all users with pagination

// http://localhost:5000/api/user/searchByNameOrPhone?query=John
router.get("/searchByNameOrPhone", UserController.searchByNameOrPhone); // Route to search users by name or email

module.exports = router;

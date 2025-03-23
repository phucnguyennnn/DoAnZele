const User = require("../models/User");

class UserRepository {
  static async findUserByEmailOrPhone(email, phone) {
    return await User.findOne({ $or: [{ email }, { phone }] });
  }

  static async saveUser(userData) {
    const user = new User(userData);
    return await user.save();
  }

  static async findUserByEmail(email) {
    return await User.findOne({ email });
  }

  static async updateUser(userId, updateData) {
    return await User.findByIdAndUpdate(userId, updateData, { new: true });
  }
}

module.exports = UserRepository;

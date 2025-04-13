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

  static async findUserByIdOrEmail(userId, email) {
    const query = {};
    if (userId) query._id = userId;
    if (email) query.email = email;
    return await User.findOne(query);
  }

  static async findAllUsers({ page, limit }) {
    const skip = (page - 1) * limit; // Calculate the number of documents to skip
    const users = await User.find({}).skip(skip).limit(parseInt(limit));
    const totalDocuments = await User.countDocuments(); // Get total number of documents
    return { users, totalDocuments };
  }
}

module.exports = UserRepository;

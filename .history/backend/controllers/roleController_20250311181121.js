const UserMessage = require("../models/messageSchema");

// Fetch all users & their message counts
const getAllUsers = async (req, res) => {
  try {
    const users = await UserMessage.find().sort({ messageCount: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Server error while fetching users." });
  }
};

// Manually assign a role to a user (if needed)
const assignRoleManually = async (req, res) => {
  const { userId, role } = req.body;
  try {
    // Here, you should integrate Discord API to assign the role
    res.json({ message: `✅ Role '${role}' assigned to user ${userId}` });
  } catch (error) {
    res.status(500).json({ error: "Error assigning role." });
  }
};

module.exports = { getAllUsers, assignRoleManually };

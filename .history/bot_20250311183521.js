require("dotenv").config({ path: "C:/Users/nipun/discord-role-bot/.env" }); // Load .env
const { Client, GatewayIntentBits, PermissionsBitField } = require("discord.js");
const mongoose = require("./backend/config/database"); // Connect to MongoDB
const UserMessage = require("./backend/models/messageSchema"); // Import Message Schema
const { processModeratorCommand } = require("./groqhelper"); // Import Groq AI Helper

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent, // Allows bot to track messages
  ],
});

client.once("ready", () => {
  console.log(`✅ Bot is online as ${client.user.tag}`);
});

// ✅ Track User Messages in MongoDB
client.on("messageCreate", async (message) => {
  if (message.author.bot) return; // Ignore bot messages

  try {
    const user = await UserMessage.findOneAndUpdate(
      { userId: message.author.id },
      { $inc: { messageCount: 1 }, username: message.author.username }, // Increment message count
      { upsert: true, new: true }
    );

    console.log(`🔹 Updated Message Count: ${user.username} (${user.messageCount} messages)`);
  } catch (error) {
    console.error("❌ Error updating message count:", error);
  }
});

// ✅ AI-Based Role Assignment Using Real Data
client.on("messageCreate", async (message) => {
  if (message.content.startsWith("!roleAI")) {
    const moderatorInstruction = message.content.slice(8).trim();

    if (!moderatorInstruction) {
      return message.reply("❌ Please provide a role command! Example: `!roleAI Assign 'Trusted' role to users with 500+ messages.`");
    }

    message.reply("⏳ Processing your command with AI...");

    // Call Groq AI to process the instruction
    const aiResponse = await processModeratorCommand(moderatorInstruction);
    if (!aiResponse || aiResponse.action !== "assign_role") {
      return message.reply("❌ AI could not process the command.");
    }

    console.log("🔹 AI Parsed Response:", aiResponse);

    const { role: roleName, condition } = aiResponse;
    const role = message.guild.roles.cache.find((r) => r.name.toLowerCase() === roleName.toLowerCase());

    if (!role) {
      return message.reply(`❌ Role '${roleName}' not found.`);
    }

    // Extract message condition (e.g., "messages >= 5")
    const match = condition.match(/messages\s*>=\s*(\d+)/);
    if (!match) {
      return message.reply("❌ AI response condition is not in the expected format.");
    }

    const requiredMessages = parseInt(match[1]);
    const users = await UserMessage.find({ messageCount: { $gte: requiredMessages } });

    let assignedUsers = 0;
    for (const user of users) {
      try {
        const member = await message.guild.members.fetch(user.userId);
        if (member) {
          await member.roles.add(role);
          assignedUsers++;
        }
      } catch (error) {
        console.error(`❌ Failed to assign role to ${user.username}:`, error);
      }
    }

    if (assignedUsers > 0) {
      message.reply(`✅ Assigned '${role.name}' to ${assignedUsers} users with at least ${requiredMessages} messages.`);
    } else {
      message.reply(`⚠️ No users met the condition (${requiredMessages}+ messages) for '${role.name}'.`);
    }
  }
});

// ✅ Command to List All Roles
client.on("messageCreate", async (message) => {
  if (message.content === "!listRoles") {
    console.log("✅ !listRoles command received!");

    const roles = message.guild.roles.cache;
    if (!roles.size) {
      return message.reply("❌ No roles found on this server.");
    }

    const roleNames = roles.map((role) => `• ${role.name}`).join("\n");
    console.log("Available Roles:\n" + roleNames);

    message.reply(`Here are the roles available:\n${roleNames}`);
  }
});

// ✅ Manual Role Management (!addRole & !removeRole)
client.on("messageCreate", async (message) => {
  if (message.author.bot) return; // Ignore bot messages

  const args = message.content.split(" ");
  const command = args[0];

  // !addRole @user RoleName
  if (command === "!addRole") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return message.reply("❌ You don’t have permission to manage roles.");
    }

    const member = message.mentions.members.first();
    const roleName = args.slice(2).join(" ").trim().toLowerCase();

    if (!member) {
      return message.reply("❌ Please mention a user! Example: `!addRole @user RoleName`");
    }

    const role = message.guild.roles.cache.find((r) => r.name.toLowerCase() === roleName);

    if (!role) {
      return message.reply(`❌ Role '${roleName}' not found! Use \`!listRoles\` to see available roles.`);
    }

    try {
      await member.roles.add(role);
      message.reply(`✅ Successfully added **${role.name}** role to ${member.user.username}`);
    } catch (error) {
      console.error("Error assigning role:", error);
      message.reply("❌ I don't have permission to assign this role. Make sure my role is above the role you're assigning.");
    }
  }

  // !removeRole @user RoleName
  if (command === "!removeRole") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return message.reply("❌ You don’t have permission to manage roles.");
    }

    const member = message.mentions.members.first();
    const roleName = args.slice(2).join(" ").trim().toLowerCase();

    if (!member) {
      return message.reply("❌ Please mention a user! Example: `!removeRole @user RoleName`");
    }

    const role = message.guild.roles.cache.find((r) => r.name.toLowerCase() === roleName);

    if (!role) {
      return message.reply(`❌ Role '${roleName}' not found! Use \`!listRoles\` to see available roles.`);
    }

    try {
      await member.roles.remove(role);
      message.reply(`✅ Removed **${role.name}** role from ${member.user.username}`);
    } catch (error) {
      console.error("Error removing role:", error);
      message.reply("❌ I don't have permission to remove this role.");
    }
  }
});

// ✅ Bot login
client.login(process.env.BOT_TOKEN);

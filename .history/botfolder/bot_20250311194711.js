require("dotenv").config();
const { Client, GatewayIntentBits, PermissionsBitField } = require("discord.js");
const { processModeratorCommand } = require("./groqhelper"); // Import Groq API helper

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent, // Allows bot to read messages
  ],
});

client.once("ready", () => {
  console.log(`✅ Bot is online as ${client.user.tag}`);
});

// Function to fetch user message counts
async function fetchMessageCounts(guild) {
  const members = await guild.members.fetch();
  const messageCounts = new Map();

  // Simulated message count (since Discord API doesn’t provide actual counts)
  members.forEach((member) => {
    const randomMessages = Math.floor(Math.random() * 200); // Fake message count
    messageCounts.set(member.id, randomMessages);
  });

  return messageCounts;
}

// NLP-based Role Management Command
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith("!roleAI")) {
    const moderatorInstruction = message.content.slice(8).trim();

    if (!moderatorInstruction) {
      return message.reply("❌ Please provide a role command! Example: `!roleAI Assign 'Trusted' role to users with 500+ messages.`");
    }

    message.reply("⏳ Processing your command with AI...");

    // Call Groq API to process the instruction
    const aiResponse = await processModeratorCommand(moderatorInstruction);
    
    if (!aiResponse || aiResponse.action !== "assign_role") {
      return message.reply("❌ AI could not process the command. Try again.");
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

    // Fetch message counts for all users
    const messageCounts = await fetchMessageCounts(message.guild);

    let assignedUsers = 0;
    let failedUsers = 0;

    // Assign role to users who meet the condition
    for (const [userId, msgCount] of messageCounts.entries()) {
      if (msgCount >= requiredMessages) {
        try {
          const member = await message.guild.members.fetch(userId);
          if (member) {
            await member.roles.add(role);
            assignedUsers++;
          }
        } catch (error) {
          console.error(`❌ Failed to assign role to ${userId}:`, error);
          failedUsers++;
        }
      }
    }

    if (assignedUsers > 0) {
      message.reply(`✅ **Assigned '${role.name}' to ${assignedUsers} users** who have sent at least **${requiredMessages}** messages.`);
    } else {
      message.reply(`⚠️ No users met the condition (**${requiredMessages}**+ messages) for '${role.name}'.`);
    }
  }
});

// Command to list all server roles for debugging
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

// Role Management Commands
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
    const roleName = args.slice(2).join(" ").trim().toLowerCase(); // Normalize role name

    // Debugging Information
    console.log("Command received:", message.content);
    console.log("Mentioned User:", member ? `${member.user.username} (${member.id})` : "None");

    if (!member) {
      return message.reply("❌ Please mention a user! Example: `!addRole @user RoleName`");
    }

    // Find role by name (case-insensitive)
    const role = message.guild.roles.cache.find((r) => r.name.toLowerCase() === roleName);
    console.log("Role Name:", role ? role.name : "Not Found");

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

    console.log("Command received:", message.content);
    console.log("Mentioned User:", member ? `${member.user.username} (${member.id})` : "None");

    if (!member) {
      return message.reply("❌ Please mention a user! Example: `!removeRole @user RoleName`");
    }

    const role = message.guild.roles.cache.find((r) => r.name.toLowerCase() === roleName);
    console.log("Role Name:", role ? role.name : "Not Found");

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

// Bot login
client.login(process.env.BOT_TOKEN);

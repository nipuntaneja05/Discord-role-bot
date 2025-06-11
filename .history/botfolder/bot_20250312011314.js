const path = require("path");
require("dotenv").config({ path: path.resolve("C:/Users/nipun/discord-role-bot/.env") });

const { Client, GatewayIntentBits, PermissionsBitField } = require("discord.js");
const axios = require("axios"); // ✅ Use axios instead of fetch (fixes Node.js issue)

const TOKEN = process.env.BOT_TOKEN;
const GUILD_ID = process.env.GUILD_ID;

if (!TOKEN) {
  console.error("❌ ERROR: BOT_TOKEN is missing from .env file!");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent, // Needed to read messages
  ],
});

// Store message counts in memory (resets on bot restart)
const userMessageCounts = new Map();

client.once("ready", async () => {
  console.log(`✅ Bot is online as ${client.user.tag}`);

  // Initialize message tracking
  const guild = await client.guilds.fetch(GUILD_ID);
  const members = await guild.members.fetch();
  
  members.forEach(member => {
    userMessageCounts.set(member.id, 0);
  });

  console.log("🔹 Message tracking initialized.");
});

/**
 * Fetch message count from Discord API (Live + Last 100 Messages)
 */
async function fetchUserMessageCount(userId, guild) {
  let totalMessages = userMessageCounts.get(userId) || 0;

  try {
    const channels = await guild.channels.fetch();

    for (const [, channel] of channels) {
      if (channel.isTextBased()) {
        const messages = await channel.messages.fetch({ limit: 100 });
        totalMessages += messages.filter(msg => msg.author.id === userId).size;
      }
    }

    userMessageCounts.set(userId, totalMessages); // Store updated count
  } catch (error) {
    console.error(`❌ Error fetching messages for ${userId}:`, error);
  }

  return totalMessages;
}

/**
 * Assign roles based on message count
 */
async function assignRoles(roleData) {
  try {
    console.log(`🔹 Processing role assignment: ${JSON.stringify(roleData)}`);

    const guild = await client.guilds.fetch(GUILD_ID);
    const members = await guild.members.fetch();

    // Extract the condition (operator and value)
    const conditionMatch = roleData.condition.match(/messages\s*([<>!=]=?)\s*(\d+)/);
    if (!conditionMatch) {
      console.log("❌ Invalid condition format:", roleData.condition);
      return;
    }

    const operator = conditionMatch[1]; // "<", "<=", ">", ">=", "==", "!="
    const requiredMessages = parseInt(conditionMatch[2]);
    const role = guild.roles.cache.find(r => r.name.trim().toLowerCase() === roleData.role.trim().toLowerCase());

    if (!role) {
      console.log(`❌ Role "${roleData.role}" not found in the server.`);
      return;
    }

    let assignedUsers = 0;

    for (const [memberId, member] of members) {
      let userMessageCount = await fetchUserMessageCount(memberId, guild);

      // ✅ Handle all operators dynamically
      let conditionMet = false;
      switch (operator) {
        case ">":
          conditionMet = userMessageCount > requiredMessages;
          break;
        case ">=":
          conditionMet = userMessageCount >= requiredMessages;
          break;
        case "<":
          conditionMet = userMessageCount < requiredMessages;
          break;
        case "<=":
          conditionMet = userMessageCount <= requiredMessages;
          break;
        case "==":
          conditionMet = userMessageCount === requiredMessages;
          break;
        case "!=":
          conditionMet = userMessageCount !== requiredMessages;
          break;
        default:
          console.log(`❌ Unsupported operator: ${operator}`);
          return;
      }

      if (conditionMet && !member.roles.cache.has(role.id)) {
        await member.roles.add(role);
        console.log(`✅ Assigned '${roleData.role}' to ${member.user.tag} (Messages: ${userMessageCount})`);
        assignedUsers++;
      }
    }

    console.log(`✅ Assigned '${roleData.role}' to ${assignedUsers} users.`);
  } catch (error) {
    console.error("❌ Error in role assignment:", error);
  }
}

/**
 * Track messages in real-time and update count
 */
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  let userId = message.author.id;
  let currentCount = userMessageCounts.get(userId) || 0;
  userMessageCounts.set(userId, currentCount + 1);
});

/**
 * Handle Role Assignment from Web Dashboard
 */
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith("!roleAI")) {
    const command = message.content.slice(8).trim();

    if (!command) {
      return message.reply("❌ Please provide a role command! Example: `!roleAI Assign 'Trusted' role to users with 500+ messages.`");
    }

    message.reply("⏳ Processing your command with AI...");

    try {
      const response = await axios.post("http://localhost:5000/process-command", {
        command,
      });

      const aiResponse = response.data;
      console.log("🔹 AI Response from Backend:", aiResponse);

      if (aiResponse.error) {
        return message.reply(`❌ AI Error: ${aiResponse.error}`);
      }

      await assignRoles(aiResponse);
      message.reply(`✅ AI processed command: Role '${aiResponse.role}' will be assigned based on criteria.`);
    } catch (error) {
      console.error("❌ Error calling backend:", error);
      message.reply("❌ Failed to process the command.");
    }
  }
});

/**
 * Debug Command: List all server roles
 */
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

// Expose assignRoles function for backend use
module.exports = { assignRoles };

// Login the bot
client.login(TOKEN);

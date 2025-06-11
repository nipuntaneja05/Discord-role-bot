const path = require("path");
require("dotenv").config({ path: path.resolve("C:/Users/nipun/discord-role-bot/.env") });

const { Client, GatewayIntentBits, PermissionsBitField } = require("discord.js");

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
    GatewayIntentBits.MessageContent,
  ],
});

client.once("ready", () => {
  console.log(`✅ Bot is online as ${client.user.tag}`);
});

/**
 * Function to assign roles based on message count condition
 */
async function assignRoles(roleData) {
  try {
    console.log(`🔹 Processing role assignment: ${JSON.stringify(roleData)}`);

    const guild = await client.guilds.fetch(GUILD_ID);
    const members = await guild.members.fetch();

    for (const [memberId, member] of members) {
      let userMessageCount = await fetchUserMessageCount(memberId, guild);

      const requiredMessages = roleData.condition.value;

      if (userMessageCount >= requiredMessages) {
        let role = guild.roles.cache.find(r => r.name.toLowerCase() === roleData.role.toLowerCase());

        if (role) {
          if (!member.roles.cache.has(role.id)) {
            await member.roles.add(role);
            console.log(`✅ Assigned '${roleData.role}' to ${member.user.tag} (Messages: ${userMessageCount})`);
          } else {
            console.log(`ℹ️ ${member.user.tag} already has the '${roleData.role}' role.`);
          }
        } else {
          console.log(`❌ Role "${roleData.role}" not found in the server.`);
        }
      }
    }
  } catch (error) {
    console.error("❌ Error in role assignment:", error);
  }
}

/**
 * Function to fetch user message count from Discord API
 */
async function fetchUserMessageCount(userId, guild) {
  try {
    let messageCount = 0;
    const channels = await guild.channels.fetch();

    for (const [channelId, channel] of channels) {
      if (channel.isTextBased()) {
        const messages = await channel.messages.fetch({ limit: 100 });
        messageCount += messages.filter(msg => msg.author.id === userId).size;
      }
    }

    return messageCount;
  } catch (error) {
    console.error(`❌ Error fetching messages for ${userId}:`, error);
    return 0;
  }
}

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

// Command to manually trigger role assignment
client.on("messageCreate", async (message) => {
  if (message.content.startsWith("!roleAI")) {
    const command = message.content.slice(8).trim();

    if (!command) {
      return message.reply("❌ Please provide a role command! Example: `!roleAI Assign 'Trusted' role to users with 500+ messages.`");
    }

    message.reply("⏳ Processing your command with AI...");

    try {
      const response = await fetch("http://localhost:5000/process-command", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ command }),
      });

      const aiResponse = await response.json();
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

// Expose assignRoles function for backend
module.exports = { assignRoles };

// Login the bot
client.login(TOKEN);

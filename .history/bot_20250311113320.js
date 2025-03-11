require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");

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

// Function to add a role
client.on("messageCreate", async (message) => {
  if (message.author.bot) return; // Ignore bot messages

  const args = message.content.split(" ");
  const command = args[0];

  // !addRole @user RoleName
  if (command === "!addRole") {
    if (!message.member.permissions.has("MANAGE_ROLES")) {
      return message.reply("❌ You don’t have permission to manage roles.");
    }

    const member = message.mentions.members.first();
    const roleName = args.slice(2).join(" ");
    const role = message.guild.roles.cache.find((r) => r.name === roleName);

    if (!member || !role) {
      return message.reply("❌ Invalid command usage! Try: `!addRole @user RoleName`");
    }

    try {
      await member.roles.add(role);
      message.reply(`✅ Successfully added **${role.name}** role to ${member.user.username}`);
    } catch (error) {
      console.error(error);
      message.reply("❌ I don't have permission to assign this role.");
    }
  }

  // !removeRole @user RoleName
  if (command === "!removeRole") {
    if (!message.member.permissions.has("MANAGE_ROLES")) {
      return message.reply("❌ You don’t have permission to manage roles.");
    }

    const member = message.mentions.members.first();
    const roleName = args.slice(2).join(" ");
    const role = message.guild.roles.cache.find((r) => r.name === roleName);

    if (!member || !role) {
      return message.reply("❌ Invalid command usage! Try: `!removeRole @user RoleName`");
    }

    try {
      await member.roles.remove(role);
      message.reply(`✅ Removed **${role.name}** role from ${member.user.username}`);
    } catch (error) {
      console.error(error);
      message.reply("❌ I don't have permission to remove this role.");
    }
  }
});

// Bot login
client.login(process.env.BOT_TOKEN);

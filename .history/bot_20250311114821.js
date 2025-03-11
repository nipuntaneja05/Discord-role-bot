require("dotenv").config();
const { Client, GatewayIntentBits, PermissionsBitField } = require("discord.js");

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
    const roleName = args.slice(2).join(" ").toLowerCase(); // Case-insensitive search
    const role = message.guild.roles.cache.find((r) => r.name.toLowerCase() === roleName);

    // Debugging Information
    console.log("Command received:", message.content);
    console.log("Mentioned User:", member ? member.user.username : "None");
    console.log("Role Name:", role ? role.name : "Not Found");

    if (!member) {
      return message.reply("❌ Please mention a user! Example: `!addRole @user RoleName`");
    }

    if (!role) {
      return message.reply(`❌ Role '${roleName}' not found! Make sure it exists.`);
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
    const roleName = args.slice(2).join(" ").toLowerCase();
    const role = message.guild.roles.cache.find((r) => r.name.toLowerCase() === roleName);

    // Debugging Information
    console.log("Command received:", message.content);
    console.log("Mentioned User:", member ? member.user.username : "None");
    console.log("Role Name:", role ? role.name : "Not Found");

    if (!member) {
      return message.reply("❌ Please mention a user! Example: `!removeRole @user RoleName`");
    }

    if (!role) {
      return message.reply(`❌ Role '${roleName}' not found! Make sure it exists.`);
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

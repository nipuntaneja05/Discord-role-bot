require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");

// Create bot instance with required permissions
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
});

// When bot is ready
client.once("ready", () => {
  console.log(`✅ Bot is online as ${client.user.tag}`);
});

// When a message is sent
client.on("messageCreate", (message) => {
  if (message.content === "!ping") {
    message.reply("Pong! 🏓");
  }
});

// Log in using bot token
client.login(process.env.BOT_TOKEN);

require("dotenv").config({ path:"C:/Users/nipun/discord-role-bot/.env" }); // Manually load .env from root
const mongoose = require("mongoose");

const mongoURI = process.env.MONGO_URI;

if (!mongoURI) {
  console.error("❌ MONGO_URI is missing in .env file!");
  process.exit(1);
}

const connectDB = async () => {
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;

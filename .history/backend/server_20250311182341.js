require("dotenv").config({ path: "C:/Users/nipun/discord-role-bot/.env" }); // Manually load .env from root
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/database");
const roleRoutes = require("./routes/roleRoutes");

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use("/api", roleRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

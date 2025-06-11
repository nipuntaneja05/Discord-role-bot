const path = require("path");
require("dotenv").config({ path: path.resolve("C:/Users/nipun/discord-role-bot/.env") });

console.log("✅ Loaded Groq API Key:", process.env.GROQ_API_KEY ? "✔️ Key Found" : "❌ Key NOT Found");

const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY;

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

app.post("/process-command", async (req, res) => {
  const { command } = req.body;

  if (!command) {
    return res.status(400).json({ error: "Command is required" });
  }

  try {
    console.log(`🔹 Sending command to Groq API: ${command}`);

    const response = await axios.post(
      GROQ_API_URL,
      {
        model: "llama3-70b-8192", // Ensure correct model
        messages: [
          {
            role: "user",
            content: `Analyze this command and return the role management details in JSON format ONLY, without extra text.
                      Example output:
                      {
                        "action": "assign_role",
                        "role": "member",
                        "condition": "messages >= 5"
                      }
                      Command: "${command}"`,
          },
        ],
        temperature: 0.2,
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const aiResponse = response.data.choices[0].message.content;
    console.log("✅ Groq API Response:", aiResponse);

    try {
      const parsedResponse = JSON.parse(aiResponse);
      return res.json(parsedResponse);
    } catch (error) {
      console.error("❌ Error parsing AI response:", error);
      return res.status(500).json({ error: "Failed to parse AI response." });
    }
  } catch (error) {
    console.error("❌ Groq API Error:", error.response?.data || error.message);
    return res.status(500).json({ error: error.response?.data || "Groq API request failed" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

require("dotenv").config();
const axios = require("axios");

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/v1/chat/completions"; // Example endpoint

async function processModeratorCommand(command) {
  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: "mixtral-8x7b", // Change model if needed
        messages: [{ role: "user", content: `Analyze this command and extract role management details: "${command}"` }],
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
    console.log("🔹 Groq API Response:", aiResponse);

    // Convert AI response to JSON
    try {
      return JSON.parse(aiResponse);
    } catch (error) {
      console.error("❌ Error parsing AI response:", error);
      return null;
    }
  } catch (error) {
    console.error("❌ Error calling Groq API:", error.response?.data || error.message);
    return null;
  }
}

module.exports = { processModeratorCommand };

require("dotenv").config();
const axios = require("axios");

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
 // Example endpoint

async function processModeratorCommand(command) {
  try {
    const response = await axios.post(
        GROQ_API_URL,
        {
          model: "llama3-70b-8192", // Ensure the correct model is used
          messages: [
            {
              role: "user",
              content: `Analyze this command and return the role management details in JSON format ONLY, without any extra text. 
                        Example output:
                        {
                          "action": "assign_role",
                          "role": "member",
                          "condition": "messages >= 5"
                        }
                        Command: "${command}"`
            }
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

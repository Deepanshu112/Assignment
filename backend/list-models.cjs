require('dotenv').config();
const fetch = global.fetch;


async function listModels() {
  try {
    const url = "https://generativelanguage.googleapis.com/v1beta/models";
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY
      }
    });

    const data = await res.json();
    console.log("Available models:");
    console.log(data);
  } catch (err) {
    console.error("Error listing models:", err);
  }
}

listModels();

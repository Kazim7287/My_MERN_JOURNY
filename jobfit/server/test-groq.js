require("dotenv").config();

const https = require("https");

const API_KEY = process.env.GROQ_API_KEY;
console.log("Key exists:", !!API_KEY);
console.log("Key prefix:", API_KEY?.substring(0, 15));

const data = JSON.stringify({
  model: "llama-3.1-8b-instant",
  messages: [
    { role: "user", content: "Say: 'Groq API works!'" }
  ],
  max_tokens: 50,
});

const req = https.request({
  hostname: "api.groq.com",
  path: "/openai/v1/chat/completions",
  method: "POST",
  headers: {
    "Authorization": `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  },
}, (res) => {
  let body = "";
  res.on("data", chunk => body += chunk);
  res.on("end", () => {
    console.log("Status:", res.statusCode);
    console.log("Response:", body.substring(0, 300));
    
    if (res.statusCode === 200) {
      console.log("✅ GROQ API WORKS!");
    } else {
      console.log("❌ API call failed");
    }
  });
});

req.on("error", (err) => console.error("Error:", err.message));
req.write(data);
req.end();
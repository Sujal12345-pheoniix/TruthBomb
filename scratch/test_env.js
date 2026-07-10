const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

async function testOpenRouter() {
  if (!process.env.OPENROUTER_API_KEY) {
    console.log("No OpenRouter key");
    return;
  }
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: "hello" }],
        max_tokens: 100,
      })
    });
    if (!res.ok) {
      console.error("OpenRouter failed status:", res.status, await res.text());
      return;
    }
    const data = await res.json();
    console.log("OpenRouter success:", data.choices?.[0]?.message?.content);
  } catch (err) {
    console.error("OpenRouter failed:", err);
  }
}

testOpenRouter();

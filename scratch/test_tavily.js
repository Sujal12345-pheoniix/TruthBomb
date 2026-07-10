const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

async function testTavily() {
  const apiKey = process.env.TAVILY_API_KEY;
  console.log("Tavily key:", apiKey);
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query: "OpenAI GPT-5 launch date 2024 fact check",
        search_depth: "advanced",
        max_results: 3,
      })
    });
    if (!res.ok) {
      console.error("Tavily failed status:", res.status, await res.text());
      return;
    }
    const data = await res.json();
    console.log("Tavily success, results count:", data.results?.length);
    if (data.results && data.results.length > 0) {
      console.log("First result title:", data.results[0].title);
      console.log("First result snippet:", data.results[0].content);
    }
  } catch (err) {
    console.error("Tavily failed:", err);
  }
}

testTavily();

/**
 * Unified LLM Client Wrapper
 * Tries available LLM providers in order: Groq -> OpenRouter -> OpenAI -> Gemini
 * This ensures fault tolerance and handles 429 quota exhaustion gracefully.
 */

export interface LLMOptions {
  responseFormatJSON?: boolean;
  maxTokens?: number;
  temperature?: number;
}

export async function callLLM(
  systemPrompt: string,
  userPrompt: string,
  options: LLMOptions = {}
): Promise<string> {
  const providers = [];

  if (process.env.GROQ_API_KEY) {
    providers.push({
      name: "groq",
      fn: () => callGroq(systemPrompt, userPrompt, options),
    });
  }

  if (process.env.OPENROUTER_API_KEY) {
    providers.push({
      name: "openrouter",
      fn: () => callOpenRouter(systemPrompt, userPrompt, options),
    });
  }

  if (process.env.OPENAI_API_KEY) {
    providers.push({
      name: "openai",
      fn: () => callOpenAI(systemPrompt, userPrompt, options),
    });
  }

  if (process.env.GEMINI_API_KEY) {
    providers.push({
      name: "gemini",
      fn: () => callGemini(systemPrompt, userPrompt, options),
    });
  }

  if (providers.length === 0) {
    throw new Error("No LLM provider API keys configured in .env");
  }

  let lastError: Error | null = null;
  for (const provider of providers) {
    try {
      console.log(`LLM Attempting provider: ${provider.name}`);
      const response = await provider.fn();
      if (response && response.trim()) {
        console.log(`LLM Provider ${provider.name} succeeded.`);
        return response;
      }
    } catch (err) {
      console.warn(`LLM Provider ${provider.name} failed:`, err);
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError || new Error("All LLM providers failed to return a response");
}

async function callGroq(
  systemPrompt: string,
  userPrompt: string,
  options: LLMOptions
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: options.responseFormatJSON ? { type: "json_object" } : undefined,
      max_tokens: options.maxTokens ?? 2500,
      temperature: options.temperature ?? 0.1,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Groq API returned status ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function callOpenRouter(
  systemPrompt: string,
  userPrompt: string,
  options: LLMOptions
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: options.responseFormatJSON ? { type: "json_object" } : undefined,
      max_tokens: options.maxTokens ?? 2000,
      temperature: options.temperature ?? 0.1,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter API returned status ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function callOpenAI(
  systemPrompt: string,
  userPrompt: string,
  options: LLMOptions
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: options.responseFormatJSON ? { type: "json_object" } : undefined,
      max_tokens: options.maxTokens ?? 2500,
      temperature: options.temperature ?? 0.1,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI API returned status ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function callGemini(
  systemPrompt: string,
  userPrompt: string,
  options: LLMOptions
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const userContent = `System instructions: ${systemPrompt}\n\n---\n\nUser request: ${userPrompt}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: userContent }],
        },
      ],
      generationConfig: {
        temperature: options.temperature ?? 0.1,
        responseMimeType: options.responseFormatJSON ? "application/json" : undefined,
        maxOutputTokens: options.maxTokens ?? 2548,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini API returned status ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

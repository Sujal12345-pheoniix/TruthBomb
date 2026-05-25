export function getTavilyKey(): string | undefined {
  return process.env.TAVILY_API_KEY ?? process.env.TAVILEY_API_KEY;
}

export function hasOpenAI(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function hasGemini(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export function hasBrave(): boolean {
  return Boolean(process.env.BRAVE_SEARCH_API_KEY);
}

export function hasExa(): boolean {
  return Boolean(process.env.EXA_API_KEY);
}

export function hasRedis(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

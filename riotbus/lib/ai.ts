type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatOptions = {
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
};

export async function callOpenAICompatible({
  baseUrl = process.env.DEFAULT_AI_BASE_URL,
  apiKey = process.env.DEEPSEEK_API_KEY,
  model = process.env.DEFAULT_AI_MODEL,
  messages,
  temperature = 0.8,
}: ChatOptions) {
  if (!baseUrl || !apiKey || !model) {
    throw new Error("AI provider is not configured.");
  }

  const endpoint = `${baseUrl.replace(/\/$/, "")}/chat/completions`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      stream: false,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`AI request failed: ${response.status} ${text}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("AI provider returned an empty response.");
  }

  return content;
}

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

async function callOpenAICompatible({
  baseUrl,
  apiKey,
  model,
  messages,
  temperature = 0.8,
}: {
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
}) {
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

export async function onRequestPost(context: {
  request: Request;
  env?: Record<string, string>;
}) {
  let body: { baseUrl?: string; apiKey?: string; model?: string } | null;
  try {
    body = (await context.request.json()) as
      | { baseUrl?: string; apiKey?: string; model?: string }
      | null;
  } catch {
    body = null;
  }

  if (!body?.baseUrl || !body?.apiKey || !body?.model) {
    return new Response(
      JSON.stringify({ ok: false, message: "base_url、api_key、model 都要填。" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    await callOpenAICompatible({
      baseUrl: body.baseUrl,
      apiKey: body.apiKey,
      model: body.model,
      temperature: 0,
      messages: [
        {
          role: "user",
          content: "Reply with exactly: ok",
        },
      ],
    });

    return new Response(
      JSON.stringify({ ok: true, message: "API 可用，可以发车。" }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        message: error instanceof Error ? error.message : "API 校验失败。",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
}

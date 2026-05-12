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
  type BattleMode = "mean" | "neutral";

  let body: {
    mode?: BattleMode;
    artistA?: string;
    artistB?: string;
    conversation?: string;
    provider?: { baseUrl?: string; apiKey?: string; model?: string };
  } | null;
  try {
    body = (await context.request.json()) as typeof body;
  } catch {
    body = null;
  }

  const mode: BattleMode = body?.mode ?? "mean";
  const artistA = body?.artistA ?? "artist A";
  const artistB = body?.artistB ?? "artist B";
  const conversation = body?.conversation ?? "暂无对话内容。";

  const tone =
    mode === "mean"
      ? "生成一个有梗、有 mean 味、但不造谣的短标题和短总结。标题不要使用 <shade> 标签，黑称直接写纯文本；正文里的黑称、粉丝黑称、攻击性粉圈语料才用 <shade>内容</shade> 包住。标题要像粉圈战报，不要端水，优先使用赢家美称 + 输家黑称。不要出现"判词、本地库、补刀、正文"等模板词。"
      : "生成一个客观清楚、适合分享的短标题和短总结。";

  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        "你是 RiotBus 的分享报告编辑。请输出适合单张分享图的中文标题和正文。标题必须少于 24 个中文字符，正文控制在 120 到 180 个中文字符，不要写"正文："两个字。",
    },
    {
      role: "user",
      content: `${tone}

PK：${artistA} vs ${artistB}
对话内容：
${conversation}

请输出：
标题：
正文内容：`,
    },
  ];

  try {
    const output = await callOpenAICompatible({
      baseUrl: body?.provider?.baseUrl,
      apiKey: body?.provider?.apiKey,
      model: body?.provider?.model,
      messages,
      temperature: mode === "mean" ? 0.9 : 0.5,
    });

    const normalizedOutput = output.trim();
    const explicitTitle = normalizedOutput.match(/标题[:：]\s*([^\n]+)/u)?.[1];
    const explicitContent = normalizedOutput.match(/正文内容?[:：]\s*([\s\S]+)/u)?.[1];
    const [rawTitle, ...rest] = normalizedOutput.split("\n");

    return new Response(
      JSON.stringify({
        title:
          (explicitTitle ?? rawTitle)
            .replace(/^标题[:：]\s*/, "")
            .replace(/<shade>([\s\S]+?)<\/shade>/g, "$1")
            .trim() || `${artistA} vs ${artistB}`,
        content:
          (explicitContent ?? rest.join("\n"))
            .replace(/^\s*(正文|正文内容)[:：]\s*/u, "")
            .replace(/^\s*标题[:：].*\n?/u, "")
            .replace(/(^|\n)\s*(总判词|判词|数据|本地库补刀|最终补刀|补刀|总结)[:：]\s*/gu, "$1")
            .trim() || output.replace(/^\s*(正文|正文内容)[:：]\s*/u, ""),
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        title: `${artistA} vs ${artistB}`,
        content:
          error instanceof Error
            ? error.message
            : "AI 总结失败，稍后再试。",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

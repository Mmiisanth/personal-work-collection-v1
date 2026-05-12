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
  type MetricKey = "sales" | "streaming" | "awards" | "reviews";

  let body: {
    mode?: BattleMode;
    artistA?: string;
    artistB?: string;
    metrics?: MetricKey[];
    provider?: { baseUrl?: string; apiKey?: string; model?: string };
    dataSummary?: string;
    userQuestion?: string;
  } | null;
  try {
    body = (await context.request.json()) as typeof body;
  } catch {
    body = null;
  }

  const mode: BattleMode = body?.mode ?? "mean";
  const artistA = body?.artistA ?? "artist A";
  const artistB = body?.artistB ?? "artist B";
  const metrics: MetricKey[] = body?.metrics?.length
    ? body.metrics
    : ["sales", "streaming"];

  const metricLabels: Record<MetricKey, string> = {
    sales: "销量",
    streaming: "流媒体人气",
    awards: "Grammy奖项",
    reviews: "乐评",
  };

  const meanWritingProtocol = `刻薄女孩模式写作协议：
- 先根据页面数据定胜负，不端水。第一段必须明确谁赢谁输。
- 赢家优先用正常称呼/美称，输家优先用黑称；黑称、粉丝黑称必须写成 <shade>黑称</shade>，不要输出波浪线。
- 黑称作为称呼时至少用两个字以上，例如 <shade>交姐</shade>、<shade>尖姐</shade>、<shade>死胎尖</shade>。单字种子只用于动词/谐音造句，不要单独当称呼高亮。
- 别名和本名不要叠写。错误：<shade>交姐</shade> Taylor。正确：<shade>交姐</shade> 或 Taylor，二选一。第一次需要解释时才可写"霉女帝（Taylor Swift）"。
- 不要输出"判词：""数据：""本地库补刀：""最终补刀：""总判词："这类模板词或技术词，用户看到的是成品文案，不是 prompt 结构。
- 不要把整句或整段都用 ** 加粗；需要强调时只加粗 2-8 个字，且不要把 <shade> 标签包在 ** 里面。
- 每个维度要自然融进句子里，例如"销量上，<shade>尖姐</shade>被热力大巴撞飞"，不要写成"销量：判词：xxx / 数据：xxx"。
- 每个维度必须尽量结合本地内容库里的攻击角度、荣誉反驳、标题素材或挽尊话术。不要只复述数字。
- 如果总体赢家在某个单项里落后，不要自乱阵脚，不要因此改总胜负；要像粉圈吵架一样灵巧转移到赢家优势，再压低对方这个单项的含金量。
- 逆风挽尊固定话术：当支持的赢家在某个单项劣势时，优先使用"xx迷不要自乱阵脚"，再把话题拉回对方更大的短板。例如 Taylor 总体赢但乐评输给 Gaga 时，可以写"交迷们不要自乱阵脚，专注 <shade>死胎尖</shade> 通类挂 0；乐评赢一嘴，销量和流媒还是被热力大巴撞飞。"
- 踩含金量固定映射必须收窄使用：对方销量好，就说"灌水"；对方流媒好，就说"大机器 pay 的"；对方乐评好，就说"搬床乐评、媒体搬来的"；对方奖项好，就说"pay 来的奖"。这些只能作为粉圈攻击角度，不能写成官方事实。
- 可以使用 oneCharacterShadeSeeds / wordplaySeeds 做谐音造词，例如"交出完美的答卷""尖出冠单""炸姐炸裂的成绩""伦出绝伦的成绩""聋不是劣势，龙可是帝王之相"。这些单字只放进动词、双关或短句里，每段最多 1-2 个，不能堆成乱码。
- wordplayExamples 是句式参考，不是硬事实；可以借结构和语气，但不能因此发明新数据或新黑料。
- 用户追问时先判断立场：如果用户赞同当前胜负，必须用"你看得很清"开头并顺着加码；如果用户反驳，就默认他在替输家说话，必须用"xx迷不要胡搅蛮缠"开头，xx 用输家的粉丝黑称。
- 回击用户时要坚定自己的判决，不要轻易改口；除非页面数据或本地内容库明显支持用户反驳。
- 允许粉圈毒舌、阴阳怪气、拉踩，但不要编造页面数据和本地内容库之外的新事实。
- 涉及争议、黑点、死亡、性相关、疾病等敏感素材时，只能作为"黑粉攻击角度/粉圈语境"使用，不要写成网站官方事实裁决。`;

  const neutralWritingProtocol = `清清白白模式写作协议：
- 客观、中立、无黑料，不主动挑事。
- 禁止输出"好的，这是为您生成的报告""以下是""清清白白模式PK报告"这类 AI 开场白，直接进入正文。
- 不要使用"总评：""客观说明："这类模板小标题；用自然段落写。
- 不要使用编号列表，避免 1/2/3 格式混乱；如果需要分点，用短段落自然承接。
- 禁止使用黑称、粉丝黑称、攻击性黑点、黑粉话术和 <shade> 标签。
- 可以使用正常称呼、艺人画像、荣誉点和结构化数据。
- 结论要克制，适合路人快速了解。`;

  const tone =
    mode === "mean" ? meanWritingProtocol : neutralWritingProtocol;

  const dataSummary = body?.dataSummary ?? "暂无结构化数据。";
  const ragContext = body?.userQuestion ? undefined : undefined;

  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        "你是 RiotBus 的欧美艺人 PK 报告助手。你只能根据页面数据和 RiotBus 本地内容库分析，不要编造事实。数据缺失时必须明确说缺失。",
    },
    {
      role: "user",
      content: `${tone}

请为这次 PK 生成一段中文报告。

艺人 A：${artistA}
艺人 B：${artistB}
已选维度：${metrics.map((m) => metricLabels[m]).join("、")}
已提供数据：
${dataSummary}
${ragContext ? `\nRiotBus 本地内容库：\n${ragContext}` : ""}
${body?.userQuestion ? `用户追问：${body.userQuestion}` : ""}

输出要求：
- 页面"已提供数据"优先级最高，RiotBus 本地内容库只能作为补充上下文
- 结构化数据、来源链接、人工补录数据可以当作事实使用
- 不要补充未出现在页面数据或本地内容库里的专辑、单曲、历史事件或销量事实
- ${mode === "mean" ? "输出 3-5 个自然短段落。第一段直接定胜负，后面把每个已选维度自然写进去；不要用"判词/数据/本地库/补刀/总结"当小标题。" : "输出 2-4 个自然短段落，直接写结论和依据；不要写开场客套、不要写"总评/客观说明"小标题、不要编号。"}
- 不要输出很长`,
    },
  ];

  try {
    const message = await callOpenAICompatible({
      baseUrl: body?.provider?.baseUrl,
      apiKey: body?.provider?.apiKey,
      model: body?.provider?.model,
      messages,
      temperature: mode === "mean" ? 0.9 : 0.5,
    });

    const cleanedMessage = message
      .replace(/^好的[，,]?\s*这是为您生成的.*?(报告|PK报告)[:：]?\s*/u, "")
      .replace(/^以下是.*?(报告|PK报告)[:：]?\s*/u, "")
      .replace(
        /(^|\n)\s*(总判词|判词|数据|本地库补刀|最终补刀|补刀|总结|总评|客观说明)[:：]\s*/gu,
        "$1",
      )
      .trim();

    return new Response(
      JSON.stringify({ message: cleanedMessage }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        message:
          error instanceof Error
            ? error.message
            : "AI 生成失败，稍后再试。",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

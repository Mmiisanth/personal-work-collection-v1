import type { BattleMode, MetricKey } from "@/lib/types";

const metricLabels: Record<MetricKey, string> = {
  sales: "销量",
  streaming: "流媒体",
  awards: "奖项",
  reviews: "乐评",
};

export function buildReportPrompt({
  mode,
  artistA,
  artistB,
  metrics,
  dataSummary,
}: {
  mode: BattleMode;
  artistA: string;
  artistB: string;
  metrics: MetricKey[];
  dataSummary: string;
}) {
  const tone =
    mode === "mean"
      ? "刻薄女孩模式：可以有梗、刻薄、带一点粉圈锐评感，但不能造谣，不能把未核实内容写成事实。"
      : "清清白白模式：客观、中立、无黑料，不主动挑事，适合路人快速了解。";

  return [
    {
      role: "system" as const,
      content:
        "你是 RiotBus 的欧美艺人 PK 报告助手。你只能根据用户提供的数据分析，不要编造事实。数据缺失时必须明确说缺失。",
    },
    {
      role: "user" as const,
      content: `${tone}

请为这次 PK 生成一段中文报告。

艺人 A：${artistA}
艺人 B：${artistB}
已选维度：${metrics.map((metric) => metricLabels[metric]).join("、")}
已提供数据：
${dataSummary}

输出要求：
- 先给 1 句总评
- 再分 2-4 点说明
- 如果是刻薄女孩模式，可以更有网感
- 如果是清清白白模式，要更克制客观
- 不要输出很长
- 只能使用“已提供数据”
- 不要补充未提供的专辑、单曲、历史事件或销量事实`,
    },
  ];
}

export function buildExportPrompt({
  mode,
  artistA,
  artistB,
  conversation,
}: {
  mode: BattleMode;
  artistA: string;
  artistB: string;
  conversation: string;
}) {
  const tone =
    mode === "mean"
      ? "生成一个有梗、有 mean 味、但不造谣的标题和总结。"
      : "生成一个客观清楚、适合分享的标题和总结。";

  return [
    {
      role: "system" as const,
      content:
        "你是 RiotBus 的分享报告编辑。请输出适合 PDF 分享的中文标题和正文。",
    },
    {
      role: "user" as const,
      content: `${tone}

PK：${artistA} vs ${artistB}
对话内容：
${conversation}

请输出：
标题：
正文：`,
    },
  ];
}

import { artists } from "@/data/artists";
import artistMetrics from "@/data/rag/structured/artist-metrics.json";
import { fetchRcArtistReviews, RC_GRADE_GUIDE, type RcArtistResult, type RcReview } from "@/lib/rc-agent";
import type { BattleMode, MetricKey } from "@/lib/types";

type WorkflowMetric = Extract<MetricKey, "reviews" | "awards" | "sales">;

export type AgentWorkflowResult = {
  query: {
    raw: string;
    artistIds: string[];
    metrics: WorkflowMetric[];
    intent: "compare" | "lookup";
  };
  evidenceText: string;
  summary: {
    artistId: string;
    artistName: string;
    rc: {
      source: "Robert Christgau";
      sourceUrl?: string;
      guide: string;
      reviews: Array<
        Pick<RcReview, "title" | "year" | "grade" | "gradeLabel" | "sourceUrl"> & {
          reviewSummaryZh: string;
        }
      >;
    };
    grammy?: {
      source: "Grammy";
      sourceUrl?: string;
      lines: string[];
    };
    sales?: {
      source: "ChartMasters";
      sourceUrl?: string;
      value: string;
    };
  }[];
};

type ArtistMetricEntry = {
  artistId: string;
  metric: MetricKey;
  value: Record<string, unknown>;
  sourcePlatform: string;
  sourceUrl: string;
  updatedAt?: string;
  confidence?: string;
  notes?: string;
};

const metricEntries = artistMetrics as ArtistMetricEntry[];

const workflowMetrics: WorkflowMetric[] = ["reviews", "awards", "sales"];

const metricKeywords: Array<{ metric: WorkflowMetric; pattern: RegExp }> = [
  { metric: "reviews", pattern: /rc|robert christgau|专辑|乐评|评分|评价|评语|口碑|critic/i },
  { metric: "awards", pattern: /grammy|格莱美|奖项|通类|年专|年度专辑|年制|年度制作|年歌|年度歌曲|新人|bna|aoty奖/i },
  { metric: "sales", pattern: /sales|销量|卖|chartmasters|实体|商业/i },
];

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, " ")
    .trim();
}

function compactText(value: string) {
  return normalizeText(value).replace(/\s+/g, "");
}

function unique<T>(items: T[]) {
  return [...new Set(items)];
}

function artistAliases(artist: (typeof artists)[number]) {
  return unique([
    artist.id,
    artist.name,
    artist.shortName,
    artist.displayNames.mean,
    artist.displayNames.neutral,
    `${artist.displayNames.mean}姐`,
    `${artist.shortName}姐`,
  ]).filter((item) => item.length >= 1);
}

function parseArtistsFromQuery(query: string) {
  const normalized = normalizeText(query);
  const compact = compactText(query);

  return artists
    .map((artist) => {
      const score = artistAliases(artist).reduce((total, alias) => {
        const normalizedAlias = normalizeText(alias);
        const compactAlias = compactText(alias);
        if (!normalizedAlias) return total;
        if (normalized.includes(normalizedAlias)) return total + normalizedAlias.length + 4;
        if (compactAlias.length >= 2 && compact.includes(compactAlias)) {
          return total + compactAlias.length + 2;
        }
        return total;
      }, 0);
      return { artist, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.artist.id);
}

function normalizeWorkflowMetrics(metrics: MetricKey[]) {
  const resolved = metrics.filter((metric): metric is WorkflowMetric =>
    workflowMetrics.includes(metric as WorkflowMetric),
  );
  return resolved.length ? unique(resolved) : workflowMetrics;
}

function parseMetricsFromQuery(query: string, fallback: MetricKey[]) {
  const parsed = metricKeywords
    .filter((item) => item.pattern.test(query))
    .map((item) => item.metric);
  return parsed.length ? unique(parsed) : normalizeWorkflowMetrics(fallback);
}

export function parseAgentQuery({
  query,
  fallbackArtistIds,
  fallbackMetrics,
}: {
  query: string;
  fallbackArtistIds: string[];
  fallbackMetrics: MetricKey[];
}) {
  const artistIds = unique(parseArtistsFromQuery(query));
  const resolvedArtists = artistIds.length >= 2 ? artistIds.slice(0, 2) : fallbackArtistIds;
  const metrics = parseMetricsFromQuery(query, fallbackMetrics);

  return {
    raw: query.trim(),
    artistIds: resolvedArtists,
    metrics: normalizeWorkflowMetrics(metrics),
    intent: resolvedArtists.length > 1 ? ("compare" as const) : ("lookup" as const),
  };
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "缺失";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => `${key}=${formatValue(item)}`)
      .join("；");
  }
  return String(value);
}

function getMetricEntry(artistId: string, metric: MetricKey) {
  return metricEntries.find(
    (entry) => entry.artistId === artistId && entry.metric === metric,
  );
}

function formatGeneralField(value: Record<string, unknown> | undefined) {
  if (!value) return "通类明细缺失";
  return [
    `年度专辑=${formatValue(value.albumOfTheYear)}`,
    `年度制作=${formatValue(value.recordOfTheYear)}`,
    `年度歌曲=${formatValue(value.songOfTheYear)}`,
    `最佳新人=${formatValue(value.bestNewArtist)}`,
  ].join("；");
}

function formatRcReviewsForEvidence(result: RcArtistResult) {
  if (result.status !== "ok" || !result.reviews.length) {
    return {
      line: `RC 专辑评分：暂无可用条目${result.error ? `（${result.error}）` : ""}`,
    };
  }
  const allReviews = result.reviews
    .map((review) => {
      const text = review.reviewText
        ? `，评语摘录=${review.reviewText.slice(0, 90)}`
        : "";
      return `${review.title}${review.year ? `(${review.year})` : ""}=${review.grade}${text}`;
    })
    .join("；");
  return {
    line: `${RC_GRADE_GUIDE}\nRC 专辑评分与评语（共 ${result.reviews.length} 条）：${allReviews}`,
  };
}

function rcGradeMeaning(grade: string, gradeLabel: string) {
  const meanings: Record<string, string> = {
    "A+": "神专级评价，属于 RC 体系里最顶格的认可。",
    A: "相当好的专辑，整体完成度和表达都被高度认可。",
    "A-": "优秀专辑，有明确亮点，整体评价偏强。",
    "B+": "值得肯定的作品，但离顶级评价还有距离。",
    B: "中等偏可听，认可有限。",
    "B-": "评价偏弱，只保留少量可取之处。",
    C: "评价较低，整体认可度不足。",
    "***": "Choice Cuts，只推荐其中几首歌，不等同于完整高分专辑。",
    "**": "Honorable Mention，属于有限推荐。",
    "*": "Neither，认可度很低。",
    "💣": "Bomb，明显负面评价。",
    BOMB: "Bomb，明显负面评价。",
  };

  return meanings[grade] ?? `${gradeLabel}：按顶部 RC 评分体系理解。`;
}

function summarizeRcReviewForUi(review: RcReview) {
  const gradeMeaning = rcGradeMeaning(review.grade, review.gradeLabel);
  if (!review.reviewText) {
    return `${gradeMeaning} RC 此条没有展开长评，只保留评级或推荐曲目信息。`;
  }

  const text = review.reviewText.toLowerCase();
  const viewpoints = [
    {
      pattern: /overlong|overworked|too much|lop off|avoid|can't stand|muzzier|not the best/i,
      text: "RC 原评对篇幅、制作或选曲取舍有保留，认为作品并非处处稳准。",
    },
    {
      pattern: /melod|tune|catchy|songs|rhyme|lyrics|songwriting|self-penned/i,
      text: "RC 原评把优势放在旋律、歌词和歌曲写作上，认可作品有可记住的流行表达。",
    },
    {
      pattern: /love|lover|romantic|autobiographical|memory|teen|childhood/i,
      text: "RC 原评关注情感叙事，尤其在亲密关系、回忆或自我书写里判断作品是否成立。",
    },
    {
      pattern: /pop star|celebrity|fame|showbiz|commercial|tourist|plutocrat/i,
      text: "RC 原评会把明星身份和流行工业语境一起看，既看作品，也看艺人如何经营自己的公众形象。",
    },
    {
      pattern: /voice|sing|vocal|alto|sounds|larynx|enunciat/i,
      text: "RC 原评提到声音质感和演唱表达，评价重点不只是歌曲本身，也包括歌手如何把文字唱出来。",
    },
    {
      pattern: /wit|smart|funny|joke|intelligent|brains|entendre/i,
      text: "RC 原评认可文本里的机巧、幽默和聪明劲，认为作品不只是好听，也有表达上的小心思。",
    },
    {
      pattern: /dance|club|beat|sound|textural|glam|disco/i,
      text: "RC 原评把注意力放在声音质地和舞曲/流行制作上，评价作品是否能把风格玩出辨识度。",
    },
  ]
    .filter((item) => item.pattern.test(text))
    .map((item) => item.text);

  const uniqueViewpoints = [...new Set(viewpoints)].slice(0, 2);
  const viewpointText = uniqueViewpoints.length
    ? uniqueViewpoints.join("")
    : "RC 原评主要围绕作品完成度、听感和艺人表达展开，评价重点来自原文长评。";

  return `${gradeMeaning} ${viewpointText}`;
}

function formatGrammyLines(awards: ArtistMetricEntry | undefined) {
  if (!awards) return [];
  const generalField = awards.value.generalField as Record<string, unknown> | undefined;
  return [
    `通类优先：${formatGeneralField(generalField)}`,
    `总获奖=${formatValue(awards.value.grammyWins)}；提名=${formatValue(awards.value.grammyNominations)}；通类获奖合计=${formatValue(awards.value.grammyGeneralFieldTotal)}`,
  ];
}

async function buildArtistEvidence(artistId: string, metrics: WorkflowMetric[]) {
  const artist = artists.find((item) => item.id === artistId);
  const lines: string[] = [];

  if (!artist) {
    return {
      artistId,
      artistName: artistId,
      summary: {
        artistId,
        artistName: artistId,
        rc: {
          source: "Robert Christgau" as const,
          guide: RC_GRADE_GUIDE,
          reviews: [],
        },
      },
      text: `### ${artistId}\n艺人不存在于本地艺人库。`,
    };
  }

  lines.push(`艺人：${artist.name} / 页面称呼：${artist.shortName}`);
  lines.push(`来源：RC=${artist.links.RC ?? "缺失"}；Grammy=${artist.links.grammy ?? "缺失"}；ChartMasters=本地结构化销量表`);

  const rcResult = await fetchRcArtistReviews(artist);
  const rcLine = formatRcReviewsForEvidence(rcResult);
  lines.push(rcLine.line);

  const summary: AgentWorkflowResult["summary"][number] = {
    artistId,
    artistName: artist.name,
    rc: {
      source: "Robert Christgau",
      sourceUrl: rcResult.sourceUrl,
      guide: RC_GRADE_GUIDE,
          reviews: rcResult.status === "ok"
        ? rcResult.reviews.map((review) => ({
            title: review.title,
            year: review.year,
            grade: review.grade,
            gradeLabel: review.gradeLabel,
            sourceUrl: review.sourceUrl,
            reviewSummaryZh: summarizeRcReviewForUi(review),
          }))
        : [],
    },
  };

  if (metrics.includes("awards")) {
    const awards = getMetricEntry(artistId, "awards");
    if (awards) {
      const grammyLines = formatGrammyLines(awards);
      lines.push(`Grammy 奖项：${grammyLines.join("；")}`);
      summary.grammy = {
        source: "Grammy",
        sourceUrl: awards.sourceUrl,
        lines: grammyLines,
      };
    }
  }

  if (metrics.includes("sales")) {
    const sales = getMetricEntry(artistId, "sales");
    if (sales) {
      const value = formatValue(sales.value.cmTotalSales);
      lines.push(`销量：${value} (${sales.sourcePlatform})`);
      summary.sales = {
        source: "ChartMasters",
        sourceUrl: sales.sourceUrl,
        value,
      };
    }
  }

  return {
    artistId,
    artistName: artist.name,
    summary,
    text: `### ${artist.name} (${artist.id})\n${lines.join("\n")}`,
  };
}

export async function buildAgentWorkflow({
  query,
  artistAId,
  artistBId,
  metrics,
  mode,
}: {
  query: string;
  artistAId: string;
  artistBId: string;
  metrics: MetricKey[];
  mode: BattleMode;
}): Promise<AgentWorkflowResult> {
  const parsedQuery = parseAgentQuery({
    query,
    fallbackArtistIds: [artistAId, artistBId],
    fallbackMetrics: metrics,
  });
  const evidence = await Promise.all(
    parsedQuery.artistIds.map((artistId) =>
      buildArtistEvidence(artistId, parsedQuery.metrics),
    ),
  );
  const evidenceText = [
    "## 左侧采集数据",
    `用户原始查询：${parsedQuery.raw || "使用当前 PK 默认查询"}`,
    `解析艺人：${parsedQuery.artistIds.join(" vs ")}`,
    `采集范围：RC评价、Grammy奖项、销量`,
    `生成模式：${mode}`,
    "使用说明：右侧报告可以基于这些结构化证据生成；引用 RC 英文评语时必须翻译成中文，不保留英文原文。",
    ...evidence.map((item) => item.text),
  ].join("\n\n");

  return {
    query: parsedQuery,
    evidenceText,
    summary: evidence.map((item) => item.summary),
  };
}

import { artists } from "@/data/artists";
import artistKnowledge from "@/data/rag/knowledge/artist-knowledge.json";
import platformSources from "@/data/rag/sources/platform-sources.json";
import artistSources from "@/data/rag/sources/artist-sources.json";
import artistMetrics from "@/data/rag/structured/artist-metrics.json";
import titlePatterns from "@/data/rag/templates/title-patterns.json";
import type { BattleMode } from "@/lib/types";

type KnowledgeName = {
  name: string;
  explanation?: string;
};

type ArtistKnowledge = {
  artistId: string;
  tags?: string[];
  profile: {
    styleTags: string[];
    careerEras: string[];
    publicImage: string;
    summary: string;
  };
  names: {
    normal: KnowledgeName[];
    shade: KnowledgeName[];
  };
  fanbase: {
    name: string;
    notes: string;
    shadeNames?: KnowledgeName[];
  };
  rivals: unknown[];
  controversies: unknown[];
  defenseTalkingPoints: unknown[];
  honorPoints: unknown[];
  wordplaySeeds?: string[];
  wordplayExamples?: string[];
  titleMaterials?: {
    mean: string[];
    neutral: string[];
    banned: string[];
  };
};

const knowledgeEntries = artistKnowledge as ArtistKnowledge[];

function findArtistId(name: string) {
  const normalized = name.trim().toLowerCase();
  return (
    artists.find(
      (artist) =>
        artist.name.toLowerCase() === normalized ||
        artist.shortName.toLowerCase() === normalized ||
        artist.id === normalized,
    )?.id ?? normalized.replace(/\s+/g, "-")
  );
}

function getArtistKnowledge(artistId: string) {
  return knowledgeEntries.find((entry) => entry.artistId === artistId);
}

function listNames(entry: ArtistKnowledge | undefined, mode: BattleMode) {
  if (!entry) return "暂无。";

  const normal = entry.names.normal
    .map((item) => formatKnowledgeName(item))
    .join("；");
  const shade =
    mode === "mean"
      ? entry.names.shade
          .map((item) => formatKnowledgeName(item))
          .join("；")
      : "";

  return [normal ? `正常称呼：${normal}` : "", shade ? `黑称/黑话：${shade}` : ""]
    .filter(Boolean)
    .join("\n");
}

function formatKnowledgeName(item: KnowledgeName) {
  return `${item.name}${item.explanation ? `：${item.explanation}` : ""}`;
}

function listFanbase(entry: ArtistKnowledge | undefined, mode: BattleMode) {
  if (!entry) return "暂无。";
  const fanbase = {
    normalName: entry.fanbase.name,
    notes: entry.fanbase.notes,
    shadeNames: mode === "mean" ? entry.fanbase.shadeNames ?? [] : [],
  };
  return JSON.stringify(fanbase, null, 2);
}

function listMeanWritingKit(entry: ArtistKnowledge | undefined) {
  if (!entry) return "暂无。";
  const shadeNames = entry.names.shade?.map((item) => item.name) ?? [];
  const shadeExplanations =
    entry.names.shade
      ?.map((item) => `${item.name}${item.explanation ? `：${item.explanation}` : ""}`)
      .join("；") ?? "";
  const fanbaseShadeNames =
    entry.fanbase.shadeNames?.map((item) => item.name).join(" / ") ?? "";
  const normalNames = entry.names.normal?.map((item) => item.name).join(" / ") ?? "";
  const attackAngles =
    entry.controversies
      ?.map((item) => {
        const record = item as { title?: string; attackAngle?: string; defenseTalkingPoint?: string };
        return [record.title, record.attackAngle, record.defenseTalkingPoint]
          .filter(Boolean)
          .join("：");
      })
      .filter(Boolean) ?? [];
  const honorCounters =
    entry.honorPoints
      ?.map((item) => {
        const record = item as { title?: string; fanPraise?: string; antiResponse?: string };
        return [record.title, record.fanPraise, record.antiResponse].filter(Boolean).join("：");
      })
      .filter(Boolean) ?? [];

  return JSON.stringify(
    {
      normalNames,
      shadeNames: shadeNames.join(" / "),
      shadeExplanations,
      fanbaseShadeNames,
      oneCharacterShadeSeeds: entry.wordplaySeeds?.join(" / ") ?? "",
      wordplaySeeds: entry.wordplaySeeds?.join(" / ") ?? "",
      wordplayExamples: entry.wordplayExamples ?? [],
      attackAngles,
      honorCounters,
      titleMaterials: entry.titleMaterials,
    },
    null,
    2,
  );
}

function listCompact(items: unknown[] | undefined) {
  if (!items?.length) return "暂无。";
  return JSON.stringify(items, null, 2);
}

function buildArtistContext(artistName: string, mode: BattleMode) {
  const artistId = findArtistId(artistName);
  const knowledge = getArtistKnowledge(artistId);
  const sources = artistSources.find((entry) => entry.artistId === artistId);
  const metrics = artistMetrics.filter((entry) => entry.artistId === artistId);

  return `### ${artistName} (${artistId})
来源链接：
${sources ? JSON.stringify(sources, null, 2) : "暂无。"}

结构化补录数据：
${metrics.length ? JSON.stringify(metrics, null, 2) : "暂无。"}

艺人标签：
${knowledge?.tags?.length ? knowledge.tags.join("、") : "暂无。"}

艺人画像：
${knowledge?.profile ? JSON.stringify(knowledge.profile, null, 2) : "暂无。"}

称呼库：
${listNames(knowledge, mode)}

Mean 写作素材包：
${mode === "mean" ? listMeanWritingKit(knowledge) : "清清白白模式不启用 mean 写作素材包。"}

粉丝名：
${listFanbase(knowledge, mode)}

主要对家：
${listCompact(knowledge?.rivals)}

主要黑点/争议：
${mode === "mean" ? listCompact(knowledge?.controversies) : "清清白白模式不启用黑点语料。"}

粉丝挽尊话术：
${mode === "mean" ? listCompact(knowledge?.defenseTalkingPoints) : "清清白白模式不启用挽尊话术。"}

主要荣誉点：
${listCompact(knowledge?.honorPoints)}

艺人标题素材：
${knowledge?.titleMaterials ? JSON.stringify(knowledge.titleMaterials, null, 2) : "暂无。"}`;
}

export function buildRagContext({
  artistA,
  artistB,
  mode,
}: {
  artistA: string;
  artistB: string;
  mode: BattleMode;
}) {
  const modeRules =
    mode === "mean"
      ? "刻薄女孩模式可以参考黑称、粉丝黑称、对家、黑点、挽尊和黑粉话术；黑称/粉丝黑称只是称呼库，不判断真假，输出时必须用 <shade>内容</shade> 包住。只有黑点/争议/荣誉点需要看是否可验证。"
      : "清清白白模式禁止使用黑称、粉丝黑称、攻击性黑点、黑粉话术，只能使用正常称呼、正常粉丝名、艺人画像、荣誉点和结构化数据。";

  return `## RiotBus 本地内容库上下文
${modeRules}

平台级来源：
${JSON.stringify(platformSources, null, 2)}

${buildArtistContext(artistA, mode)}

${buildArtistContext(artistB, mode)}`;
}

export function buildTitleContext(mode: BattleMode) {
  return JSON.stringify(titlePatterns[mode], null, 2);
}

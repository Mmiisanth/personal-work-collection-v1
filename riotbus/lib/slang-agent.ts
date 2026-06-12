import { artists } from "@/data/artists";
import artistKnowledge from "@/data/rag/knowledge/artist-knowledge.json";
import ragChunks from "@/data/rag/index/rag-chunks.json";
import type { BattleMode } from "@/lib/types";

type KnowledgeName = {
  name: string;
  explanation?: string;
};

type ArtistKnowledge = {
  artistId: string;
  names?: {
    normal?: KnowledgeName[];
    shade?: KnowledgeName[];
  };
  fanbase?: {
    name?: string;
    shadeNames?: KnowledgeName[];
  };
  wordplaySeeds?: string[];
  wordplayExamples?: string[];
};

type RagChunk = {
  id?: string;
  artistId?: string;
  category?: string;
  text?: string;
};

const knowledgeEntries = artistKnowledge as ArtistKnowledge[];
const chunkEntries = (ragChunks as { chunks?: RagChunk[] }).chunks ?? [];

const slangIntentPattern =
  /黑话|黑称|梗|外号|绰号|粉丝名|粉丝黑称|什么意思|啥意思|释义|解释|叫法|称呼|meanwords|mean words/i;

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
  ]).filter(Boolean);
}

function mentionedArtistIds(query: string) {
  const normalized = normalizeText(query);
  const compact = compactText(query);
  return artists
    .filter((artist) =>
      artistAliases(artist).some((alias) => {
        const normalizedAlias = normalizeText(alias);
        const compactAlias = compactText(alias);
        return (
          normalized.includes(normalizedAlias) ||
          (compactAlias.length >= 2 && compact.includes(compactAlias))
        );
      }),
    )
    .map((artist) => artist.id);
}

function formatNameList(title: string, names: KnowledgeName[] | undefined) {
  if (!names?.length) return "";
  return `${title}：${names
    .map((item) => `${item.name}${item.explanation ? ` = ${item.explanation}` : ""}`)
    .join("；")}`;
}

function formatArtistSlang(entry: ArtistKnowledge | undefined, mode: BattleMode) {
  if (!entry) return "";
  const lines = [
    `艺人：${entry.artistId}`,
    formatNameList("正常称呼", entry.names?.normal),
    mode === "mean" ? formatNameList("黑称/黑话", entry.names?.shade) : "",
    `粉丝名：${entry.fanbase?.name ?? "暂无"}`,
    mode === "mean" ? formatNameList("粉丝黑称", entry.fanbase?.shadeNames) : "",
    entry.wordplaySeeds?.length ? `单字/谐音种子：${entry.wordplaySeeds.join("、")}` : "",
    entry.wordplayExamples?.length
      ? `造句例子：${entry.wordplayExamples.join("；")}`
      : "",
  ].filter(Boolean);
  return lines.join("\n");
}

function scoreChunk(query: string, chunk: RagChunk) {
  const text = chunk.text ?? "";
  if (!text) return 0;
  const compactQuery = compactText(query);
  const compactChunk = compactText(text);
  const terms = compactQuery.split("").filter((item) => item.trim());
  const directHit = compactQuery.length >= 2 && compactChunk.includes(compactQuery);
  const partialScore = terms.reduce(
    (score, term) => score + (compactChunk.includes(term) ? 1 : 0),
    0,
  );
  return (directHit ? 20 : 0) + partialScore;
}

export function isSlangQuery(query: string | undefined) {
  if (!query) return false;
  return slangIntentPattern.test(query);
}

export function buildSlangContext({
  query,
  mode,
  artistA,
  artistB,
}: {
  query: string;
  mode: BattleMode;
  artistA: string;
  artistB: string;
}) {
  const explicitArtistIds = mentionedArtistIds(query);
  const fallbackArtistIds = [artistA, artistB]
    .map((name) => {
      const normalized = normalizeText(name);
      return artists.find(
        (artist) =>
          normalizeText(artist.name) === normalized ||
          normalizeText(artist.shortName) === normalized ||
          normalizeText(artist.displayNames.mean) === normalized,
      )?.id;
    })
    .filter((item): item is string => Boolean(item));
  const artistIds = unique(explicitArtistIds.length ? explicitArtistIds : fallbackArtistIds);
  const artistBlocks = artistIds
    .map((artistId) =>
      formatArtistSlang(
        knowledgeEntries.find((entry) => entry.artistId === artistId),
        mode,
      ),
    )
    .filter(Boolean);
  const matchedChunks = chunkEntries
    .map((chunk) => ({ chunk, score: scoreChunk(query, chunk) }))
    .filter((item) => item.score > 8)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((item) => `- ${item.chunk.text}`);

  return `## Slang Agent 本地译文库
用户查询：${query}
命中艺人：${artistIds.join(", ") || "未命中，使用当前 PK 艺人"}

### 艺人称呼/黑话表
${artistBlocks.length ? artistBlocks.join("\n\n") : "暂无命中艺人词库。"}

### 相关 RAG 片段
${matchedChunks.length ? matchedChunks.join("\n") : "暂无高置信片段，仅使用艺人称呼/黑话表。"}`;
}

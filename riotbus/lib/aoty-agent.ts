import { artists } from "@/data/artists";
import aotyAlbumCache from "@/data/rag/structured/aoty-albums.json";

type AotyAlbum = {
  title: string;
  year?: string | null;
  aotyUrl?: string;
  criticScore?: number | null;
  userScore?: number | null;
  criticReviewCount?: number | null;
  userRatingCount?: number | null;
  qualityLabels?: {
    code: string;
    label: string;
    reason?: string;
  }[];
  matchKeys?: string[];
};

type AotyArtistCache = {
  artistId: string;
  artistName?: string;
  sourceArtistUrl?: string;
  updatedAt?: string | null;
  status?: string;
  error?: string | null;
  albums?: AotyAlbum[];
};

type AotyCache = {
  generatedAt?: string | null;
  artists?: AotyArtistCache[];
};

const cache = aotyAlbumCache as AotyCache;

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

function findArtistId(name: string) {
  const normalized = normalizeText(name);
  return (
    artists.find(
      (artist) =>
        normalizeText(artist.name) === normalized ||
        normalizeText(artist.shortName) === normalized ||
        normalizeText(artist.displayNames.mean) === normalized ||
        artist.id === name.trim().toLowerCase(),
    )?.id ?? name.trim().toLowerCase().replace(/\s+/g, "-")
  );
}

function getArtistCache(artistName: string) {
  const artistId = findArtistId(artistName);
  return cache.artists?.find((entry) => entry.artistId === artistId);
}

function albumMatchesQuestion(album: AotyAlbum, question: string) {
  const normalizedQuestion = normalizeText(question);
  const compactQuestion = compactText(question);
  const keys = [album.title, ...(album.matchKeys ?? [])].filter(Boolean);

  return keys.some((key) => {
    const normalizedKey = normalizeText(key);
    const compactKey = compactText(key);
    return (
      normalizedKey.length >= 3 &&
      (normalizedQuestion.includes(normalizedKey) ||
        compactQuestion.includes(compactKey))
    );
  });
}

function formatScore(value: number | null | undefined) {
  return typeof value === "number" ? String(value) : "暂无";
}

function formatCount(value: number | null | undefined) {
  return typeof value === "number" ? String(value) : "暂无";
}

function formatAlbum(album: AotyAlbum) {
  const qualityLabels = album.qualityLabels?.length
    ? album.qualityLabels.map((item) => `${item.label}(${item.reason ?? item.code})`).join("、")
    : "暂无";

  return [
    `专辑：${album.title}${album.year ? ` (${album.year})` : ""}`,
    `AOTY链接：${album.aotyUrl ?? "暂无"}`,
    `乐评均分：${formatScore(album.criticScore)}`,
    `用户均分：${formatScore(album.userScore)}`,
    `乐评数量：${formatCount(album.criticReviewCount)}`,
    `用户评分数量：${formatCount(album.userRatingCount)}`,
    `质量标签：${qualityLabels}`,
  ].join("\n");
}

function shouldIncludeAotyContext(question: string | undefined) {
  if (!question) return false;
  return /aoty|album of the year|专辑|乐评|评分|均分|口碑|review|critic|user|metacritic/i.test(
    question,
  );
}

function buildArtistAlbumContext(artistName: string, question: string) {
  const artistCache = getArtistCache(artistName);
  if (!artistCache) {
    return `### ${artistName}\nAOTY 专辑级缓存：暂无。请先运行 npm run agent:aoty:update。`;
  }

  const albums = artistCache.albums ?? [];
  const matchedAlbums = albums.filter((album) => albumMatchesQuestion(album, question));
  const shouldShowTopAlbums = matchedAlbums.length === 0;
  const selectedAlbums = shouldShowTopAlbums ? albums.slice(0, 8) : matchedAlbums;

  return `### ${artistName} (${artistCache.artistId})
AOTY Agent 状态：${artistCache.status ?? "unknown"}
更新时间：${artistCache.updatedAt ?? "暂无"}
来源主页：${artistCache.sourceArtistUrl ?? "暂无"}
${artistCache.error ? `最近更新错误：${artistCache.error}` : ""}
${selectedAlbums.length ? selectedAlbums.map(formatAlbum).join("\n\n") : "专辑级缓存暂无可用条目。"}
${shouldShowTopAlbums && albums.length ? "说明：用户问题未命中明确专辑名，因此只提供缓存中的前 8 条专辑候选。" : ""}`;
}

export function buildAotyAgentContext({
  artistA,
  artistB,
  userQuestion,
}: {
  artistA: string;
  artistB: string;
  userQuestion?: string;
}) {
  if (!shouldIncludeAotyContext(userQuestion)) return "";
  const question = userQuestion ?? "";

  return `## AOTY 专辑级 Agent 上下文
这部分来自 data/rag/structured/aoty-albums.json。它是专辑级缓存，优先用于回答“某张专辑的 AOTY 乐评/用户分/口碑如何”。如果这里缺失，不要用艺人总体均分冒充专辑分。
AOTY 标签规则：蓝标=critic score >= 80；橙标=user score >= 80；紫标=critic score 和 user score 都 >= 80；Must Hear=页面出现 Must Hear label。紫标可以作为“乐评和用户都强”的高质量专辑证据。

${buildArtistAlbumContext(artistA, question)}

${buildArtistAlbumContext(artistB, question)}`;
}

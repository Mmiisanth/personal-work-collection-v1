import { artists } from "@/data/artists";
import type { BattleMode } from "@/lib/types";

export type ConversationMessage = {
  role: "ai" | "user";
  content: string;
};

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function findArtistByName(name: string) {
  const normalized = normalizeText(name);
  return artists.find(
    (artist) =>
      normalizeText(artist.name) === normalized ||
      normalizeText(artist.shortName) === normalized ||
      normalizeText(artist.displayNames.mean) === normalized ||
      artist.id === normalized.replace(/\s+/g, "-"),
  );
}

function getArtistAliases(name: string, mode: BattleMode) {
  const artist = findArtistByName(name);
  if (!artist) return [name];
  return [
    artist.name,
    artist.shortName,
    artist.displayNames.mean,
    artist.displayNames.neutral,
    artist.id,
  ].filter(Boolean);
}

function countMentions(text: string, aliases: string[]) {
  const normalized = normalizeText(text);
  return aliases.reduce((score, alias) => {
    const normalizedAlias = normalizeText(alias);
    if (!normalizedAlias) return score;
    return normalized.includes(normalizedAlias) ? score + 1 : score;
  }, 0);
}

function inferWinnerFromAiText({
  text,
  artistA,
  artistB,
  mode,
}: {
  text: string;
  artistA: string;
  artistB: string;
  mode: BattleMode;
}) {
  const aAliases = getArtistAliases(artistA, mode);
  const bAliases = getArtistAliases(artistB, mode);
  const normalized = normalizeText(text);
  const greaterPatterns = [
    /(.{0,18})(大于|赢|胜|秒|压|领先|更强|更好|更高|占优)(.{0,18})/g,
  ];

  for (const pattern of greaterPatterns) {
    const matches = normalized.matchAll(pattern);
    for (const match of matches) {
      const left = match[1] ?? "";
      const right = match[3] ?? "";
      const leftA = countMentions(left, aAliases);
      const leftB = countMentions(left, bAliases);
      const rightA = countMentions(right, aAliases);
      const rightB = countMentions(right, bAliases);
      if (leftA > 0 && rightB > 0) return artistA;
      if (leftB > 0 && rightA > 0) return artistB;
    }
  }

  const firstParagraph = normalized.split(/\n+/)[0] ?? normalized.slice(0, 160);
  const aScore = countMentions(firstParagraph, aAliases);
  const bScore = countMentions(firstParagraph, bAliases);
  if (aScore > bScore) return artistA;
  if (bScore > aScore) return artistB;
  return "";
}

function inferUserStance({
  userQuestion,
  winner,
  artistA,
  artistB,
  mode,
}: {
  userQuestion: string;
  winner: string;
  artistA: string;
  artistB: string;
  mode: BattleMode;
}) {
  const text = normalizeText(userQuestion);
  const loser = winner === artistA ? artistB : winner === artistB ? artistA : "";
  const winnerMentions = winner ? countMentions(text, getArtistAliases(winner, mode)) : 0;
  const loserMentions = loser ? countMentions(text, getArtistAliases(loser, mode)) : 0;
  const agreeWords = /(对|确实|没错|赞同|同意|说得对|就是|赢了|秒了|看得很清)/i;
  const disagreeWords = /(不对|不是|反驳|但是|可是|凭什么|哪里|明明|胡说|输了吗|更好|更高|赢)/i;

  if (winner && loserMentions > winnerMentions && disagreeWords.test(userQuestion)) {
    return "disagree";
  }
  if (winner && winnerMentions >= loserMentions && agreeWords.test(userQuestion)) {
    return "agree";
  }
  if (winner && loserMentions > winnerMentions) return "disagree";
  if (agreeWords.test(userQuestion)) return "agree";
  return "neutral";
}

export function buildAgentMemoryContext({
  artistA,
  artistB,
  mode,
  userQuestion,
  conversation,
}: {
  artistA: string;
  artistB: string;
  mode: BattleMode;
  userQuestion?: string;
  conversation?: ConversationMessage[];
}) {
  if (!userQuestion || !conversation?.length) return "";

  const lastAiMessage = [...conversation].reverse().find((message) => message.role === "ai");
  if (!lastAiMessage) return "";

  const inferredWinner = inferWinnerFromAiText({
    text: lastAiMessage.content,
    artistA,
    artistB,
    mode,
  });
  const stance = inferUserStance({
    userQuestion,
    winner: inferredWinner,
    artistA,
    artistB,
    mode,
  });

  const openingRule =
    mode === "mean"
      ? stance === "agree"
        ? "用户在赞同上一轮 AI 判决。回复必须用“你看得很清”开头，并继续找 AOTY 专辑证据加码。"
        : stance === "disagree"
          ? "用户在反驳上一轮 AI 判决。回复必须用“xx迷不要胡搅蛮缠”开头，xx 用输家粉丝黑称；不要轻易改判，优先用 AOTY 专辑质量标签和对方短板反击。"
          : "用户立场不明确。延续上一轮判决，但语气可以比反驳时轻一点。"
      : "清清白白模式只记录上下文，不使用粉圈攻击话术。";

  return `## Agent Memory
上一轮 AI 判决文本：
${lastAiMessage.content}

Agent 记忆推断：
- 上一轮赢家：${inferredWinner || "未能稳定识别"}
- 用户当前立场：${stance}
- 回复策略：${openingRule}
- 如果用户围绕乐评反驳，优先检查 AOTY 专辑级 Agent 上下文里的紫标、蓝标、橙标、Must Hear 和具体专辑分数。`;
}

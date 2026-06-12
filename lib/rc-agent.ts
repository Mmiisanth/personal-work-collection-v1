import type { Artist } from "@/lib/types";
import rcReviewsCache from "@/data/rag/structured/rc-reviews.json";

export type RcReview = {
  title: string;
  label?: string | null;
  year?: string | null;
  grade: string;
  gradeLabel: string;
  reviewText?: string;
  sourceUrl: string;
};

export type RcArtistResult = {
  status: "ok" | "missing-url" | "error";
  sourceUrl?: string;
  reviews: RcReview[];
  error?: string;
  fetchMode?: "http-fetch" | "cache";
};

type RcCache = {
  artists?: Array<{
    artistId: string;
    sourceUrl?: string;
    status?: string;
    error?: string | null;
    reviews?: RcReview[];
  }>;
};

const USER_AGENT = "Mozilla/5.0 RiotBusRcReviewAgent/0.1";
const RC_BASE_URL = "https://www.robertchristgau.com";
export const RC_GRADE_GUIDE =
  "RC 评分体系：A+ 神专；A 即刻经典；A- 优秀；B+ 值得肯定；B/B-/C 依次走低；*** / ** / * 属于星标/雪花类提示，数量越多越好；Choice Cuts / ✂️ 表示只推荐列出的几首歌；炸弹/💣 表示很差。";

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(value: string) {
  return decodeHtml(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<img\b[^>]*alt=["']([^"']+)["'][^>]*>/gi, "$1")
      .replace(/<[^>]+>/g, " "),
  );
}

function parseYear(labelText: string) {
  return labelText.match(/\b(19|20)\d{2}\b/)?.[0] ?? null;
}

function normalizeGrade(raw: string) {
  const text = stripTags(raw);
  if (/choice cuts/i.test(text)) return "***";
  return text.replace(/\s+/g, "");
}

function gradeLabel(grade: string) {
  const labels: Record<string, string> = {
    "A+": "A+",
    A: "A",
    "A-": "A-",
    "B+": "B+",
    B: "B",
    "B-": "B-",
    "***": "Choice Cuts",
    "**": "Honorable Mention",
    "*": "Neither",
    "💣": "Bomb",
    BOMB: "Bomb",
  };
  return labels[grade] ?? grade;
}

function absolutizeRcUrl(url: string) {
  if (url.startsWith("http")) return url;
  return `${RC_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function parseRcReviews(html: string, sourceUrl: string): RcReview[] {
  const listStart = html.search(/<h2\b[\s\S]*?<\/h2>\s*<ul>/i);
  const nextUlEnd = listStart >= 0 ? html.slice(listStart).search(/<\/ul>/i) : -1;
  const listHtml =
    listStart >= 0 && nextUlEnd >= 0
      ? html.slice(listStart, listStart + nextUlEnd + 5)
      : html;
  const reviewPattern =
    /<li>\s*<b>\s*<i>([\s\S]*?)<\/i>\s*<\/b>\s*\[([\s\S]*?)\]\s*<b>([\s\S]*?)<\/b>/gi;
  const reviewTextByTitle = parseRcReviewTexts(html);
  const reviews = [...listHtml.matchAll(reviewPattern)]
    .map((match) => {
      const title = stripTags(match[1]);
      const label = stripTags(match[2]);
      const grade = normalizeGrade(match[3]);
      return {
        title,
        label,
        year: parseYear(label),
        grade,
        gradeLabel: gradeLabel(grade),
        reviewText: reviewTextByTitle.get(normalizeTitle(title)) ?? "",
        sourceUrl,
      };
    })
    .filter((review) => review.title && review.grade);

  return reviews;
}

function normalizeTitle(value: string) {
  return stripTags(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function parseRcReviewTexts(html: string) {
  const texts = new Map<string, string>();
  const paragraphPattern = /<p>([\s\S]*?)<\/p>/gi;

  for (const match of html.matchAll(paragraphPattern)) {
    const paragraph = match[1];
    const titleMatch = paragraph.match(/<b>\s*(?:[^<]*:\s*<\/b>\s*)?<b>\s*<i>([\s\S]*?)<\/i>\s*<\/b>|<b>\s*<i>([\s\S]*?)<\/i>\s*<\/b>/i);
    const title = titleMatch?.[1] ?? titleMatch?.[2] ?? "";
    if (!title) continue;
    const cleaned = stripTags(
      paragraph
        .replace(/<b>\s*(?:[^<]*:\s*<\/b>\s*)?<b>\s*<i>[\s\S]*?<\/i>\s*<\/b>\s*\[[\s\S]*?\]\s*<br\s*\/?>/i, "")
        .replace(/<b>\s*<i>[\s\S]*?<\/i>\s*<\/b>\s*\[[\s\S]*?\]\s*<br\s*\/?>/i, "")
        .replace(/<b>[^<]{0,8}<\/b>\s*$/i, ""),
    );
    if (cleaned) {
      texts.set(normalizeTitle(title), cleaned);
    }
  }

  return texts;
}

export async function fetchRcArtistReviews(artist: Artist): Promise<RcArtistResult> {
  const sourceUrl = artist.links.RC ? absolutizeRcUrl(artist.links.RC) : "";
  if (!sourceUrl) {
    return { status: "missing-url", reviews: [], error: "RC source URL missing" };
  }

  try {
    const response = await fetch(sourceUrl, {
      headers: {
        accept: "text/html,application/xhtml+xml,text/plain;q=0.8,*/*;q=0.7",
        "user-agent": USER_AGENT,
      },
      signal: AbortSignal.timeout(12000),
    });
    const html = await response.text();
    if (!response.ok) {
      return {
        status: "error",
        sourceUrl,
        reviews: [],
        error: `HTTP ${response.status}`,
      };
    }
    const reviews = parseRcReviews(html, sourceUrl);
    return {
      status: reviews.length ? "ok" : "error",
      sourceUrl,
      reviews,
      fetchMode: "http-fetch",
      error: reviews.length ? undefined : "No RC review rows parsed",
    };
  } catch (error) {
    const cached = (rcReviewsCache as RcCache).artists?.find(
      (entry) => entry.artistId === artist.id,
    );
    if (cached?.reviews?.length) {
      return {
        status: "ok",
        sourceUrl: cached.sourceUrl ?? sourceUrl,
        reviews: cached.reviews,
        fetchMode: "cache",
        error: `live fetch failed, using cache: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
    return {
      status: "error",
      sourceUrl,
      reviews: [],
      fetchMode: "http-fetch",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

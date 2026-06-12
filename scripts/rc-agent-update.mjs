import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const artistSourcesPath = path.join(rootDir, "data/rag/sources/artist-sources.json");
const outputPath = path.join(rootDir, "data/rag/structured/rc-reviews.json");
const USER_AGENT = "Mozilla/5.0 RiotBusRcReviewAgent/0.1";
const RC_BASE_URL = "https://www.robertchristgau.com";
const RC_GRADE_GUIDE =
  "RC 评分体系：A+ 基本可视为神专；A 是相当强的专辑；A- 很优秀；B+ 值得肯定；B/B-/C 依次走低；*** / ** / * 属于星标/雪花类提示，数量越多越好但通常不是完整高分专辑；Choice Cuts / ✂️ 表示只推荐列出的几首歌；炸弹/💣 表示很差。";

function parseArgs(argv) {
  const args = {
    artist: "",
    limit: 0,
    dryRun: false,
    timeoutMs: 12000,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--artist") args.artist = argv[index + 1] ?? "";
    if (item === "--limit") args.limit = Number(argv[index + 1] ?? 0);
    if (item === "--dry-run") args.dryRun = true;
    if (item === "--timeout-ms") args.timeoutMs = Number(argv[index + 1] ?? 12000);
  }

  return args;
}

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function decodeHtml(value) {
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

function stripTags(value) {
  return decodeHtml(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<img\b[^>]*alt=["']([^"']+)["'][^>]*>/gi, "$1")
      .replace(/<[^>]+>/g, " "),
  );
}

function parseYear(labelText) {
  return labelText.match(/\b(19|20)\d{2}\b/)?.[0] ?? null;
}

function normalizeGrade(raw) {
  const text = stripTags(raw);
  if (/choice cuts/i.test(text)) return "***";
  return text.replace(/\s+/g, "");
}

function gradeLabel(grade) {
  const labels = {
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

function normalizeTitle(value) {
  return stripTags(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function parseRcReviewTexts(html) {
  const texts = new Map();
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
    if (cleaned) texts.set(normalizeTitle(title), cleaned);
  }

  return texts;
}

function absolutizeRcUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${RC_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

function parseRcReviews(html, sourceUrl) {
  const listStart = html.search(/<h2\b[\s\S]*?<\/h2>\s*<ul>/i);
  const nextUlEnd = listStart >= 0 ? html.slice(listStart).search(/<\/ul>/i) : -1;
  const listHtml =
    listStart >= 0 && nextUlEnd >= 0
      ? html.slice(listStart, listStart + nextUlEnd + 5)
      : html;
  const reviewTextByTitle = parseRcReviewTexts(html);
  const reviewPattern =
    /<li>\s*<b>\s*<i>([\s\S]*?)<\/i>\s*<\/b>\s*\[([\s\S]*?)\]\s*<b>([\s\S]*?)<\/b>/gi;

  return [...listHtml.matchAll(reviewPattern)]
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
}

async function fetchText(url, args) {
  const response = await fetch(url, {
    headers: {
      accept: "text/html,application/xhtml+xml,text/plain;q=0.8,*/*;q=0.7",
      "user-agent": USER_AGENT,
    },
    signal: AbortSignal.timeout(args.timeoutMs),
  });
  const html = await response.text();
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return html;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sources = await readJson(artistSourcesPath, []);
  const previousCache = await readJson(outputPath, { artists: [] });
  const previousByArtist = new Map(
    (previousCache.artists ?? []).map((entry) => [entry.artistId, entry]),
  );
  const targets = sources
    .filter((source) => source.rc)
    .filter((source) => !args.artist || source.artistId === args.artist);
  const limitedTargets = args.limit > 0 ? targets.slice(0, args.limit) : targets;
  const artists = [];

  console.log(`[plan] ${limitedTargets.length} RC artist page(s) scheduled`);
  for (const source of limitedTargets) {
    const sourceUrl = absolutizeRcUrl(source.rc);
    process.stdout.write(`[execute] ${source.artistId} ... `);
    const lastAttemptAt = new Date().toISOString();
    try {
      const html = await fetchText(sourceUrl, args);
      const reviews = parseRcReviews(html, sourceUrl);
      if (!reviews.length) throw new Error("No RC reviews parsed");
      artists.push({
        artistId: source.artistId,
        sourceUrl,
        updatedAt: lastAttemptAt,
        lastAttemptAt,
        status: "ok",
        error: null,
        gradeGuide: RC_GRADE_GUIDE,
        reviews,
      });
      console.log(`ok (${reviews.length} reviews)`);
    } catch (error) {
      const previous = previousByArtist.get(source.artistId);
      if (previous?.reviews?.length) {
        artists.push({
          ...previous,
          status: "stale",
          lastAttemptAt,
          error: error instanceof Error ? error.message : String(error),
        });
        console.log(`stale (${previous.reviews.length} cached reviews)`);
      } else {
        artists.push({
          artistId: source.artistId,
          sourceUrl,
          updatedAt: null,
          lastAttemptAt,
          status: "error",
          error: error instanceof Error ? error.message : String(error),
          gradeGuide: RC_GRADE_GUIDE,
          reviews: [],
        });
        console.log("error (0 reviews)");
      }
    }
  }

  const untouched = (previousCache.artists ?? []).filter(
    (entry) => !limitedTargets.some((target) => target.artistId === entry.artistId),
  );
  const nextCache = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    agent: {
      name: "rc-review-agent",
      status: artists.some((entry) => entry.status === "ok") ? "updated" : "no-online-update",
      gradeGuide: RC_GRADE_GUIDE,
      plan: {
        targetCount: limitedTargets.length,
        tools: ["loadArtistSources", "fetchRcArtistPage", "parseRcReviewList", "parseRcReviewText", "writeRcReviewCache"],
      },
    },
    artists: [...untouched, ...artists].sort((a, b) => a.artistId.localeCompare(b.artistId)),
  };

  if (args.dryRun) {
    console.log(JSON.stringify(nextCache, null, 2));
    return;
  }

  await fs.writeFile(outputPath, `${JSON.stringify(nextCache, null, 2)}\n`);
  console.log(`[write] ${path.relative(rootDir, outputPath)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

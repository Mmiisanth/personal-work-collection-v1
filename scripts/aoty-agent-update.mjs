import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const artistSourcesPath = path.join(rootDir, "data/rag/sources/artist-sources.json");
const outputPath = path.join(rootDir, "data/rag/structured/aoty-albums.json");

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 RiotBusAotyAgent/0.1";
const BROWSER_TEXT_DIR = path.join(rootDir, "data/agent-cache/aoty-browser-text");

function parseArgs(argv) {
  const args = {
    artist: "",
    limit: 0,
    dryRun: false,
    sourceDir: "",
    browserTextDir: "",
    timeoutMs: 20000,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--artist") args.artist = argv[index + 1] ?? "";
    if (item === "--limit") args.limit = Number(argv[index + 1] ?? 0);
    if (item === "--dry-run") args.dryRun = true;
    if (item === "--source-dir") args.sourceDir = argv[index + 1] ?? "";
    if (item === "--browser-text-dir") args.browserTextDir = argv[index + 1] ?? "";
    if (item === "--timeout-ms") args.timeoutMs = Number(argv[index + 1] ?? 20000);
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

function createPlan({ artistSources, args }) {
  const enabledSources = artistSources.filter((source) => source.aoty);
  const artistFiltered = args.artist
    ? enabledSources.filter((source) => source.artistId === args.artist)
    : enabledSources;
  const limited = args.limit > 0 ? artistFiltered.slice(0, args.limit) : artistFiltered;

  return {
    agent: "aoty-album-agent",
    mode: "manual-update",
    startedAt: new Date().toISOString(),
    targets: limited,
    tools: [
      "loadCachedAotyAlbums",
      "fetchAotyArtistPage",
      "loadBrowserExtractedText",
      "parseAotyAlbumList",
      "classifyAotyQualityLabels",
      "validateAotyAlbums",
      "writeAotyAlbumCache",
    ],
  };
}

function formatFetchError(error) {
  if (!(error instanceof Error)) return String(error);
  const cause = error.cause;
  const causeCode =
    cause && typeof cause === "object" && "code" in cause ? ` ${(cause).code}` : "";
  return `${error.message}${causeCode}`;
}

async function fetchText(url, args) {
  let response;
  let text;
  try {
    response = await fetch(url, {
      headers: {
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.7",
        "accept-language": "en-US,en;q=0.9",
        "user-agent": USER_AGENT,
      },
      signal: AbortSignal.timeout(args.timeoutMs),
    });
    text = await response.text();
  } catch (error) {
    throw new Error(`Network fetch failed: ${formatFetchError(error)}`);
  }

  if (!response.ok) {
    const isChallenge = /Just a moment|Cloudflare|challenge-platform|cf-chl/i.test(text);
    throw new Error(
      `HTTP ${response.status}${isChallenge ? " Cloudflare challenge" : ""}`,
    );
  }

  return text;
}

async function loadArtistPage(source, args) {
  if (args.sourceDir) {
    const localPath = path.resolve(rootDir, args.sourceDir, `${source.artistId}.html`);
    return {
      html: await fs.readFile(localPath, "utf8"),
      fetchMode: "local-html",
    };
  }

  return {
    html: await fetchText(source.aoty, args),
    fetchMode: "http-fetch",
  };
}

async function loadBrowserTextFallback(source, args) {
  const browserTextDir = args.browserTextDir
    ? path.resolve(rootDir, args.browserTextDir)
    : BROWSER_TEXT_DIR;
  const localPath = path.join(browserTextDir, `${source.artistId}.txt`);
  return {
    html: await fs.readFile(localPath, "utf8"),
    fetchMode: "browser-text",
  };
}

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(value) {
  return decodeHtml(value.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " "));
}

function absolutizeAotyUrl(href) {
  if (href.startsWith("http")) return href;
  return `https://www.albumoftheyear.org${href.startsWith("/") ? "" : "/"}${href}`;
}

function parseNumber(value) {
  if (!value) return null;
  const parsed = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseNearbyScore(chunk, labels) {
  for (const label of labels) {
    const patterns = [
      new RegExp(`${label}[\\s\\S]{0,160}?(\\d{1,3})\\s*(?:\\/\\s*100)?`, "i"),
      new RegExp(`(\\d{1,3})\\s*(?:\\/\\s*100)?[\\s\\S]{0,160}?${label}`, "i"),
    ];
    for (const pattern of patterns) {
      const match = chunk.match(pattern);
      const score = parseNumber(match?.[1]);
      if (score !== null && score >= 0 && score <= 100) return score;
    }
  }
  return null;
}

function parseNearbyCount(chunk, labels) {
  for (const label of labels) {
    const patterns = [
      new RegExp(`([\\d,]+)\\s+${label}`, "i"),
      new RegExp(`${label}[\\s\\S]{0,80}?([\\d,]+)`, "i"),
    ];
    for (const pattern of patterns) {
      const count = parseNumber(chunk.match(pattern)?.[1]);
      if (count !== null) return count;
    }
  }
  return null;
}

function hasMustHearLabel(chunk) {
  return /must\s*hear|must-hear|musthear/i.test(chunk);
}

function classifyQualityLabels({ criticScore, userScore, chunk }) {
  const labels = [];
  const criticStrong = typeof criticScore === "number" && criticScore >= 80;
  const userStrong = typeof userScore === "number" && userScore >= 80;

  if (criticStrong && userStrong) {
    labels.push({
      code: "purple",
      label: "紫标",
      reason: "AOTY critic score >= 80 and user score >= 80",
    });
  } else {
    if (criticStrong) {
      labels.push({
        code: "blue",
        label: "蓝标",
        reason: "AOTY critic score >= 80",
      });
    }
    if (userStrong) {
      labels.push({
        code: "orange",
        label: "橙标",
        reason: "AOTY user score >= 80",
      });
    }
  }

  if (hasMustHearLabel(chunk)) {
    labels.push({
      code: "must-hear",
      label: "Must Hear",
      reason: "AOTY page contains Must Hear label",
    });
  }

  return labels;
}

function normalizeTitle(title) {
  return title
    .replace(/\s+-\s+Album.*$/i, "")
    .replace(/\s+\|\s+Album.*$/i, "")
    .trim();
}

function parseAotyAlbumList(html, source) {
  const albumsByUrl = new Map();
  const anchorPattern = /<a\b[^>]*href=["']([^"']*\/album\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const matches = [...html.matchAll(anchorPattern)];

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const href = decodeHtml(match[1]);
    const rawTitle = normalizeTitle(stripTags(match[2]));
    if (!rawTitle || rawTitle.length < 2 || /reviews?|ratings?|users?|critic/i.test(rawTitle)) {
      continue;
    }

    const start = match.index ?? 0;
    const nextStart = matches[index + 1]?.index;
    const end =
      typeof nextStart === "number"
        ? nextStart
        : Math.min(html.length, start + match[0].length + 2200);
    const chunk = stripTags(html.slice(start, end));
    const year = chunk.match(/\b(19|20)\d{2}\b/)?.[0] ?? null;
    const aotyUrl = absolutizeAotyUrl(href);

    if (!albumsByUrl.has(aotyUrl)) {
      const criticScore = parseNearbyScore(chunk, ["Critic Score", "Critics Score", "Critic"]);
      const userScore = parseNearbyScore(chunk, ["User Score", "Users Score", "User"]);
      albumsByUrl.set(aotyUrl, {
        title: rawTitle,
        year,
        aotyUrl,
        criticScore,
        userScore,
        criticReviewCount: parseNearbyCount(chunk, ["critic reviews?", "reviews?"]),
        userRatingCount: parseNearbyCount(chunk, ["user ratings?", "ratings?"]),
        qualityLabels: classifyQualityLabels({ criticScore, userScore, chunk }),
        matchKeys: [rawTitle],
      });
    }
  }

  return [...albumsByUrl.values()].map((album) => ({
    ...album,
    sourceArtistUrl: source.aoty,
  }));
}

function parseBrowserTextAlbumList(text, source) {
  const albumsByTitle = new Map();
  const lines = text
    .split(/\r?\n/)
    .map((line) => stripTags(line).trim())
    .filter(Boolean);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const linkedAlbum = line.match(/\[([^\]]{2,120})\]\(([^)]*\/album\/[^)]*)\)/i);
    const plainAlbum = line.match(/^(.{2,120})\s+(?:by\s+.+\s+)?(?:Album|EP|Mixtape)\b/i);
    const title = linkedAlbum?.[1] ?? plainAlbum?.[1] ?? "";
    if (!title || /reviews?|ratings?|users?|critic|album of the year/i.test(title)) continue;

    const windowText = lines.slice(index, index + 14).join(" ");
    const year = windowText.match(/\b(19|20)\d{2}\b/)?.[0] ?? null;
    const criticScore = parseNearbyScore(windowText, ["Critic Score", "Critics Score", "Critic"]);
    const userScore = parseNearbyScore(windowText, ["User Score", "Users Score", "User"]);
    const aotyUrl = linkedAlbum?.[2] ? absolutizeAotyUrl(decodeHtml(linkedAlbum[2])) : null;

    if (!aotyUrl && criticScore === null && userScore === null) continue;
    if (!albumsByTitle.has(title)) {
      albumsByTitle.set(title, {
        title,
        year,
        aotyUrl: aotyUrl ?? source.aoty,
        criticScore,
        userScore,
        criticReviewCount: parseNearbyCount(windowText, ["critic reviews?", "reviews?"]),
        userRatingCount: parseNearbyCount(windowText, ["user ratings?", "ratings?"]),
        qualityLabels: classifyQualityLabels({ criticScore, userScore, chunk: windowText }),
        matchKeys: [title],
        sourceArtistUrl: source.aoty,
      });
    }
  }

  return [...albumsByTitle.values()];
}

function parseAlbumsByFetchMode({ html, source, fetchMode }) {
  if (fetchMode === "browser-text") {
    return parseBrowserTextAlbumList(html, source);
  }
  return parseAotyAlbumList(html, source);
}

function validateAlbums(albums) {
  return albums.filter((album) => {
    const hasTitle = typeof album.title === "string" && album.title.trim().length > 1;
    const hasUrl = typeof album.aotyUrl === "string" && album.aotyUrl.includes("/album/");
    return hasTitle && hasUrl;
  });
}

function mergeWithPrevious({ previousEntry, nextEntry }) {
  if (nextEntry.status === "ok") return nextEntry;
  if (!previousEntry?.albums?.length) return nextEntry;

  return {
    ...previousEntry,
    status: "stale",
    lastAttemptAt: nextEntry.lastAttemptAt,
    error: nextEntry.error,
    fetchMode: nextEntry.fetchMode,
  };
}

async function executeArtistUpdate({ source, previousEntry, args }) {
  const lastAttemptAt = new Date().toISOString();
  let lastError = null;
  try {
    let page;
    try {
      page = await loadArtistPage(source, args);
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      page = await loadBrowserTextFallback(source, args);
    }
    const { html, fetchMode } = page;
    const albums = validateAlbums(parseAlbumsByFetchMode({ html, source, fetchMode }));

    if (!albums.length) {
      throw new Error("No album entries parsed from AOTY artist page");
    }

    return {
      artistId: source.artistId,
      artistName: source.artistId
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" "),
      sourceArtistUrl: source.aoty,
      updatedAt: lastAttemptAt,
      lastAttemptAt,
      status: "ok",
      fetchMode,
      error: lastError && fetchMode === "browser-text" ? `http fallback failed: ${lastError}` : null,
      albums,
    };
  } catch (error) {
    const nextEntry = {
      artistId: source.artistId,
      artistName: previousEntry?.artistName ?? source.artistId,
      sourceArtistUrl: source.aoty,
      updatedAt: previousEntry?.updatedAt ?? null,
      lastAttemptAt,
      status: "error",
      fetchMode: args.sourceDir ? "local-html" : args.browserTextDir ? "browser-text" : "http-fetch",
      error: error instanceof Error ? error.message : String(error),
      albums: [],
    };

    return mergeWithPrevious({ previousEntry, nextEntry });
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const artistSources = await readJson(artistSourcesPath, []);
  const previousCache = await readJson(outputPath, { artists: [] });
  const previousByArtist = new Map(
    (previousCache.artists ?? []).map((entry) => [entry.artistId, entry]),
  );
  const plan = createPlan({ artistSources, args });
  const nextArtists = [];

  console.log(`[plan] ${plan.targets.length} AOTY artist page(s) scheduled`);
  console.log(`[plan] tools=${plan.tools.join(" -> ")}`);

  for (const source of plan.targets) {
    process.stdout.write(`[execute] ${source.artistId} ... `);
    const entry = await executeArtistUpdate({
      source,
      previousEntry: previousByArtist.get(source.artistId),
      args,
    });
    nextArtists.push(entry);
    console.log(`${entry.status} (${entry.albums?.length ?? 0} albums)`);
    if (entry.error) console.log(`  error: ${entry.error}`);
  }

  const untouchedArtists = (previousCache.artists ?? []).filter(
    (entry) => !plan.targets.some((target) => target.artistId === entry.artistId),
  );
  const nextCache = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    agent: {
      name: "aoty-album-agent",
      status: nextArtists.some((entry) => entry.status === "ok")
        ? "updated"
        : "no-online-update",
      plan: {
        mode: plan.mode,
        targetCount: plan.targets.length,
        tools: plan.tools,
      },
      notes: [
        "Manual Agent updater for album-level AOTY data.",
        "If AOTY blocks HTTP fetch, old album cache is preserved and the error is recorded.",
        "Optional local HTML fallback: npm run agent:aoty:update -- --source-dir data/agent-cache/aoty-html",
        "Optional browser text fallback: save visible page text to data/agent-cache/aoty-browser-text/{artistId}.txt",
      ],
    },
    artists: [...untouchedArtists, ...nextArtists].sort((a, b) =>
      a.artistId.localeCompare(b.artistId),
    ),
  };

  if (args.dryRun) {
    console.log(JSON.stringify(nextCache, null, 2));
    return;
  }

  await fs.writeFile(outputPath, `${JSON.stringify(nextCache, null, 2)}\n`);
  console.log(`[write] ${path.relative(rootDir, outputPath)}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

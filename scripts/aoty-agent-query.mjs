import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const cachePath = path.join(rootDir, "data/rag/structured/aoty-albums.json");

function parseArgs(argv) {
  const args = {
    artist: "",
    album: "",
    json: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--artist") args.artist = argv[index + 1] ?? "";
    if (item === "--album") args.album = argv[index + 1] ?? "";
    if (item === "--json") args.json = true;
  }

  return args;
}

function normalizeText(value) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, " ")
    .trim();
}

function matchArtist(entry, artist) {
  if (!artist) return true;
  const target = normalizeText(artist).replace(/\s+/g, "-");
  return (
    entry.artistId === target ||
    normalizeText(entry.artistName ?? "") === normalizeText(artist)
  );
}

function matchAlbum(album, query) {
  if (!query) return true;
  const normalizedQuery = normalizeText(query);
  const keys = [album.title, ...(album.matchKeys ?? [])].filter(Boolean);
  return keys.some((key) => normalizeText(key).includes(normalizedQuery));
}

function labelText(album) {
  return album.qualityLabels?.length
    ? album.qualityLabels.map((item) => item.label).join(" / ")
    : "无";
}

function formatAlbum(album) {
  return [
    `- ${album.title}${album.year ? ` (${album.year})` : ""}`,
    `  AOTY: ${album.aotyUrl ?? "暂无"}`,
    `  critic: ${album.criticScore ?? "暂无"} | user: ${album.userScore ?? "暂无"}`,
    `  critic reviews: ${album.criticReviewCount ?? "暂无"} | user ratings: ${album.userRatingCount ?? "暂无"}`,
    `  labels: ${labelText(album)}`,
  ].join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cache = JSON.parse(await fs.readFile(cachePath, "utf8"));
  const artists = (cache.artists ?? []).filter((entry) => matchArtist(entry, args.artist));
  const result = artists.map((entry) => ({
    ...entry,
    albums: (entry.albums ?? []).filter((album) => matchAlbum(album, args.album)),
  }));

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (!result.length) {
    console.log("No matching artist cache found.");
    console.log(`Cache status: ${cache.agent?.status ?? "unknown"}`);
    console.log("Run npm run agent:aoty:update first, or import local HTML with --source-dir.");
    return;
  }

  for (const entry of result) {
    console.log(`Artist: ${entry.artistName ?? entry.artistId} (${entry.artistId})`);
    console.log(`Status: ${entry.status ?? "unknown"}`);
    console.log(`Updated: ${entry.updatedAt ?? "暂无"}`);
    console.log(`Source: ${entry.sourceArtistUrl ?? "暂无"}`);
    if (entry.error) console.log(`Last error: ${entry.error}`);
    if (!entry.albums?.length) {
      console.log("Albums: none");
      continue;
    }
    console.log(`Albums: ${entry.albums.length}`);
    console.log(entry.albums.map(formatAlbum).join("\n"));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

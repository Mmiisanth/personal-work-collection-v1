import fs from "node:fs";
import {
  cosineSimilarity,
  embedTexts,
  embeddingsPath,
  parseArgs,
} from "./rag-utils.mjs";

const args = parseArgs();
const query = args._.join(" ").trim();
const mode = args.mode || "mean";
const artistId = args.artist;
const topK = Number(args.top || 8);

if (!query) {
  throw new Error('Usage: npm run rag:search -- "query text" -- --mode mean --artist lady-gaga');
}

if (!fs.existsSync(embeddingsPath)) {
  throw new Error("RAG embeddings not found. Run npm run rag:embed first.");
}

const payload = JSON.parse(fs.readFileSync(embeddingsPath, "utf8"));
const [queryVector] = await embedTexts([query]);

const results = payload.embeddings
  .filter(({ chunk }) => {
    if (artistId && chunk.artistId !== artistId) return false;
    if (mode === "neutral" && chunk.mode === "mean") return false;
    return true;
  })
  .map(({ chunk, embedding }) => ({
    score: cosineSimilarity(queryVector, embedding),
    chunk,
  }))
  .sort((a, b) => b.score - a.score)
  .slice(0, topK);

console.log(JSON.stringify(results, null, 2));

import fs from "node:fs";
import { embeddingsPath, loadEnv } from "./rag-utils.mjs";

loadEnv();

if (!fs.existsSync(embeddingsPath)) {
  throw new Error("RAG embeddings not found. Run npm run rag:embed first.");
}

let ChromaClient;
try {
  ({ ChromaClient } = await import("chromadb"));
} catch {
  throw new Error("Chroma client is not installed. Run: npm install chromadb");
}

const payload = JSON.parse(fs.readFileSync(embeddingsPath, "utf8"));
const collectionName = process.env.CHROMA_COLLECTION || "riotbus_artist_knowledge";
const chromaUrl = process.env.CHROMA_URL || "http://localhost:8000";
const client = new ChromaClient({ path: chromaUrl });
const collection = await client.getOrCreateCollection({ name: collectionName });

const ids = payload.embeddings.map((item) => item.chunk.id);
const documents = payload.embeddings.map((item) => item.chunk.text);
const embeddings = payload.embeddings.map((item) => item.embedding);
const metadatas = payload.embeddings.map((item) => ({
  artistId: item.chunk.artistId,
  category: item.chunk.category,
  mode: item.chunk.mode,
  source: item.chunk.source,
  verified:
    typeof item.chunk.verified === "boolean" ? String(item.chunk.verified) : "",
  aggressive:
    typeof item.chunk.aggressive === "boolean" ? String(item.chunk.aggressive) : "",
}));

for (let index = 0; index < ids.length; index += 100) {
  await collection.upsert({
    ids: ids.slice(index, index + 100),
    documents: documents.slice(index, index + 100),
    embeddings: embeddings.slice(index, index + 100),
    metadatas: metadatas.slice(index, index + 100),
  });
  console.log(`Pushed ${Math.min(index + 100, ids.length)} / ${ids.length}`);
}

console.log(`Pushed ${ids.length} chunks to Chroma collection "${collectionName}" at ${chromaUrl}`);

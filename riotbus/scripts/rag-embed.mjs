import fs from "node:fs";
import {
  chunksPath,
  embedTexts,
  embeddingsPath,
  loadEnv,
  writeJson,
} from "./rag-utils.mjs";

if (!fs.existsSync(chunksPath)) {
  throw new Error("RAG chunks not found. Run npm run rag:chunks first.");
}

loadEnv();

const payload = JSON.parse(fs.readFileSync(chunksPath, "utf8"));
const chunks = payload.chunks ?? [];
const batchSize = Number(process.env.EMBEDDING_BATCH_SIZE || 10);
const embeddings = [];

for (let index = 0; index < chunks.length; index += batchSize) {
  const batch = chunks.slice(index, index + batchSize);
  const vectors = await embedTexts(batch.map((chunk) => chunk.text));
  for (let offset = 0; offset < batch.length; offset += 1) {
    embeddings.push({
      chunk: batch[offset],
      embedding: vectors[offset],
    });
  }
  console.log(`Embedded ${Math.min(index + batch.length, chunks.length)} / ${chunks.length}`);
}

writeJson(embeddingsPath, {
  version: 1,
  provider: {
    baseUrl: process.env.EMBEDDING_BASE_URL,
    model: process.env.EMBEDDING_MODEL,
    dimensions: process.env.EMBEDDING_DIMENSIONS,
  },
  generatedAt: new Date().toISOString(),
  chunkCount: embeddings.length,
  embeddings,
});

console.log(`Wrote embeddings -> ${embeddingsPath}`);

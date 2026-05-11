import fs from "node:fs";
import path from "node:path";

export const projectRoot = process.cwd();
export const ragIndexDir = path.join(projectRoot, "data/rag/index");
export const chunksPath = path.join(ragIndexDir, "rag-chunks.json");
export const embeddingsPath = path.join(ragIndexDir, "rag-embeddings.json");

export function ensureRagIndexDir() {
  fs.mkdirSync(ragIndexDir, { recursive: true });
}

export function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(projectRoot, relativePath), "utf8"));
}

export function writeJson(filePath, value) {
  ensureRagIndexDir();
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

export function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const fullPath = path.join(projectRoot, file);
    if (!fs.existsSync(fullPath)) continue;
    const lines = fs.readFileSync(fullPath, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match) continue;
      const [, key, rawValue] = match;
      if (process.env[key]) continue;
      process.env[key] = rawValue.replace(/^["']|["']$/g, "");
    }
  }
}

export function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let index = 0; index < a.length && index < b.length; index += 1) {
    dot += a[index] * b[index];
    normA += a[index] * a[index];
    normB += b[index] * b[index];
  }
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function parseArgs(argv = process.argv.slice(2)) {
  const args = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith("--")) {
      args._.push(item);
      continue;
    }
    const key = item.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
      continue;
    }
    args[key] = next;
    index += 1;
  }
  return args;
}

export async function embedTexts(texts) {
  loadEnv();
  const baseUrl = (process.env.EMBEDDING_BASE_URL || "").replace(/\/$/, "");
  const apiKey =
    process.env.EMBEDDING_API_KEY ||
    process.env.DASHSCOPE_API_KEY ||
    process.env.QWEN_API_KEY;
  const model = process.env.EMBEDDING_MODEL || "text-embedding-v4";
  const dimensions = Number(process.env.EMBEDDING_DIMENSIONS || 0);

  if (!baseUrl || !apiKey) {
    throw new Error(
      "Embedding provider is not configured. Set EMBEDDING_BASE_URL and DASHSCOPE_API_KEY.",
    );
  }

  const body = {
    model,
    input: texts,
    encoding_format: "float",
    ...(dimensions ? { dimensions } : {}),
  };

  const response = await fetch(`${baseUrl}/embeddings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Embedding request failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  return data.data.map((item) => item.embedding);
}

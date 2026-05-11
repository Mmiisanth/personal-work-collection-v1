# RiotBus Requirements

## Runtime

- Node.js `>= 20`
- npm `>= 10`
- Modern browser: Chrome, Edge, Safari, or Firefox

## Required npm dependencies

Installed through `package.json`:

- `next`
- `react`
- `react-dom`
- `framer-motion`
- `lucide-react`

Development dependencies:

- `typescript`
- `tailwindcss`
- `postcss`
- `autoprefixer`
- `@types/node`
- `@types/react`
- `@types/react-dom`

## Required environment variables

For default AI generation:

```bash
DEFAULT_AI_BASE_URL=https://api.deepseek.com
DEFAULT_AI_MODEL=deepseek-chat
DEEPSEEK_API_KEY=replace-with-your-key
```

The app also supports user-provided OpenAI-compatible APIs from the UI. Those custom keys are kept in browser session storage for the current session and are not committed.

## Optional RAG / embedding variables

For DashScope/Qwen embedding:

```bash
EMBEDDING_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
EMBEDDING_MODEL=text-embedding-v4
EMBEDDING_DIMENSIONS=1024
EMBEDDING_BATCH_SIZE=10
DASHSCOPE_API_KEY=replace-with-your-dashscope-key
```

For optional Chroma export:

```bash
CHROMA_URL=http://localhost:8000
CHROMA_COLLECTION=riotbus_artist_knowledge
```

## Optional Python dependency

Only needed if running the standalone Python embedding sample:

```bash
pip install -r requirements-rag.txt
```

Current Python requirement:

```text
dashscope>=1.20.0
```

## Git hygiene

Do not commit:

- `.env`
- `.env.local`
- `.next`
- `node_modules`
- `.DS_Store`
- `tsconfig.tsbuildinfo`
- `data/rag/index/rag-embeddings.json`
- `data/rag/index/chroma-export.json`
- raw private/reference images under `public/assets/artists/source`

Commit:

- source code
- generated public assets needed by the website
- JSON seed data and RAG knowledge source
- `data/rag/index/rag-chunks.json`, because it is deterministic and small enough for MVP

## Validation before publishing

Run:

```bash
npm run typecheck
npm run build
```

If RAG content changed, also run:

```bash
npm run rag:chunks
```

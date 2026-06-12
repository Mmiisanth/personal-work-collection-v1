# RiotBus Multi-Agent V1

## Goal

RiotBus V1 uses a two-agent loop:

- Data Workflow Agent: parse the user query, identify artists and metrics, read structured local evidence, validate missing fields, and produce an evidence context.
- Meme Generation Agent: generate neutral or mean reports from evidence, local RAG language, and short-term conversation memory.

The first web version must not depend on live anti-bot bypass. Live crawling remains a manual or scheduled update workflow. The page-level agent reads cached structured data and explains missing data instead of fabricating facts.

## Query Rules

User input can mention artists by official name, short name, display name, slug, or local mean nickname. The parser falls back to the current page pair when fewer than two artists are found.

Metric keywords:

- AOTY, album, review, critic, user score, 乐评, 专辑, 评分 -> reviews
- Grammy, 通类, 年专, 年制, 年歌, 新人, 奖项 -> awards
- sales, ChartMasters, 销量 -> sales
- Spotify, streaming, 流媒, 关注 -> streaming
- RYM, RateYourMusic -> reviews with RYM source marked as missing/linked

If no metric is recognized, the agent uses the current selected metrics.

## Evidence Policy

The agent may use:

- `data/rag/structured/artist-metrics.json`
- `data/rag/structured/aoty-albums.json`
- `data/rag/structured/rc-reviews.json`
- `data/rag/sources/artist-sources.json`
- `data/artists.ts`

RC is the stable automatic album-review source. AOTY is a supplemental cache. The agent must mark missing AOTY album cache or RYM ratings as missing. It may provide source links for future collection but must not invent scores.

## RC Collection Path

Robert Christgau pages are reachable through each artist's `links.RC` / `artist-sources.rc` URL. Use RC as the main automatic album-review source:

```bash
npm run agent:rc:update
npm run agent:rc:update -- --artist taylor-swift
```

The updater writes every parsed RC row into `data/rag/structured/rc-reviews.json`, including album title, label/year, grade, grade label, and review excerpt.

RC grade guide used by the agent:

- `A+`: near-canonical / 神专级。
- `A`: very strong album.
- `A-`: excellent album.
- `B+`: clearly positive.
- `B / B- / C`: descending lower tiers.
- `*** / ** / *`: star/snowflake style recommendations where more is better, but they are not equivalent to full-album A grades.
- `Choice Cuts / ✂️`: only the listed songs are recommended.
- `Bomb / 💣`: very poor.

## AOTY Collection Path

AOTY artist pages are the correct source for album-level critic/user scores. V1 uses a browser-text fallback instead of automating anti-bot bypass:

1. Open the artist source URL from `data/rag/sources/artist-sources.json` in a normal browser.
2. If Cloudflare asks for verification, complete it manually.
3. Copy visible album-card text into `data/agent-cache/aoty-browser-text/{artistId}.txt`.
4. Keep each album block in this shape:

```md
[folklore](https://www.albumoftheyear.org/album/123-taylor-swift-folklore.php)
2020
Critic Score 88
User Score 82
27 critic reviews
12,000 user ratings
Must Hear
```

5. Run:

```bash
npm run agent:aoty:update -- --artist taylor-swift --browser-text-dir data/agent-cache/aoty-browser-text
```

The updater first tries HTTP fetch. If AOTY returns Cloudflare 403, it falls back to the local browser text. This preserves the agent workflow without bypassing Cloudflare. In production prompts, RC evidence should be preferred over AOTY when both are present because RC is automatically refreshable.

## Page Flow

1. User enters a natural-language query in the left workflow panel.
2. `/api/agents/enrich` parses artists and metrics.
3. The page updates the compared artists and metrics when the parser finds a valid pair.
4. The workflow panel displays `Plan -> Tool -> Execute -> Validate -> Memory`.
5. The right report panel waits for a manual click.
6. `/api/ai/generate` receives `agentContext` and generates a report.

## Failure Rules

- If a source is missing, show `缺失` in the workflow result.
- If AOTY cache is empty, keep the source URL and explain that scheduled/manual update is needed.
- If user asks for an unsupported artist, keep the current pair and show parser fallback.
- Do not perform live crawling from the user-facing API in V1.

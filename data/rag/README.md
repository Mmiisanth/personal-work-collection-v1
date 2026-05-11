# RiotBus 内容库填写说明

这个目录分两类内容：

- `sources/` 和 `structured/`：硬数据、来源链接、人工补录数值。适合精确表格，不建议走向量库。
- `knowledge/` 和 `templates/`：艺人画像、黑称黑话、争议、挽尊话术、标题模板。适合后续接 RAG / 向量检索。

当前 MVP 已经会读取这些 JSON，并把相关艺人的内容拼进 AI prompt。后续如果接 Chroma / pgvector / LanceDB，可以优先替换 `lib/rag.ts` 的检索逻辑。

## Embedding / RAG 实验链路

当前已经配置一套可选 embedding 流程，用来做作品展示和后续检索增强；它不会影响现有页面启动。

1. `npm run rag:chunks`
   - 从 `knowledge/artist-knowledge.json` 生成语义块。
   - 输出：`data/rag/index/rag-chunks.json`。
   - 当前切块粒度：一个黑点、一个荣誉、一个称呼组、一个粉丝称呼组、一个对家关系、一个标题素材。

2. `npm run rag:embed`
   - 使用 OpenAI-compatible embedding API 生成向量。
   - 默认按 DashScope/Qwen 配置读取 `.env.local` 或 `.env`。
   - 输出：`data/rag/index/rag-embeddings.json`，该文件已加入 `.gitignore`，避免提交大向量和潜在敏感信息。

3. `npm run rag:search -- "查询内容" -- --mode mean --artist lady-gaga`
   - 对查询文本做 embedding，并在本地 JSON 向量文件里做 cosine similarity 检索。
   - `mode=neutral` 会过滤掉只属于 `mean` 的黑称、粉丝黑称、争议类 chunk。

4. `npm run rag:chroma`
   - 可选：把本地 embedding 推送到 Chroma。
   - 使用前需要额外安装并启动 Chroma：`npm install chromadb`，并配置 `CHROMA_URL`。

`.env.example` 里已经预留：

- `EMBEDDING_BASE_URL`
- `EMBEDDING_MODEL`
- `EMBEDDING_DIMENSIONS`
- `EMBEDDING_BATCH_SIZE`
- `DASHSCOPE_API_KEY`
- `CHROMA_URL`
- `CHROMA_COLLECTION`

为什么不把 Chroma 作为必需依赖：

- 现在硬数据仍然走结构化精确读取，不应该用向量召回。
- 当前素材规模不大，本地 JSON 向量检索已经足够做 MVP 和简历展示。
- Chroma 需要额外服务和部署配置，适合放在 RAG v2，而不是阻塞当前网站主流程。

## 文件分工

| 文件 | 类型 | 你主要填写什么 | 当前用途 |
| --- | --- | --- | --- |
| `sources/artist-sources.json` | 艺人级链接库 | AOTY 艺人主页、RYM 艺人主页、RC 艺人页 | 生成报告时提供艺人专属来源入口，后续 agent 抓页面也从这里取 URL |
| `sources/platform-sources.json` | 平台级来源库 | CM 总销量榜、CM Spotify followers 榜这种所有艺人共用的页面 | 避免在 20 个艺人下面重复填同一个页面 |
| `structured/artist-metrics.json` | 硬数据表 | CM 总销量、Spotify followers、Grammy wins/noms/GF、AOTY 乐评/用户分 | 作为事实数据补录进 prompt，比向量匹配优先级更高 |
| `knowledge/artist-knowledge.json` | RAG 知识库 | 艺人标签、艺人画像、黑称、美称、粉丝名、粉丝黑称、对家、争议点、挽尊话术、荣誉点 | 给 AI 报告提供圈内语气和上下文 |
| `templates/title-patterns.json` | 标题模板库 | 分享图标题规则、句式、示例标题 | 生成分享图/PDF 标题时使用 |
| `intake-template.md` | 自然语言录入模板 | 你可以按这个格式把资料发给 Codex | Codex 负责把自然语言转成 JSON |

填写原则：

- 硬数据必须带 `sourceUrl` 和 `updatedAt`。
- CM 不按艺人填单独页面。销量统一查 `https://chartmasters.org/best-selling-artists-of-all-time/`，Spotify followers 统一查 `https://chartmasters.org/spotify-most-followed-artists/`。
- Grammy 使用结构：`wins / nominations / GF(年专/年制/年歌/年新)`。GF 只写通类获奖数，不把提名算进去。
- 正常称呼/美称、正常粉丝名默认给 `neutral` 和 `mean` 都可以用。
- 黑称、黑话、粉丝黑称只是称呼库，不做真假判断，也不需要逐条标 `verified` 或 `aggressive`。
- `wordplaySeeds` 和 `wordplayExamples` 是 mean 模式的造句包，只负责谐音、标题梗和粉圈语气，不等于事实数据，也不等于必须展示的黑称。
- `是否可验证` 只用于黑点/争议/名场面、荣誉点这类“事件或事实”，不用于黑称。
- `mean` 模式可以用黑称、粉丝黑称和对家素材增强语气；黑称和粉丝黑称必须用 `<shade>内容</shade>` 包住，页面会显示为灰色荧光标记。
- `neutral` 模式只使用画像、正常称呼、正常粉丝名、荣誉点和结构化数据，不使用黑称黑话。

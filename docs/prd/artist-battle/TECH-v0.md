# RiotBus TECH v0

## 1. 技术目标

`RiotBus` 第一版目标是先跑通完整产品链路：

- 首页 Banner
- 模式选择
- 筛选弹窗
- 结果页数据对比
- AI 报告生成
- AI 追问
- PDF / 分享总结

MVP 不追求一次性做成完整数据平台。第一版优先做“结构化补录数据 + 真流程 + 可选 RAG 实验层”。

当前状态：

- 首页、筛选弹窗、对比页、AI 面板已经实现。
- 数据先使用本地 seed 和 JSON 内容库。
- AI 调用走 OpenAI-compatible chat API。
- RAG 当前以本地 chunks + 可选 embedding 为主，Chroma 作为扩展能力。

## 2. 核心原则

- 先用本地 seed / JSON 数据，不先接复杂数据库。
- 先做页面、AI 工作流和内容库，不先做自动采集器。
- 先支持 20 个首发艺人，不做全量艺人库。
- 先支持 2 人 PK，不做多人乱斗。
- 先做可用页面，再逐步补真实数据源。
- 所有 AI 输出必须基于已提供数据，不允许凭空造事实。

## 3. 技术栈

前端：
- `Next.js App Router`
- `TypeScript`
- `Tailwind CSS`
- `Framer Motion`
- `lucide-react`

后端：
- `Next.js Route Handlers`
- 先只做 AI 相关 API
- 数据先走本地 seed 文件

数据：
- MVP 阶段使用本地 TypeScript seed 数据
- 后续再迁移到 `Prisma + Postgres`

AI：
- 兼容 OpenAI API 格式
- 支持平台 default AI
- 支持用户自填 `base_url / api_key / model`

## 4. 暂不引入的东西

MVP 暂不做：

- 独立后端服务
- NestJS
- 用户登录
- 完整数据库后台
- 自动爬虫系统
- 付费系统
- 多人 PK
- 全量艺人搜索

说明：当前已经有 RAG chunks、embedding 脚本和 Chroma push 脚本，但向量库不是网站运行的必需依赖。

这些都不是不要，而是等第一版跑顺后再加。

## 5. 项目结构

建议结构：

```text
app/
  page.tsx
  compare/
    page.tsx
  api/
    ai/
      check/
        route.ts
      generate/
        route.ts
      export/
        route.ts
components/
  ai-panel.tsx
  capsule-switch.tsx
  data-table.tsx
  filter-modal.tsx
  glass-panel.tsx
  news-carousel.tsx
  news-modal.tsx
  slanted-banner-card.tsx
data/
  artists.ts
  banners.ts
  slang.ts
  rag/
    knowledge/
    structured/
    sources/
    index/
lib/
  artist-display.ts
  ai.ts
  prompts.ts
  rag.ts
  types.ts
scripts/
  rag-build-chunks.mjs
  rag-embed.mjs
  rag-search.mjs
  rag-chroma-push.mjs
  style-avatar-samples.mjs
```

## 6. 本地数据结构

第一版先用本地数据，不上数据库。

`artists.ts` 存：
- 艺人 id
- 艺人名
- 模式化显示名
- 头像路径
- 销量展示值
- Spotify followers
- GRAMMY 展示值
- AOTY 展示值
- 来源链接

`banners.ts` 存：
- 标题
- 摘要
- Banner 图片路径
- 来源链接

`slang.ts` 存：
- 艺人 id
- 外号
- 梗
- 争议摘要
- 风险等级

## 7. API 设计

### 7.1 `POST /api/ai/check`

用途：
- 校验用户自填 API 是否可用

输入：
- `baseUrl`
- `apiKey`
- `model`

输出：
- `ok`
- `message`

### 7.2 `POST /api/ai/generate`

用途：
- 根据当前 PK 数据生成 AI 首轮报告或追问回复

输入：
- `mode`
- `artists`
- `metrics`
- `messages`
- `provider`

输出：
- `message`

### 7.3 `POST /api/ai/export`

用途：
- 根据当前 PK 数据和对话生成 PDF 文案

输入：
- `mode`
- `artists`
- `metrics`
- `conversation`

输出：
- `title`
- `content`

## 8. AI Key 策略

MVP 支持两种方式：

- default AI
- 用户自填 API

default AI：
- 免费开放直到额度用完
- MVP 先不做复杂付费
- 后续如出现滥用，再增加限流或排队

用户 API Key：
- 只用于本次请求
- 不写入日志
- MVP 不长期保存

## 9. 第一阶段开发顺序

1. 初始化 Next 项目
2. 配置 Tailwind tokens 和基础样式
3. 写 seed 数据
4. 做首页静态版
5. 做 Banner 换位动画
6. 做模式切换条
7. 做资讯弹窗
8. 做筛选弹窗
9. 做结果页静态版
10. 接 AI mock
11. 接 OpenAI-compatible API
12. 做导出弹窗

## 10. 验收标准

第一版完成时需要满足：

- 首页能展示 RiotBus 品牌和 3 条 Banner
- Banner 可以点击切换并打开详情弹窗
- 用户可以选择 `刻薄女孩` 或 `清清白白`
- 用户可以选择 2 位艺人
- 用户可以勾选至少 1 个维度
- 结果页能按所选维度展示数据表
- AI 面板能生成一段报告
- 用户能继续追问
- 导出弹窗能生成标题和总结正文

## 11. RAG / Embedding 技术路线

RiotBus 的 RAG 不把所有数据都向量化。硬数据和粉圈语料分开处理：

- `CM / Spotify followers / Grammy / AOTY` 属于硬数据，继续按 `artistId + metric` 精确读取。
- `黑称 / 粉丝黑称 / 对家 / 争议 / 荣誉 / 标题素材` 属于语料库，可以进入 embedding 检索。
- `neutral` 模式必须过滤 `mode=mean` 的 chunk，避免召回黑称和攻击性语料。

### 11.1 当前实现

当前使用“本地 JSON 向量索引”作为 RAG 实验层：

```text
artist-knowledge.json
  -> npm run rag:chunks
  -> data/rag/index/rag-chunks.json
  -> npm run rag:embed
  -> data/rag/index/rag-embeddings.json
  -> npm run rag:search
```

切块策略不是按固定 token 数切，而是按业务语义对象切：

- 一个黑点 / 争议 = 一个 chunk
- 一个荣誉点 = 一个 chunk
- 一组正常称呼 = 一个 chunk
- 一组黑称 = 一个 chunk
- 一组粉丝称呼 = 一个 chunk
- 一个对家关系 = 一个 chunk
- 一个标题素材组 = 一个 chunk

每个 chunk 带 metadata：

- `artistId`
- `category`
- `mode`
- `verified`
- `aggressive`
- `source`

### 11.2 Embedding Provider

Embedding 使用 OpenAI-compatible 接口，默认预留 DashScope/Qwen：

- `EMBEDDING_BASE_URL`
- `EMBEDDING_MODEL`
- `EMBEDDING_DIMENSIONS`
- `DASHSCOPE_API_KEY`

这让项目可以展示完整 RAG 能力，但不会把某一家 embedding 服务写死。

### 11.3 Chroma 取舍

Chroma 可以用，但不作为 MVP 必需项。

适合用 Chroma 的原因：

- 简历展示更像完整 RAG 项目。
- 本地实验方便，看起来技术栈更完整。
- 后续素材扩到大量新闻、长文、评论语料时，向量库有意义。

暂不强依赖 Chroma 的原因：

- 当前 20 个艺人的语料规模小，本地 JSON 向量检索足够。
- Chroma 需要额外服务，部署复杂度比 JSON 高。
- 硬数据不能靠向量召回，否则容易把事实数据匹配错艺人。

因此路线是：

1. MVP：结构化读取 + 本地 RAG chunks。
2. RAG v1：Qwen/DashScope embedding + 本地 JSON 向量检索。
3. RAG v2：可选推送 Chroma，用 collection 管理 chunks。
4. 生产化：如果未来上线多人使用，再考虑 `Postgres + pgvector` 或 `sqlite-vec`。

## 12. 后续升级

第二阶段再考虑：

- Prisma + Postgres
- Spotify API 接入
- AOTY / RYM 采集器
- CM 补录后台
- 黑话表管理后台
- 登录与历史记录
- PNG 长图导出

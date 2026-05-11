# RiotBus / 乱斗巴士

`RiotBus` 是一个欧美女歌手 PK 网站 MVP：用户选择两位艺人、选择对比维度和输出模式后，页面会展示结构化数据表，并由 AI 生成可追问、可导出的 PK 报告。

项目当前重点不是做一个传统音乐资料站，而是把“查数据、看对比、生成有传播感的报告”这条链路跑通。

## 当前能力

- 首页动态斜线背景，支持 `刻薄女孩` / `清清白白` 双主题切换。
- 首页 3 条运营 Banner，支持自动轮播、手动切换和详情弹窗。
- Banner 图片统一读取 `public/assets/banners/*.png`。
- 首批 20 位女歌手，支持模式化头像与模式化显示名。
- 筛选弹窗支持 2 人 PK、维度勾选、default AI / custom API 切换。
- 对比页支持销量、Spotify followers、Grammy、AOTY 乐评四类数据。
- AI 面板支持首轮报告、追问回复和分享图/PDF 文案生成。
- RAG 内容库支持艺人画像、黑称黑话、粉丝称呼、争议、荣誉、标题素材。
- 可选 DashScope/Qwen `text-embedding-v4` embedding 流程，可导入 Chroma。

## 技术栈

- `Next.js App Router`
- `React`
- `TypeScript`
- `Tailwind CSS`
- `Framer Motion`
- `lucide-react`
- 本地 JSON/TS seed 数据
- OpenAI-compatible chat API
- 可选 DashScope/Qwen embedding

## 本地运行

安装依赖：

```bash
npm install
```

准备环境变量：

```bash
cp .env.example .env.local
```

至少填写：

```bash
DEFAULT_AI_BASE_URL=https://api.deepseek.com
DEFAULT_AI_MODEL=deepseek-chat
DEEPSEEK_API_KEY=your-key
```

启动开发环境：

```bash
npm run dev
```

打开：

```text
http://localhost:3000
```

## 常用命令

```bash
npm run dev
npm run typecheck
npm run build
npm run rag:chunks
npm run rag:embed
npm run rag:search -- "Taylor Swift vs Lady Gaga"
npm run rag:chroma
```

## 数据与素材位置

- 艺人基础数据：[data/artists.ts](data/artists.ts)
- 首页 Banner 数据：[data/banners.ts](data/banners.ts)
- AI prompt：[lib/prompts.ts](lib/prompts.ts)
- RAG 知识库：[data/rag/knowledge/artist-knowledge.json](data/rag/knowledge/artist-knowledge.json)
- 结构化指标：[data/rag/structured/artist-metrics.json](data/rag/structured/artist-metrics.json)
- Banner 图片：[public/assets/banners](public/assets/banners)
- 生成头像：[public/assets/artists/mean](public/assets/artists/mean) 和 [public/assets/artists/neutral](public/assets/artists/neutral)

Banner 图片命名：

```text
gaga-cancel.png
olivia-dropdead.png
ariana-petal.png
```

艺人头像命名：

```text
public/assets/artists/mean/{artist-id}-mean.jpg
public/assets/artists/neutral/{artist-id}-neutral.jpg
```

## RAG 流程

RAG 不用于硬数据匹配。销量、followers、Grammy、AOTY 这类硬数据继续走结构化读取；黑称、粉丝语料、争议、荣誉、标题素材才进入语义检索。

生成 chunks：

```bash
npm run rag:chunks
```

生成 embedding：

```bash
npm run rag:embed
```

本地检索：

```bash
npm run rag:search -- "尖姐和交姐谁赢" -- --mode mean --artist lady-gaga
```

推送 Chroma：

```bash
npm run rag:chroma
```

## 资产注意

`public/assets/artists/source` 是本地参考图目录，不建议上传公开仓库。公开仓库只需要提交生成后的 `mean` / `neutral` 头像和 Banner 图。

## 文档

- PRD：[docs/prd/artist-battle/PRD-v0.md](docs/prd/artist-battle/PRD-v0.md)
- 页面规格：[docs/prd/artist-battle/MVP-page-spec.md](docs/prd/artist-battle/MVP-page-spec.md)
- 技术方案：[docs/prd/artist-battle/TECH-v0.md](docs/prd/artist-battle/TECH-v0.md)
- 视觉规范：[docs/prd/artist-battle/frontend-style-v0.md](docs/prd/artist-battle/frontend-style-v0.md)
- 头像规范：[docs/assets/artist-avatar-guidelines.md](docs/assets/artist-avatar-guidelines.md)

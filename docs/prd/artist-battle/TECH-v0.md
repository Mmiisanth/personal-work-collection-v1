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

MVP 不追求一次性做成完整数据平台。第一版优先做“假数据但真流程”。

## 2. 核心原则

- 先用本地 seed 数据，不先接复杂数据库。
- 先做页面和 AI 工作流，不先做自动采集器。
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
- RAG 向量库
- 付费系统
- 多人 PK
- 全量艺人搜索

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
lib/
  ai.ts
  prompts.ts
  types.ts
```

## 6. 本地数据结构

第一版先用本地数据，不上数据库。

`artists.ts` 存：
- 艺人 id
- 艺人名
- 头像占位
- 销量展示值
- Spotify popularity
- GRAMMY 展示值
- AOTY 展示值
- 来源链接

`banners.ts` 存：
- 标题
- 摘要
- 图片占位
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

## 11. 后续升级

第二阶段再考虑：

- Prisma + Postgres
- Spotify API 接入
- AOTY / RYM 采集器
- CM 补录后台
- 黑话表管理后台
- 登录与历史记录
- PNG 长图导出

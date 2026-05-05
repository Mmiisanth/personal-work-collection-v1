# RAG 目录约定

本目录只放用户流失干预知识库与可再生成的检索索引。

- `knowledge_base.json`: 人工维护的干预策略文档，每条包含 `id`、`title`、`keywords`、`content`。
- `vector_store.json`: 运行时自动生成的本地向量索引，不写密钥，可删除后重建。

密钥不放在本目录，也不放进代码。后端通过环境变量 `DASHSCOPE_API_KEY` 读取千问/百炼 API Key。

# ChurnGuard AI / 用户流失风险智能预警平台

## 中文说明

ChurnGuard AI 是一个面向数字化订阅业务的用户流失风险预警与归因诊断 Web 项目。项目包含 React/Vite 前端、FastAPI 后端、DNN 流失预测模型、SHAP-like 基线替换归因、以及基于 RAG 的干预策略报告生成。

### 功能

- 随机抽取测试集用户并预测流失概率
- 展示用户核心特征、流失概率环形图、模型归因条形图
- 展示基于注册时长与流失概率的用户生命周期聚类图，并高亮当前用户位置
- 使用项目内 DNN 模型和 CSV 数据运行本地预测
- 使用 DashScope `text-embedding-v4` 对本地干预知识库做向量检索
- 使用 DeepSeek `deepseek-chat` 基于预测结果、归因值和 RAG 上下文生成中文诊断报告

### 本地运行

前置要求：Node.js、Python 3.9+

```bash
npm install
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
```

创建 `.env.local`，填入本地密钥：

```bash
DASHSCOPE_API_KEY="your-dashscope-api-key-for-text-embedding-v4"
DEEPSEEK_API_KEY="your-deepseek-api-key-for-report-generation"
```

启动后端：

```bash
npm run backend
```

另开一个终端启动前端：

```bash
npm run dev
```

默认地址：

- 前端：`http://localhost:3000`。如果端口被占用，Vite 会自动切到 `3001` 等其他端口。
- 后端：`http://127.0.0.1:8000/api`

### 模型与数据

运行必需文件已经放在项目内：

- `data/cleaned_data_for_dnn/train/final_dnn_model.h5`
- `data/cleaned_data_for_dnn/train/train_data.csv`
- `data/cleaned_data_for_dnn/test/test_data.csv`

后端会优先读取项目内 `data/cleaned_data_for_dnn`。如果该目录不存在，才会回退到旧的上级目录数据路径。

### RAG 知识库

- 知识库源文件：`rag/knowledge_base.json`
- 本地生成向量库：`rag/vector_store.json`
- Embedding 模型：DashScope `text-embedding-v4`
- 报告生成模型：DeepSeek `deepseek-chat`

`rag/vector_store.json` 是运行时生成文件，已被 `.gitignore` 忽略。

### 安全说明

- 不要提交 `.env.local`
- 不要把 API key、token、密码写入代码、README 或日志
- `.env*`、`.venv/`、`node_modules/`、`dist/`、`rag/vector_store.json` 已被忽略

## English

ChurnGuard AI is a web application for churn risk prediction and intervention diagnosis in digital subscription products. It includes a React/Vite frontend, a FastAPI backend, a DNN churn prediction model, SHAP-like baseline attribution, and a RAG workflow for intervention strategy reports.

### Features

- Randomly sample a test-set user and predict churn probability
- Display user features, churn probability donut chart, and attribution bar chart
- Display lifecycle clustering based on registration duration and churn probability, with the current user highlighted
- Run local prediction with the bundled DNN model and CSV data
- Retrieve intervention knowledge with DashScope `text-embedding-v4`
- Generate diagnosis reports with DeepSeek `deepseek-chat` using prediction results, attribution values, and retrieved RAG context

### Local Setup

Prerequisites: Node.js and Python 3.9+

```bash
npm install
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
```

Create `.env.local` and configure local API keys:

```bash
DASHSCOPE_API_KEY="your-dashscope-api-key-for-text-embedding-v4"
DEEPSEEK_API_KEY="your-deepseek-api-key-for-report-generation"
```

Start the backend:

```bash
npm run backend
```

Start the frontend in another terminal:

```bash
npm run dev
```

Default URLs:

- Frontend: `http://localhost:3000`. If the port is already in use, Vite may switch to `3001` or another available port.
- Backend: `http://127.0.0.1:8000/api`

### Model and Data

Required runtime artifacts are bundled in the project:

- `data/cleaned_data_for_dnn/train/final_dnn_model.h5`
- `data/cleaned_data_for_dnn/train/train_data.csv`
- `data/cleaned_data_for_dnn/test/test_data.csv`

The backend reads `data/cleaned_data_for_dnn` first. If that directory is missing, it falls back to the legacy parent-level data path.

### RAG Knowledge Base

- Source documents: `rag/knowledge_base.json`
- Generated local vector store: `rag/vector_store.json`
- Embedding model: DashScope `text-embedding-v4`
- Report model: DeepSeek `deepseek-chat`

`rag/vector_store.json` is generated at runtime and ignored by git.

### Security Notes

- Do not commit `.env.local`
- Do not write API keys, tokens, or passwords into source code, README files, or logs
- `.env*`, `.venv/`, `node_modules/`, `dist/`, and `rag/vector_store.json` are ignored

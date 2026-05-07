import hashlib
import json
import math
import os
import re
from pathlib import Path
from typing import Any, Dict, List, Optional

import requests
from dotenv import load_dotenv


RAG_DIR = Path(__file__).resolve().parent / "rag"
PROJECT_ROOT = RAG_DIR.parent
KNOWLEDGE_BASE_PATH = RAG_DIR / "knowledge_base.json"
VECTOR_STORE_PATH = RAG_DIR / "vector_store.json"

load_dotenv(PROJECT_ROOT / ".env.local")
load_dotenv(PROJECT_ROOT / ".env")

DASHSCOPE_API_KEY_ENV = "DASHSCOPE_API_KEY"
DASHSCOPE_BASE_URL = os.getenv("DASHSCOPE_BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1").rstrip("/")
DASHSCOPE_EMBEDDING_MODEL = os.getenv("DASHSCOPE_EMBEDDING_MODEL", "text-embedding-v4")
DASHSCOPE_EMBEDDING_DIMENSIONS = int(os.getenv("DASHSCOPE_EMBEDDING_DIMENSIONS", "1024"))
DEEPSEEK_API_KEY_ENV = "DEEPSEEK_API_KEY"
DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1").rstrip("/")
DEEPSEEK_CHAT_MODEL = os.getenv("DEEPSEEK_CHAT_MODEL", "deepseek-chat")


class RagConfigError(RuntimeError):
    pass


def load_knowledge_docs() -> List[Dict[str, Any]]:
    with KNOWLEDGE_BASE_PATH.open("r", encoding="utf-8") as file:
        docs = json.load(file)
    return docs


def build_retrieval_query(probability: float, features: List[Dict[str, Any]], top_features: Any) -> str:
    feature_map = {item.get("name"): item.get("value") for item in features if item.get("name")}
    query_parts = [
        f"用户流失概率 {probability:.2%}",
        f"关键特征 {top_features}",
    ]

    engagement_names = [
        "avg_secs",
        "sum_secs",
        "avg_num100",
        "avg_unq",
        "completion_rate",
        "progress_depth",
        "daily_engagement",
    ]
    engagement_values = [
        float(feature_map[name])
        for name in engagement_names
        if isinstance(feature_map.get(name), (int, float))
    ]
    if engagement_values:
        engagement_score = sum(engagement_values) / len(engagement_values)
        if engagement_score >= 0.6:
            query_parts.append("高活跃用户 内容消费深度高 需要新鲜感和会员身份权益")
        elif engagement_score <= -0.5:
            query_parts.append("低活跃 沉默用户 使用时长短 需要召回唤醒")
        else:
            query_parts.append("中活跃用户 使用习惯波动 需要激励续费和使用惯性")

    auto_renew = feature_map.get("is_auto_renew")
    if auto_renew == 0:
        query_parts.append("自动续费关闭用户 强流失预警 续费召回")

    is_cancel = feature_map.get("is_cancel")
    if is_cancel == 1:
        query_parts.append("用户取消订阅 价格敏感 续费优惠")

    reg_duration = feature_map.get("reg_duration")
    if isinstance(reg_duration, (int, float)) and float(reg_duration) <= -0.8:
        query_parts.append("新用户7天留存 新手引导 首月优惠")
    elif isinstance(reg_duration, (int, float)) and float(reg_duration) >= 0.8:
        query_parts.append("长期订阅用户 会员成长 情感绑定")

    for item in features:
        query_parts.append(
            f"{item.get('displayName') or item.get('name')}="
            f"{item.get('value')}，业务含义={item.get('translatedValue')}，"
            f"归因值={item.get('shap')}"
        )

    return "；".join(str(part) for part in query_parts if part)


def retrieve_context(query: str, top_k: int = 3) -> Dict[str, Any]:
    docs = load_knowledge_docs()
    try:
        embedded_matches = _retrieve_by_embedding(query, docs, top_k)
        if embedded_matches:
            return {"mode": "embedding", "documents": embedded_matches}
    except Exception:
        pass

    return {"mode": "lexical_fallback", "documents": _retrieve_by_keywords(query, docs, top_k)}


def generate_rag_report(
    probability: float,
    features: List[Dict[str, Any]],
    top_features: Any,
    retrieved_docs: List[Dict[str, Any]],
) -> str:
    fallback = _build_local_report(probability, top_features, retrieved_docs)
    api_key = _get_deepseek_api_key()
    if not api_key:
        return fallback

    context = "\n\n".join(
        f"【{index + 1}. {doc['title']}】\n{doc['content']}"
        for index, doc in enumerate(retrieved_docs)
    )
    risk_features = [
        item for item in features
        if float(item.get("shap") or 0) > 0
    ]
    top_risk_feature_lines = "\n".join(
        _format_feature_for_prompt(item)
        for item in sorted(risk_features, key=lambda item: float(item.get("shap") or 0), reverse=True)[:3]
    )
    all_feature_lines = "\n".join(
        _format_feature_for_prompt(item)
        for item in sorted(features, key=lambda item: abs(float(item.get("shap") or 0)), reverse=True)
    )
    prompt = f"""
你是音乐订阅平台的用户增长与留存分析专家。请基于用户预测结果、特征值和RAG检索到的干预知识，生成一份可执行的中文流失干预报告。

要求：
1. 禁止寒暄、禁止写“好的”“作为...专家”“我将为您生成”等开场白；第一行必须直接输出 `## 用户流失干预报告`。
2. 报告开头必须只列出“TOP风险归因特征”，只保留 3 个 SHAP/归因值 > 0 且最推高流失概率的特征。
3. TOP 表只允许 4 列：特征名、当前值、业务分析、SHAP/归因值。不要输出“方向”列。
4. 业务分析列必须解释该特征为什么会推高当前用户流失风险，不能只写“推高流失概率”。
5. 后续先说明该用户最匹配哪类干预策略，以及为什么匹配。
6. 给出两条低成本、可自动化执行的挽留策略。
7. 每条策略都要包含具体操作、数据依据、触发时机、ABtest分组和核心指标。
8. 不要编造知识库外的复杂运营项目；可以基于知识库做合理组合。
9. 不要编造历史ABtest结果、提升百分比、用户ID、生成时间、Kafka/消息队列/具体第三方推送服务等未提供的系统细节。
10. 标准化特征解释规则：负值表示低于平台平均水平，正值表示高于平台平均水平；reg_duration 为负表示注册时长偏短，更接近新用户。
11. 输出必须围绕当前用户特征和知识库内容，不要写“历史数据显示”“附录表”等不存在的证据。
12. 必须引用 TOP 3 风险特征的 SHAP/归因值。归因值 > 0 表示该特征推高流失概率，归因值 < 0 表示该特征降低流失概率。
13. 性别编码必须严格解释为：gender=1 是男性，gender=0 是女性，gender=-1 是未公开性别或其他原因；不要把 gender 当作连续变量解释“高/低”。
14. 如果 gender=-1，必须使用“未公开性别或其他原因”这个表述；不要改写成“性别信息缺失”，也不要把性别作为主要可干预流失原因，只能说明画像信息有限。

用户流失概率：{probability:.2%}

TOP 3 风险归因特征：
{top_risk_feature_lines}

完整特征上下文（用于辅助判断，不要整表输出）：
{all_feature_lines}

RAG知识库上下文：
{context}
""".strip()

    try:
        response = _deepseek_post(
            "/chat/completions",
            {
                "model": DEEPSEEK_CHAT_MODEL,
                "messages": [
                    {"role": "system", "content": "你是严谨的商业分析师，输出必须具体、可执行。"},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.3,
            },
            timeout=60,
        )
        return response["choices"][0]["message"]["content"]
    except Exception:
        return fallback


def _retrieve_by_embedding(query: str, docs: List[Dict[str, Any]], top_k: int) -> List[Dict[str, Any]]:
    store = _load_or_create_vector_store(docs)
    if not store:
        return []

    query_embedding = _embed_texts([query])[0]
    matches = []
    for item in store["items"]:
        doc = next((doc for doc in docs if doc["id"] == item["id"]), None)
        if not doc:
            continue
        matches.append({
            **doc,
            "score": _cosine_similarity(query_embedding, item["embedding"]),
        })
    matches.sort(key=lambda item: item["score"], reverse=True)
    return matches[:top_k]


def _load_or_create_vector_store(docs: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    fingerprint = _docs_fingerprint(docs)
    if VECTOR_STORE_PATH.exists():
        with VECTOR_STORE_PATH.open("r", encoding="utf-8") as file:
            store = json.load(file)
        if (
            store.get("fingerprint") == fingerprint
            and store.get("model") == DASHSCOPE_EMBEDDING_MODEL
            and store.get("dimensions") == DASHSCOPE_EMBEDDING_DIMENSIONS
        ):
            return store

    if not _get_dashscope_api_key():
        return None

    texts = [_doc_to_embedding_text(doc) for doc in docs]
    embeddings = _embed_texts(texts)
    store = {
        "model": DASHSCOPE_EMBEDDING_MODEL,
        "dimensions": DASHSCOPE_EMBEDDING_DIMENSIONS,
        "fingerprint": fingerprint,
        "items": [
            {"id": doc["id"], "embedding": embedding}
            for doc, embedding in zip(docs, embeddings)
        ],
    }
    with VECTOR_STORE_PATH.open("w", encoding="utf-8") as file:
        json.dump(store, file, ensure_ascii=False)
    return store


def _embed_texts(texts: List[str]) -> List[List[float]]:
    payload = {
        "model": DASHSCOPE_EMBEDDING_MODEL,
        "input": texts,
        "dimensions": DASHSCOPE_EMBEDDING_DIMENSIONS,
        "encoding_format": "float",
    }
    response = _dashscope_post("/embeddings", payload, timeout=60)
    data = sorted(response["data"], key=lambda item: item["index"])
    return [item["embedding"] for item in data]


def _dashscope_post(path: str, payload: Dict[str, Any], timeout: int) -> Dict[str, Any]:
    api_key = _get_dashscope_api_key()
    if not api_key:
        raise RagConfigError(f"{DASHSCOPE_API_KEY_ENV} is not configured")

    response = requests.post(
        f"{DASHSCOPE_BASE_URL}{path}",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=timeout,
    )
    if not response.ok:
        raise RuntimeError(f"DashScope request failed with HTTP {response.status_code}")
    return response.json()


def _get_dashscope_api_key() -> str:
    return os.getenv(DASHSCOPE_API_KEY_ENV, "").strip()


def _deepseek_post(path: str, payload: Dict[str, Any], timeout: int) -> Dict[str, Any]:
    api_key = _get_deepseek_api_key()
    if not api_key:
        raise RagConfigError(f"{DEEPSEEK_API_KEY_ENV} is not configured")

    response = requests.post(
        f"{DEEPSEEK_BASE_URL}{path}",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=timeout,
    )
    if not response.ok:
        raise RuntimeError(f"DeepSeek request failed with HTTP {response.status_code}")
    return response.json()


def _get_deepseek_api_key() -> str:
    return os.getenv(DEEPSEEK_API_KEY_ENV, "").strip()


def _format_feature_for_prompt(item: Dict[str, Any]) -> str:
    name = item.get("name")
    display_name = item.get("displayName") or name
    value = item.get("value")
    translated_value = item.get("translatedValue") or _translate_feature_value(name, value)
    attribution = float(item.get("shap") or 0)
    direction = "推高流失概率" if attribution > 0 else "降低流失概率" if attribution < 0 else "影响接近0"
    return (
        f"- {display_name} ({name}): 值={value}，业务含义={translated_value}，"
        f"SHAP/归因值={attribution:.6f}，方向={direction}"
    )


def _translate_feature_value(name: Any, value: Any) -> str:
    try:
        numeric_value = float(value)
    except (TypeError, ValueError):
        return str(value)

    if name == "gender":
        if numeric_value == 1:
            return "男性"
        if numeric_value == 0:
            return "女性"
        if numeric_value == -1:
            return "未公开性别或其他原因"
        return "未知性别编码"

    if name == "is_auto_renew":
        return "已开启自动续费" if numeric_value == 1 else "未开启自动续费"
    if name == "is_cancel":
        return "曾经取消过订阅" if numeric_value == 1 else "未取消订阅"

    return str(value)


def _retrieve_by_keywords(query: str, docs: List[Dict[str, Any]], top_k: int) -> List[Dict[str, Any]]:
    normalized_query = query.lower()
    tokens = set(re.findall(r"[a-zA-Z_]+|[\u4e00-\u9fff]{2,}", normalized_query))
    matches = []
    for doc in docs:
        score = 0.0
        for keyword in doc.get("keywords", []):
            if keyword.lower() in normalized_query:
                score += 3.0
        combined_text = f"{doc['title']} {' '.join(doc.get('keywords', []))} {doc['content']}".lower()
        score += sum(1.0 for token in tokens if token and token in combined_text)
        matches.append({**doc, "score": score})
    matches.sort(key=lambda item: item["score"], reverse=True)
    return matches[:top_k]


def _docs_fingerprint(docs: List[Dict[str, Any]]) -> str:
    raw = json.dumps(docs, ensure_ascii=False, sort_keys=True)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def _doc_to_embedding_text(doc: Dict[str, Any]) -> str:
    return f"{doc['title']}\n关键词：{'、'.join(doc.get('keywords', []))}\n{doc['content']}"


def _cosine_similarity(left: List[float], right: List[float]) -> float:
    dot = sum(a * b for a, b in zip(left, right))
    left_norm = math.sqrt(sum(value * value for value in left))
    right_norm = math.sqrt(sum(value * value for value in right))
    if left_norm == 0 or right_norm == 0:
        return 0.0
    return dot / (left_norm * right_norm)


def _build_local_report(probability: float, top_features: Any, docs: List[Dict[str, Any]]) -> str:
    primary = docs[0] if docs else {"title": "通用流失干预", "content": "暂无匹配知识。"}
    references = "\n".join(f"- {doc['title']}" for doc in docs)
    return f"""
## RAG流失干预建议

### 一、匹配策略
当前用户预测流失概率为 **{probability:.2%}**，本地知识库优先匹配到 **{primary['title']}**。

关键特征摘要：{top_features}

### 二、推荐动作
1. **优先执行主策略**：参考「{primary['title']}」中的触达节奏、权益设计和ABtest口径，先做低成本、低打扰干预。
2. **组合验证辅助策略**：结合下方命中的知识库条目，选择一个内容触达变量和一个权益激励变量做对照测试。

### 三、命中的知识库
{references}

> 当前未检测到 `DEEPSEEK_API_KEY` 或模型调用失败，因此返回本地RAG检索摘要。配置环境变量后会自动调用 DeepSeek 生成完整报告。
""".strip()

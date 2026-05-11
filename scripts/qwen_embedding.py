import os
from pathlib import Path
from http import HTTPStatus

import dashscope


def load_local_env() -> None:
    env_path = Path(__file__).resolve().parents[1] / ".env.local"
    if not env_path.exists():
        return

    for line in env_path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key, value.strip().strip("\"'"))


def get_text_embedding(text: str, api_key: str | None = None) -> list[float]:
    """Return one text embedding vector from Alibaba Cloud DashScope."""
    load_local_env()
    key = api_key or os.getenv("DASHSCOPE_API_KEY")
    if not key:
        raise RuntimeError("请先设置 DASHSCOPE_API_KEY，或把 api_key 传给函数。")

    dashscope.api_key = key

    response = dashscope.TextEmbedding.call(
        model="text-embedding-v4",
        input=text,
        dimension=1024,
        output_type="dense",
    )

    if response.status_code != HTTPStatus.OK:
        raise RuntimeError(f"Embedding API 调用失败：{response}")

    return response.output["embeddings"][0]["embedding"]


if __name__ == "__main__":
    sample_text = "RiotBus 是一个欧美女歌手数据 PK 和 AI 报告网站。"
    embedding = get_text_embedding(sample_text)
    print(f"向量维度：{len(embedding)}")
    print(embedding[:8])

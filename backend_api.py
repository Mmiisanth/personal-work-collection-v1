from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import pandas as pd
import numpy as np
import tensorflow as tf

from rag_service import build_retrieval_query, generate_rag_report, retrieve_context

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ====================== 本地数据路径 ======================
PROJECT_ROOT = Path(__file__).resolve().parent
LOCAL_DATA_ROOT = PROJECT_ROOT / "data" / "cleaned_data_for_dnn"
LEGACY_DATA_ROOT = PROJECT_ROOT.parent / "cleaned_data_for_dnn"
DATA_ROOT = LOCAL_DATA_ROOT if LOCAL_DATA_ROOT.exists() else LEGACY_DATA_ROOT
MODEL_PATH = DATA_ROOT / "train" / "final_dnn_model.h5"
TRAIN_DATA_PATH = DATA_ROOT / "train" / "train_data.csv"
TEST_DATA_PATH = DATA_ROOT / "test" / "test_data.csv"

FEATURE_DROP_COLUMNS = ["msno", "is_churn"]


def encode_gender(value):
    if value == "male":
        return 1
    if value == "female":
        return 0
    if pd.isna(value) or value == "-1":
        return -1
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return -1


def prepare_features(df: pd.DataFrame) -> pd.DataFrame:
    features = df.drop(columns=FEATURE_DROP_COLUMNS, errors="ignore").copy()
    if "gender" in features.columns:
        features["gender"] = features["gender"].apply(encode_gender)
    return features.apply(pd.to_numeric, errors="coerce").fillna(0)

# ====================== 加载模型 & 数据 ======================
print("正在初始化模型与数据...")
dnn_model = tf.keras.models.load_model(MODEL_PATH, compile=False)
train_df = pd.read_csv(TRAIN_DATA_PATH)
test_df = pd.read_csv(TEST_DATA_PATH)

# 保持模型需要的 15 个数值特征：去掉用户标识与标签列，并统一编码。
X_train = prepare_features(train_df)
feature_baseline = X_train.median(numeric_only=True).astype(np.float32)

print("数据特征数量:", X_train.shape[1])

print("✅ 初始化完成（使用基线替换法计算模型归因）")


def calculate_feature_attributions(row: pd.DataFrame, base_probability: float) -> list[dict]:
    """Estimate each feature contribution by replacing it with the train-set median."""
    feature_values = row.iloc[0].astype(np.float32)
    attributions = []

    for col in row.columns:
        perturbed = feature_values.copy()
        perturbed[col] = feature_baseline[col]
        perturbed_prob = dnn_model.predict(
            perturbed.to_numpy().reshape(1, -1).astype(np.float32),
            verbose=0,
        )[0][0]
        contribution = base_probability - float(perturbed_prob)
        attributions.append({
            "name": col,
            "value": float(feature_values[col]),
            "shap": float(contribution),
        })

    return attributions

# ====================== 随机用户预测 ======================
@app.get("/api/random_user")
def get_random_user():
    try:
        user = test_df.sample(1)
        user_id = user["msno"].iloc[0] if "msno" in user.columns else user.index[0]

        X = prepare_features(user)
        prob = dnn_model.predict(X.values.astype(np.float32), verbose=0)[0][0]
        features = calculate_feature_attributions(X, float(prob))

        return {
            "userId": str(user_id),
            "probability": float(prob),
            "features": features,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ====================== AI 诊断 ======================
@app.post("/api/diagnosis")
def diagnose(data: dict):
    try:
        prob = float(data["probability"])
        features = data.get("features") or data.get("top_features") or []
        top_features = data.get("top_features") or features

        retrieval_query = build_retrieval_query(prob, features if isinstance(features, list) else [], top_features)
        rag_result = retrieve_context(retrieval_query, top_k=3)
        report = generate_rag_report(
            probability=prob,
            features=features if isinstance(features, list) else [],
            top_features=top_features,
            retrieved_docs=rag_result["documents"],
        )

        return {
            "report": report,
            "rag": {
                "mode": rag_result["mode"],
                "documents": [
                    {"id": doc["id"], "title": doc["title"], "score": doc.get("score", 0)}
                    for doc in rag_result["documents"]
                ],
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)

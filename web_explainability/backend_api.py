from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import pandas as pd
import numpy as np
import tensorflow as tf
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

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
CLUSTER_SAMPLE_SIZE = 1500
CLUSTER_RANDOM_STATE = 42
CLUSTER_LABELS = {
    "new_high_risk": {
        "name": "新用户高风险",
        "summary": "注册时长偏短且流失概率高，优先匹配新用户7天流失预防与低门槛激活。",
        "color": "#FF003C",
        "strategy": "新手引导 + 首月优惠 + 高匹配推荐",
    },
    "new_growth": {
        "name": "新用户成长型",
        "summary": "注册时长偏短但风险较低，重点巩固早期使用习惯。",
        "color": "#00F3FF",
        "strategy": "连续打卡 + 偏好完善 + 内容探索",
    },
    "loyal_stable": {
        "name": "老用户稳定型",
        "summary": "注册时长较长且流失概率低，适合会员成长与情感维系。",
        "color": "#00FF9F",
        "strategy": "会员成长体系 + 个性化周期报告",
    },
    "loyal_warning": {
        "name": "老用户预警型",
        "summary": "注册时长较长但流失概率高，需要优先排查权益钝化、体验问题或续费风险。",
        "color": "#9D4EDD",
        "strategy": "权益提醒 + 体验补偿 + 老用户专属召回",
    },
}


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


def predict_probabilities(features: pd.DataFrame, batch_size: int = 8192) -> np.ndarray:
    return dnn_model.predict(features.values.astype(np.float32), batch_size=batch_size, verbose=0).reshape(-1)


def build_lifecycle_clusters():
    cluster_features = prepare_features(test_df)
    probabilities = predict_probabilities(cluster_features)
    reg_duration = cluster_features["reg_duration"].astype(float).to_numpy()
    clustering_frame = pd.DataFrame({
        "userId": test_df["msno"].astype(str) if "msno" in test_df.columns else test_df.index.astype(str),
        "regDuration": reg_duration,
        "probability": probabilities.astype(float),
    })

    scaler = StandardScaler()
    cluster_input = scaler.fit_transform(clustering_frame[["regDuration", "probability"]])
    kmeans = KMeans(n_clusters=4, random_state=CLUSTER_RANDOM_STATE, n_init=20)
    cluster_ids = kmeans.fit_predict(cluster_input)
    clustering_frame["clusterId"] = cluster_ids

    cluster_meta = {}
    med_reg = clustering_frame["regDuration"].median()
    med_prob = clustering_frame["probability"].median()
    used_label_keys = set()

    centers = pd.DataFrame(
        scaler.inverse_transform(kmeans.cluster_centers_),
        columns=["regDuration", "probability"],
    )
    for cluster_id, center in centers.iterrows():
        is_new = center["regDuration"] <= med_reg
        is_high_risk = center["probability"] >= med_prob
        if is_new and is_high_risk:
            label_key = "new_high_risk"
        elif is_new:
            label_key = "new_growth"
        elif is_high_risk:
            label_key = "loyal_warning"
        else:
            label_key = "loyal_stable"

        if label_key in used_label_keys:
            label_key = _fallback_cluster_label(center["regDuration"], center["probability"], med_reg, med_prob, used_label_keys)
        used_label_keys.add(label_key)

        members = clustering_frame[clustering_frame["clusterId"] == cluster_id]
        cluster_meta[int(cluster_id)] = {
            "id": int(cluster_id),
            "labelKey": label_key,
            "name": CLUSTER_LABELS[label_key]["name"],
            "summary": CLUSTER_LABELS[label_key]["summary"],
            "strategy": CLUSTER_LABELS[label_key]["strategy"],
            "color": CLUSTER_LABELS[label_key]["color"],
            "center": {
                "regDuration": float(center["regDuration"]),
                "probability": float(center["probability"]),
            },
            "size": int(len(members)),
            "avgProbability": float(members["probability"].mean()),
            "avgRegDuration": float(members["regDuration"].mean()),
        }

    display_points = clustering_frame.sample(
        n=min(CLUSTER_SAMPLE_SIZE, len(clustering_frame)),
        random_state=CLUSTER_RANDOM_STATE,
    )
    points = [
        {
            "userId": row.userId,
            "regDuration": float(row.regDuration),
            "probability": float(row.probability),
            "clusterId": int(row.clusterId),
        }
        for row in display_points.itertuples(index=False)
    ]

    return {
        "points": points,
        "clusters": [cluster_meta[key] for key in sorted(cluster_meta.keys())],
        "medians": {
            "regDuration": float(med_reg),
            "probability": float(med_prob),
        },
    }


def _fallback_cluster_label(reg_duration, probability, med_reg, med_prob, used_label_keys):
    candidates = [
        ("new_high_risk", reg_duration <= med_reg and probability >= med_prob),
        ("new_growth", reg_duration <= med_reg),
        ("loyal_warning", probability >= med_prob),
        ("loyal_stable", True),
    ]
    for label_key, condition in candidates:
        if condition and label_key not in used_label_keys:
            return label_key
    return next(key for key in CLUSTER_LABELS if key not in used_label_keys)


lifecycle_cluster_data = build_lifecycle_clusters()

print("✅ 初始化完成（使用基线替换法计算模型归因，并已构建生命周期聚类）")


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


@app.post("/api/clusters")
def get_clusters(data: dict):
    try:
        prob = float(data["probability"])
        features = data.get("features") or []
        feature_map = {item.get("name"): item.get("value") for item in features if item.get("name")}
        reg_duration = float(feature_map.get("reg_duration", 0))

        nearest_cluster = min(
            lifecycle_cluster_data["clusters"],
            key=lambda cluster: (
                ((reg_duration - cluster["center"]["regDuration"]) ** 2)
                + ((prob - cluster["center"]["probability"]) ** 2)
            ),
        )

        return {
            **lifecycle_cluster_data,
            "currentUser": {
                "userId": str(data.get("userId", "")),
                "regDuration": reg_duration,
                "probability": prob,
                "clusterId": nearest_cluster["id"],
                "clusterName": nearest_cluster["name"],
                "clusterSummary": nearest_cluster["summary"],
                "strategy": nearest_cluster["strategy"],
                "color": nearest_cluster["color"],
            },
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

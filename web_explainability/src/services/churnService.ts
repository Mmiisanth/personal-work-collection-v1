const API_BASE = "http://127.0.0.1:8000/api";

// 严格按照你提供的字段定义表进行映射
const FEATURE_TRANSLATION: Record<string, string> = {
  "msno": "用户唯一标识",
  "is_churn": "是否流失",
  "city": "所在城市",
  "bd": "用户年龄",
  "gender": "用户性别",
  "reg_duration": "注册时长(天)",
  "payment_method_id": "支付方式ID",
  "is_auto_renew": "是否自动续费",
  "is_cancel": "是否曾经取消过订阅",
  "avg_secs": "日均播放时长",
  "std_secs": "播放时长标准差",
  "sum_secs": "总播放时长",
  "avg_num100": "日均完播次数",
  "avg_unq": "日均去重播放数",
  "completion_rate": "完播率",
  "progress_depth": "加权观看深度",
  "daily_engagement": "单次播放均长"
};

export interface ChurnData {
  userId: string;
  probability: number;
  features: {
    name: string;
    displayName: string;
    value: number;
    translatedValue: string;
    shap: number;
  }[];
}

export async function generateDiagnosis(data: ChurnData) {
  const topFeatures = [...data.features]
    .sort((a, b) => Math.abs(b.shap) - Math.abs(a.shap))
    .slice(0, 3)
    .map(f => `${f.displayName}(值:${f.value.toFixed(2)}，含义:${f.translatedValue}，SHAP/归因:${f.shap.toFixed(6)})`)
    .join(", ");

  try {
    const response = await fetch(`${API_BASE}/diagnosis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        probability: data.probability,
        top_features: topFeatures,
        features: data.features.map((f) => ({
          name: f.name,
          displayName: f.displayName,
          value: f.value,
          translatedValue: f.translatedValue,
          shap: f.shap,
        })),
      })
    });
    const result = await response.json();
    return result.report;
  } catch (error) {
    console.error("诊断接口错误：", error);
    return "⚠️ 无法连接到本地 Python RAG 后端。";
  }
}

export async function fetchUserData(): Promise<ChurnData> {
  try {
    const response = await fetch(`${API_BASE}/random_user`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      mode: "cors",
    });

    if (!response.ok) {
      throw new Error(`HTTP错误！状态码：${response.status}`);
    }

    const rawData = await response.json();

    return {
      userId: rawData.userId,
      probability: rawData.probability,
      features: rawData.features.map((f: any) => ({
        ...f,
        displayName: FEATURE_TRANSLATION[f.name] || f.name,
        translatedValue: translateFeature(f.name, f.value)
      }))
    };
  } catch (error) {
    console.error("获取用户数据失败：", error);
    throw new Error("无法连接到后端服务");
  }
}

function translateFeature(name: string, value: number): string {
  // 1. 分类变量处理
  if (name === "is_auto_renew") return value === 1 ? "已开启" : "未开启";
  if (name === "is_cancel") return value === 1 ? "已取消" : "正常订阅";
  if (name === "gender") return value === 1 ? "男性" : value === 0 ? "女性" : "未公开性别或其他原因";
  if (name === "city") return `城市:${Math.floor(value)}`;
  if (name === "payment_method_id") return `渠道:${Math.floor(value)}`;
  if (name === "bd") return `${Math.floor(value)} 岁`;

  // 2. 连续型/派生变量处理 (如果是标准化后的数值)
  const continuousFeatures = [
    "avg_secs", "std_secs", "sum_secs", "avg_num100",
    "avg_unq", "completion_rate", "progress_depth",
    "daily_engagement", "reg_duration"
  ];

  if (continuousFeatures.includes(name)) {
    if (Math.abs(value) > 10) return value.toFixed(1);
    if (value < -0.8) return "显著偏低";
    if (value > 0.8) return "显著偏高";
    return "平均水平";
  }

  return String(value.toFixed(2));
}

import pandas as pd
import numpy as np
import shap
from tensorflow.keras.models import load_model
from openai import OpenAI
import traceback
import random
import time
import os

# 配置模型与数据路径
MODEL_PATH = "C:/Users/Administrator/Desktop/project/cleaned_data_for_dnn/train/final_dnn_model.h5"
TRAIN_DATA_PATH = "C:/Users/Administrator/Desktop/project/cleaned_data_for_dnn/train/train_data.csv"
TEST_DATA_PATH = "C:/Users/Administrator/Desktop/project/cleaned_data_for_dnn/test/test_data.csv"
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")

print("正在加载深度神经网络模型与完整数据集...")
dnn_model = load_model(MODEL_PATH)

# 重新编译模型以解决 metrics 未构建的问题
dnn_model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])

train_df = pd.read_csv(TRAIN_DATA_PATH)
test_df = pd.read_csv(TEST_DATA_PATH)

# 剔除不参与预测的标识符与标签列
drop_cols = ['msno', 'is_churn']
X_train_raw = train_df.drop(columns=drop_cols).copy()
X_test_raw = test_df.drop(columns=drop_cols).copy()

print(f"原始训练集形状：{X_train_raw.shape}")
print(f"原始测试集形状：{X_test_raw.shape}")
print(f"\n原始数据类型:")
print(X_train_raw.dtypes)

# 处理 gender 列：将字符串映射为数值
def encode_gender(gender_val):
    if gender_val == 'male':
        return 1
    elif gender_val == 'female':
        return 0
    elif gender_val == '-1' or pd.isna(gender_val):
        return -1
    else:
        try:
            return int(float(gender_val))
        except:
            return -1

if X_train_raw['gender'].dtype == 'object':
    print("\n检测到 gender 列为字符串类型，正在进行数值编码...")
    X_train_raw['gender'] = X_train_raw['gender'].apply(encode_gender)
    X_test_raw['gender'] = X_test_raw['gender'].apply(encode_gender)
    print("gender 编码完成！")
    print(f"gender 唯一值：{X_train_raw['gender'].unique()}")

remaining_object_cols = [col for col in X_train_raw.columns if X_train_raw[col].dtype == 'object']
if remaining_object_cols:
    print(f"\n警告：仍有非数值列：{remaining_object_cols}")
    X_train_encoded = pd.get_dummies(X_train_raw, columns=remaining_object_cols, drop_first=False)
    X_test_encoded = pd.get_dummies(X_test_raw, columns=remaining_object_cols, drop_first=False)
    X_train_final, X_test_final = X_train_encoded.align(X_test_encoded, join='left', axis=1, fill_value=0)
else:
    print("\n所有列都是数值类型，无需独热编码")
    X_train_final = X_train_raw
    X_test_final = X_test_raw

print(f"\nNaN 值检查:")
train_nan_count = X_train_final.isna().sum()
test_nan_count = X_test_final.isna().sum()

if train_nan_count.sum() > 0:
    print("训练集 NaN 统计:")
    print(train_nan_count[train_nan_count > 0])
    for col in X_train_final.columns:
        if X_train_final[col].isna().any():
            median_val = X_train_final[col].median()
            X_train_final[col].fillna(median_val, inplace=True)
            X_test_final[col].fillna(median_val, inplace=True)
            print(f"已用中位数 {median_val:.4f} 填充列 {col}")

print(f"\n处理后训练集形状：{X_train_final.shape}")
print(f"处理后测试集形状：{X_test_final.shape}")

X_train = X_train_final.values.astype(np.float32)
X_test = X_test_final.values.astype(np.float32)
feature_names = X_train_final.columns.tolist()

TARGET_INDEX = random.randint(0, len(X_test) - 1)
print(f"\n随机选择的用户索引：{TARGET_INDEX}")

target_user_features = X_test[TARGET_INDEX].reshape(1, -1)
target_user_id = test_df.iloc[TARGET_INDEX]['msno']

print(f"目标用户 ID: {target_user_id}")
print(f"输入特征维度：{target_user_features.shape}")
print(f"特征值:\n{target_user_features}")

churn_prob = dnn_model.predict(target_user_features, verbose=0)
prob_value = float(churn_prob[0][0]) if len(churn_prob.shape) > 1 else float(churn_prob[0])
print(f"\n用户 {target_user_id} 的预测流失概率为：{prob_value * 100:.2f}%")

print("\n正在基于全局训练集执行沙普利归因分析...")
background_data = X_train[np.random.choice(X_train.shape[0], min(100, X_train.shape[0]), replace=False)]
print(f"背景数据形状：{background_data.shape}")

def model_predict(X):
    predictions = dnn_model.predict(X, verbose=0)
    return predictions.flatten()

print("正在计算 SHAP 值（使用 Kernel SHAP 方法）...")
explainer = shap.KernelExplainer(model_predict, background_data)
shap_values = explainer.shap_values(target_user_features, nsamples=100)

if isinstance(shap_values, list):
    shap_vals_array = np.array(shap_values[0]).flatten()
else:
    shap_vals_array = np.array(shap_values).flatten()

target_user_flat = target_user_features.flatten()

print(f"\n特征数量：{len(feature_names)}")
print(f"SHAP 值数组形状：{shap_vals_array.shape}")

feature_contributions = list(zip(feature_names, target_user_flat, shap_vals_array))
feature_contributions.sort(key=lambda x: abs(x[2]), reverse=True)
top_features = feature_contributions[:3]

print("\n" + "=" * 60)
print("SHAP 归因分析结果（按影响程度排序）:")
print("=" * 60)
for i, (name, value, contribution) in enumerate(top_features, 1):
    impact = "正向促进流失" if contribution > 0 else "负向抑制流失"
    print(f"{i}. 特征：{name}")
    print(f"   当前值：{value:.4f}")
    print(f"   SHAP 值：{contribution:.6f} ({impact})")
    print()

prompt_text = f"""
【角色设定 Role】
你是一名资深音乐流媒体平台的用户增长与留存专家，擅长通过数据分析诊断用户流失风险并制定精准的挽留策略。

【任务背景 Task Background】
我们是一家音乐流媒体平台（类似 Spotify、QQ 音乐、网易云音乐），平台核心指标包括：
- 用户听歌时长（秒）
- 内容消费深度（是否完整听完歌曲）
- 日常活跃度（日均听歌频率）
- 订阅状态（自动续费、取消订阅等）

当前有一名高风险用户需要紧急干预，请基于以下数据生成一份业务人员可直接执行的诊断报告。

【核心数据 Data Context】
用户预测流失概率：{prob_value * 100:.2f}%

SHAP 归因分析显示推高流失风险的三大核心特征：
1. 特征名：{top_features[0][0]}，当前值：{top_features[0][1]:.4f}，对流失的贡献度：{top_features[0][2]:.6f}
2. 特征名：{top_features[1][0]}，当前值：{top_features[1][1]:.4f}，对流失的贡献度：{top_features[1][2]:.6f}
3. 特征名：{top_features[2][0]}，当前值：{top_features[2][1]:.4f}，对流失的贡献度：{top_features[2][2]:.6f}

数据说明：
- 数值型特征均已标准化：负值表示低于平台平均水平，绝对值越大偏离越严重
- 分类特征为整数编码（如 is_auto_renew: 1=开启，0=未开启，-1=未知）

【输出要求 Format Requirements】
请用以下结构输出报告，语言通俗易懂，避免技术术语，用数据支撑观点：

## 🎯 高风险用户流失预警报告

### 一、风险诊断（用一句话概括核心问题）
用一句通俗的话总结：这位用户为何可能离开？（例如："这是一个刚注册不久、开启了自动续费但几乎不听歌的用户"）

然后分点阐述三个核心特征的业务含义：
- **特征 1 名称**（当前值：X.XX）：解释这个值在音乐平台意味着什么（例如："注册时长远低于平均，说明是新用户，正处于试用评估期"）
- **特征 2 名称**（当前值：X.XX）：结合音乐场景解释（例如："开启了自动续费，但这可能是被动续费，真实满意度被掩盖"）
- **特征 3 名称**（当前值：X.XX）：说明严重性（例如："内容消费深度极低，说明听了开头就跳过或根本没找到喜欢的歌"）

最后给出综合判断：这三个特征如何相互作用，共同推高了流失风险？

### 二、反事实推演（哪个因素最容易改变？）
基于 SHAP 贡献度分析：
- 指出哪个特征的改善最能逆转流失概率（优先选择可干预的特征）
- 量化说明：如果将该特征从当前值提升到平台平均水平，预计能降低多少流失风险
- 对比说明：为什么其他特征难以改变或干预成本高

### 三、精准挽留策略（两条可立即执行的低成本方案）
每条策略必须包含：

**策略名称**（例如："新歌推荐破冰计划"）

🎯 **具体操作**：
- 第一步：...
- 第二步：...
- 第三步：...

📊 **数据支撑**：引用当前用户的某个具体特征值说明为何采取此策略

💡 **业务逻辑**：解释这个策略为何有效，预期能改善哪个核心指标

⏱️ **执行时机**：说明何时触发（例如："立即触发"、"7 天后"、"下次打开 App 时"）

📈 **成功标准**：如何衡量策略是否生效（例如："完播率提升 20%"、"日均听歌时长增加到 X 分钟"）

【注意事项】
- 所有举例必须围绕音乐场景（如：推荐歌曲、歌手、歌单、专辑，而非电影电视剧）
- 避免泛泛而谈，要针对当前用户的具体数据特征
- 策略要低成本、可自动化执行、符合音乐平台运营实际
"""

print("\n正在请求 DeepSeek 大语言模型生成诊断报告...")
client = OpenAI(api_key=DEEPSEEK_API_KEY, base_url="https://api.deepseek.com")

max_retries = 3
retry_count = 0
success = False

while retry_count < max_retries and not success:
    try:
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": "你是一个严谨的商业分析师与客户运营专家。"},
                {"role": "user", "content": prompt_text}
            ],
            timeout=120
        )
        success = True
        print("\n" + "=" * 60)
        print("========== 最终客户诊断与干预报告 ==========")
        print("=" * 60)
        print(response.choices[0].message.content)
        print("=" * 60)
    except Exception as e:
        retry_count += 1
        if retry_count < max_retries:
            print(f"\n⚠️  API 请求失败（第{retry_count}次），正在重试...（剩余{max_retries - retry_count}次）")
            print(f"错误信息：{str(e)}")
            time.sleep(2)
        else:
            print("\n" + "=" * 60)
            print("========== API 调用最终失败 ==========")
            print("=" * 60)
            print(f"已尝试{max_retries}次，仍然无法连接到 DeepSeek API。")
            print("\n可能的原因：")
            print("1. 网络连接不稳定")
            print("2. DeepSeek 服务器暂时不可用")
            print("3. API Key 可能无效或已过期")
            print("\n建议解决方案：")
            print("1. 检查网络连接")
            print("2. 稍后再试")
            print("3. 在 DeepSeek 官网验证 API Key 状态")
            print("\n底层错误详情:")
            print(traceback.format_exc())

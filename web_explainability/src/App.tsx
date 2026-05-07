import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Dices, Activity, User, BrainCircuit, Loader2 } from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ReferenceLine,
  ScatterChart, Scatter, ZAxis,
  Cell as ReCell
} from 'recharts';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { fetchClusterData, fetchUserData, generateDiagnosis, type ChurnData, type ClusterData } from './services/churnService';

/**
 * Tailwind 类名合并工具
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  // --- 状态管理 ---
  const [userId, setUserId] = useState('加载中...');
  const [data, setData] = useState<ChurnData | null>(null);
  const [report, setReport] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [displayedReport, setDisplayedReport] = useState('');
  const [clusterData, setClusterData] = useState<ClusterData | null>(null);

  /**
   * 核心逻辑：随机抽取用户并进行 AI 诊断
   */
  const handleRandomDraw = async () => {
    setIsAnalyzing(true);
    setReport('');
    setDisplayedReport('');

    try {
      // 1. 从 Python 后端获取真实模型预测数据
      const churnData = await fetchUserData();
      setUserId(churnData.userId);
      setData(churnData);
      const clusters = await fetchClusterData(churnData);
      setClusterData(clusters);

      // 2. 调用 DeepSeek 生成诊断报告
      const diagnosis = await generateDiagnosis(churnData);
      setReport(diagnosis || '');
    } catch (err) {
      console.error("Fetch error:", err);
      setReport("❌ **无法连接到本地 Python RAG 后端。**\n\n请确保：\n1. 已运行 `npm run backend`。\n2. 8000 端口未被占用。\n3. 你的模型、CSV 文件路径与 `DASHSCOPE_API_KEY` 配置正确。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * 打字机特效：让报告逐字显示，增加科技感
   */
  useEffect(() => {
    if (report && !isAnalyzing) {
      let i = 0;
      const interval = setInterval(() => {
        setDisplayedReport(report.slice(0, i));
        i += 5; // 每次增加5个字符，平衡速度与观感
        if (i > report.length) clearInterval(interval);
      }, 20);
      return () => clearInterval(interval);
    }
  }, [report, isAnalyzing]);

  /**
   * 初始化：页面加载时自动抽取一名用户
   */
  useEffect(() => {
    handleRandomDraw();
  }, []);

  // 计算流失风险等级
  const probability = data?.probability || 0;
  const isHighRisk = probability > 0.5;

  /**
   * 关键修复：预先处理好要显示的特征数据，确保图表和颜色逻辑一致
   */
  const sortedFeatures = data?.features
    ? [...data.features]
        .sort((a, b) => Math.abs(b.shap) - Math.abs(a.shap)) // 按贡献绝对值排序
        .slice(0, 8) // 取前8个
    : [];
  const attributionMax = Math.max(
    0.01,
    ...sortedFeatures.map((feature) => Math.abs(feature.shap))
  );

  return (
    <div className="min-h-screen bg-cyber-black text-white p-6 font-sans selection:bg-neon-blue/30">
      {/* 顶部标题栏 */}
      <header className="max-w-7xl mx-auto mb-8 border-b border-white/10 pb-6">
        <div className="flex items-center gap-4 mb-2">
          <Activity className="text-neon-blue w-10 h-10" />
          <h1 className="text-4xl font-extrabold tracking-tighter uppercase italic">
            数字化订阅服务：<span className="text-white glow-text-blue">流失风险智能预警与归因诊断平台</span>
          </h1>
        </div>
        <p className="text-white/60 text-sm font-mono tracking-widest uppercase">
          Deep Learning Model: DNN-v4.2 // Explainable AI: SHAP-like Attribution // Backend: FastAPI
        </p>
      </header>

      {/* 搜索与操作区 */}
      <div className="max-w-7xl mx-auto mb-8 flex gap-4 items-center">
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <User className="text-neon-blue w-5 h-5 group-focus-within:scale-110 transition-transform" />
          </div>
          <input
            type="text"
            value={userId}
            readOnly
            className="w-full bg-cyber-gray border border-white/20 rounded-xl py-4 pl-12 pr-4 font-mono text-white focus:border-neon-blue outline-none transition-all"
            placeholder="正在从测试集中抽取用户..."
          />
        </div>
        <button
          onClick={handleRandomDraw}
          disabled={isAnalyzing}
          className="bg-neon-blue hover:bg-neon-blue/80 disabled:opacity-50 text-black font-black px-10 py-4 rounded-xl flex items-center gap-3 transition-all active:scale-95 glow-blue whitespace-nowrap"
        >
          {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Dices className="w-5 h-5" />}
          🎲 随机抽取测试集用户
        </button>
      </div>

      {/* 主视图区 */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[42%_58%] gap-8">

        {/* 左侧：数据可视化面板 */}
        <div className="space-y-8">

          {/* 1. 仪表盘：流失概率 (已放大圆环，解决文字重叠) */}
          <section className="bg-cyber-gray border border-white/10 rounded-2xl p-6 glow-blue/5">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-8 uppercase tracking-tight">
              <Activity className="w-6 h-6 text-neon-blue" /> 仪表盘: 流失概率环形图
            </h2>
            <div className="h-80 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { value: probability },
                      { value: 1 - probability }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={100}
                    outerRadius={125}
                    startAngle={210}
                    endAngle={-30}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill={isHighRisk ? '#FF003C' : '#00FF9F'} />
                    <Cell fill="rgba(255,255,255,0.05)" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-12">
                <span className={cn(
                  "text-7xl font-black tracking-tighter font-sans",
                  isHighRisk ? "text-neon-red glow-text-red" : "text-neon-green"
                )}>
                  {(probability * 100).toFixed(1)}%
                </span>
                <span className="text-white/60 text-xs font-black uppercase tracking-[0.3em] mt-4">
                  Churn Probability
                </span>
              </div>
            </div>
            <div className="mt-2 text-center">
              <span className={cn(
                "px-6 py-1.5 rounded-full text-xs font-black uppercase tracking-tighter",
                isHighRisk ? "bg-neon-red/20 text-neon-red border border-neon-red/40" : "bg-neon-green/20 text-neon-green border border-neon-green/40"
              )}>
                {isHighRisk ? "High Risk / 高风险预警" : "Low Risk / 状态稳定"}
              </span>
            </div>
          </section>

          {/* 2. 表格：核心特征档案 (已过滤无意义字段) */}
          <section className="bg-cyber-gray border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6 uppercase tracking-tight">
              <User className="w-6 h-6 text-neon-blue" /> 表格: 顾客核心特征档案
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {data?.features
                .filter(f => [
                  "是否自动续费",
                  "日均播放时长",
                  "单次播放均长",
                  "注册时长(天)",
                  "加权观看深度",
                  "完播率",
                  "是否曾经取消过订阅"
                ].includes(f.displayName))
                .map((f, i) => (
                <div key={i} className="bg-black/40 border border-white/10 p-5 rounded-xl hover:border-neon-blue/40 transition-colors group">
                  <p className="text-xs text-white/40 uppercase font-bold mb-2 group-hover:text-neon-blue/60 transition-colors">
                    {f.displayName}
                  </p>
                  <p className="text-xl font-black text-white tracking-tight">
                    {f.translatedValue}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* 3. 横向柱状图：SHAP近似归因分析 */}
          <section className="bg-cyber-gray border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6 uppercase tracking-tight">
              <BrainCircuit className="w-6 h-6 text-neon-blue" /> 横向柱状图: SHAP近似归因分析
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={sortedFeatures}
                  margin={{ left: 20, right: 40, top: 10, bottom: 10 }}
                >
                  <XAxis
                    type="number"
                    hide
                    domain={[-attributionMax, attributionMax]}
                    allowDataOverflow
                  />
                  <YAxis
                    dataKey="displayName"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#FFFFFF', fontSize: 13, fontWeight: 800 }}
                    width={110}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{
                      backgroundColor: '#121212',
                      border: '1px solid #333',
                      borderRadius: '8px',
                      padding: '12px'
                    }}
                    itemStyle={{ color: '#FFFFFF', fontSize: '14px', fontWeight: 'bold' }}
                    labelStyle={{ color: '#00F3FF', marginBottom: '4px', fontWeight: 'black' }}
                    formatter={(value: number) => [`${value.toFixed(6)} (${(value * 100).toFixed(2)}pp)`, 'SHAP/归因']}
                  />
                  <ReferenceLine x={0} stroke="rgba(255,255,255,0.22)" />
                  <Bar dataKey="shap" radius={[0, 4, 4, 0]} barSize={24} minPointSize={4}>
                    {sortedFeatures.map((entry, index) => (
                      <ReCell
                        key={`cell-${index}`}
                        fill={entry.shap > 0 ? '#FF003C' : '#00F3FF'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between mt-4 px-2">
              <span className="text-[10px] font-bold text-neon-blue uppercase tracking-tighter">← 负向贡献 (降低流失)</span>
              <span className="text-[10px] font-bold text-neon-red uppercase tracking-tighter">正向贡献 (增加流失) →</span>
            </div>
          </section>

          {/* 4. 生命周期聚类：注册时长 x 流失概率 */}
          <section className="bg-cyber-gray border border-white/10 rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4 mb-5">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 uppercase tracking-tight">
                <Search className="w-6 h-6 text-neon-blue" /> 生命周期聚类图
              </h2>
              {clusterData?.currentUser && (
                <span
                  className="px-3 py-1 rounded-full border text-xs font-black whitespace-nowrap"
                  style={{
                    color: clusterData.currentUser.color,
                    borderColor: `${clusterData.currentUser.color}88`,
                    backgroundColor: `${clusterData.currentUser.color}18`,
                  }}
                >
                  {clusterData.currentUser.clusterName}
                </span>
              )}
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ left: 8, right: 20, top: 8, bottom: 20 }}>
                  <XAxis
                    type="number"
                    dataKey="regDuration"
                    name="注册时长"
                    tick={{ fill: '#FFFFFF99', fontSize: 11, fontWeight: 700 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.18)' }}
                    tickLine={false}
                    label={{ value: '注册时长', position: 'insideBottom', offset: -12, fill: '#FFFFFF99', fontSize: 11, fontWeight: 800 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="probability"
                    name="流失概率"
                    domain={[0, 1]}
                    tickFormatter={(value) => `${Math.round(value * 100)}%`}
                    tick={{ fill: '#FFFFFF99', fontSize: 11, fontWeight: 700 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.18)' }}
                    tickLine={false}
                    width={42}
                  />
                  <ZAxis range={[22, 22]} />
                  <ReferenceLine y={0.5} stroke="rgba(255,255,255,0.16)" strokeDasharray="3 3" />
                  {clusterData && (
                    <ReferenceLine
                      x={clusterData.medians.regDuration}
                      stroke="rgba(255,255,255,0.16)"
                      strokeDasharray="3 3"
                    />
                  )}
                  <Tooltip
                    cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const point = payload[0].payload;
                      const cluster = clusterData?.clusters.find((item) => item.id === point.clusterId);
                      return (
                        <div className="bg-[#121212] border border-white/15 rounded-lg p-3 min-w-56 shadow-2xl">
                          <p className="font-black text-white mb-1">{point.isCurrent ? '当前用户' : cluster?.name}</p>
                          <p className="text-xs text-white/70">注册时长：{point.regDuration.toFixed(2)}</p>
                          <p className="text-xs text-white/70">流失概率：{(point.probability * 100).toFixed(1)}%</p>
                          {cluster && <p className="text-xs mt-2" style={{ color: cluster.color }}>{cluster.strategy}</p>}
                        </div>
                      );
                    }}
                  />
                  {clusterData?.clusters.map((cluster) => (
                    <Scatter
                      key={cluster.id}
                      name={cluster.name}
                      data={clusterData.points.filter((point) => point.clusterId === cluster.id)}
                      fill={cluster.color}
                      fillOpacity={0.48}
                      isAnimationActive={false}
                    />
                  ))}
                  {clusterData?.currentUser && (
                    <Scatter
                      name="当前用户"
                      data={[{ ...clusterData.currentUser, isCurrent: true }]}
                      fill="#FFFFFF"
                      stroke={clusterData.currentUser.color}
                      strokeWidth={3}
                      isAnimationActive={false}
                      shape="star"
                    />
                  )}
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {clusterData?.currentUser && (
              <div className="mt-5 grid grid-cols-1 gap-3">
                <div className="bg-black/35 border border-white/10 rounded-xl p-4">
                  <p className="text-xs text-white/40 font-bold uppercase mb-1">当前用户位置</p>
                  <p className="text-lg font-black" style={{ color: clusterData.currentUser.color }}>
                    {clusterData.currentUser.clusterName}
                  </p>
                  <p className="text-sm text-white/70 mt-2 leading-relaxed">
                    {clusterData.currentUser.clusterSummary}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/30 border border-white/10 rounded-xl p-4">
                    <p className="text-xs text-white/40 font-bold uppercase mb-1">注册时长</p>
                    <p className="text-xl font-black text-white">{clusterData.currentUser.regDuration.toFixed(2)}</p>
                  </div>
                  <div className="bg-black/30 border border-white/10 rounded-xl p-4">
                    <p className="text-xs text-white/40 font-bold uppercase mb-1">流失概率</p>
                    <p className="text-xl font-black text-white">{(clusterData.currentUser.probability * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* 右侧：AI 诊断报告面板 */}
        <div className="bg-cyber-gray border border-white/10 rounded-2xl p-10 relative min-h-[900px] glow-blue/5">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-neon-blue via-neon-purple to-transparent opacity-50" />

          <h2 className="text-3xl font-black text-white border-b border-white/10 pb-6 mb-8 flex items-center gap-4">
            <span className="bg-neon-purple/20 p-2 rounded-lg text-2xl">📝</span>
            智能诊断与反事实干预报告
          </h2>

          <div className="prose prose-invert max-w-none">
            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-48">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <BrainCircuit className="w-16 h-16 text-neon-purple mb-6" />
                </motion.div>
                <p className="text-neon-purple text-xl font-black animate-pulse tracking-tighter uppercase">
                  🧠 神经网络正在深度解析归因数据...
                </p>
                <p className="text-white/30 text-xs mt-4 font-mono">
                  Running DeepSeek-V3 Inference Engine
                </p>
              </div>
            ) : (
              <div className="text-white/95 leading-relaxed text-xl font-medium">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({node, ...props}) => <h1 className="text-2xl font-black text-neon-blue mt-8 mb-4 uppercase border-l-4 border-neon-blue pl-4" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-xl font-extrabold text-white mt-6 mb-3 flex items-center gap-2" {...props} />,
                    p: ({node, ...props}) => <p className="mb-4 text-white/90" {...props} />,
                    li: ({node, ...props}) => <li className="mb-2 list-disc list-inside text-white/80" {...props} />,
                    strong: ({node, ...props}) => <strong className="text-neon-green font-black" {...props} />,
                    table: ({node, ...props}) => <div className="overflow-x-auto my-6"><table className="w-full border-collapse text-sm" {...props} /></div>,
                    thead: ({node, ...props}) => <thead className="bg-white/10" {...props} />,
                    th: ({node, ...props}) => <th className="text-neon-blue font-black uppercase tracking-tighter p-3 text-left border border-white/10" {...props} />,
                    td: ({node, ...props}) => <td className="p-3 border border-white/10 text-white/80" {...props} />,
                    tr: ({node, ...props}) => <tr className="hover:bg-neon-blue/5 transition-colors" {...props} />,
                  }}
                >
                  {displayedReport}
                </ReactMarkdown>
                {/* 闪烁的光标效果 */}
                {!isAnalyzing && displayedReport.length < report.length && (
                  <span className="inline-block w-2 h-6 bg-neon-blue animate-pulse ml-1 align-middle" />
                )}
              </div>
            )}
          </div>

          {/* 底部装饰 */}
          <div className="absolute bottom-6 right-10 flex items-center gap-2 opacity-20 grayscale">
            <div className="text-right">
              <p className="text-[10px] font-bold">REPORT GENERATED BY</p>
              <p className="text-xs font-black">CHURNGUARD AI SYSTEM</p>
            </div>
            <Activity className="w-8 h-8" />
          </div>
        </div>
      </main>
    </div>
  );
}

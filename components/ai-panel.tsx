"use client";

import { useEffect, useMemo, useState } from "react";
import { Send, Sparkles, X } from "lucide-react";
import type { BattleMode, MetricKey } from "@/lib/types";
import { artists } from "@/data/artists";

type Message = {
  role: "ai" | "user";
  content: string;
};

const metricLabels: Record<MetricKey, string> = {
  sales: "销量",
  streaming: "流媒体",
  awards: "奖项",
  reviews: "乐评",
};

export function AiPanel({
  artistAId,
  artistBId,
  mode,
  metrics,
}: {
  artistAId: string;
  artistBId: string;
  mode: BattleMode;
  metrics: MetricKey[];
}) {
  const artistA = artists.find((artist) => artist.id === artistAId) ?? artists[0];
  const artistB = artists.find((artist) => artist.id === artistBId) ?? artists[1];
  const [input, setInput] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    let ignore = false;

    async function generateOpening() {
      setLoading(true);
      try {
        const response = await fetch("/api/ai/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode,
            artistA: artistA.name,
            artistB: artistB.name,
            metrics,
            dataSummary: metrics
              .map(
                (metric) =>
                  `${metricLabels[metric]}：${artistA.shortName} = ${
                    artistA.stats[metric] || "缺失"
                  }；${artistB.shortName} = ${
                    artistB.stats[metric] || "缺失"
                  }`,
              )
              .join("\n"),
          }),
        });
        const data = (await response.json()) as { message?: string };
        if (!ignore) {
          setMessages([
            {
              role: "ai",
              content: data.message || "AI 这次没憋出话，先看左边数据。",
            },
          ]);
        }
      } catch {
        if (!ignore) {
          setMessages([
            {
              role: "ai",
              content: "AI 暂时掉线了，先看左边数据，等下再上车。",
            },
          ]);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    generateOpening();

    return () => {
      ignore = true;
    };
  }, [artistA.name, artistB.name, metrics, mode]);

  function send() {
    if (!input.trim()) return;
    const userMessage = input.trim();
    setInput("");
    setMessages((current) => [
      ...current,
      { role: "user", content: userMessage },
      {
        role: "ai",
        content:
          mode === "mean"
            ? `收到，这个角度可以继续撕：${artistA.shortName} 和 ${artistB.shortName} 的对比里，先别急着喊赢，得看你要的是数据牌面还是口碑体面。`
            : `可以。基于当前数据，我会继续围绕 ${artistA.shortName} 与 ${artistB.shortName} 的已选维度补充说明。`,
      },
    ]);
  }

  return (
    <div className="glass-strong flex min-h-[620px] flex-col rounded-[28px] p-6">
      <div className="mb-5 flex items-center justify-between">
        <p className="display-font text-3xl">AI 智能体</p>
        <button
          className="display-font rounded-full bg-brat-green px-5 py-2"
          onClick={() => setExportOpen(true)}
          type="button"
        >
          总结生成报告
        </button>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto pr-2">
        {loading ? (
          <div className="rounded-[22px] bg-white/55 p-4 text-lg font-bold leading-relaxed">
            AI 正在发车，先别急。
          </div>
        ) : null}
        {messages.map((message, index) => (
          <div
            className={`rounded-[22px] p-4 text-lg font-bold leading-relaxed ${
              message.role === "ai"
                ? "bg-white/55"
                : "ml-auto max-w-[82%] bg-brat-green"
            }`}
            key={`${message.role}-${index}`}
          >
            {message.content}
          </div>
        ))}
      </div>
      <div className="mt-5 flex gap-3">
        <input
          className="min-w-0 flex-1 rounded-full border border-black/20 bg-white/60 px-5 py-4 font-bold outline-none focus:border-brat-hot"
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") send();
          }}
          placeholder="接着问，或者直接反驳..."
          value={input}
        />
        <button
          className="flex size-14 items-center justify-center rounded-full bg-black text-white"
          onClick={send}
          type="button"
        >
          <Send />
        </button>
      </div>
      {exportOpen ? (
        <ExportModal
          artistA={artistA.shortName}
          artistB={artistB.shortName}
          conversation={messages
            .map((message) => `${message.role}: ${message.content}`)
            .join("\n")}
          mode={mode}
          onClose={() => setExportOpen(false)}
        />
      ) : null}
    </div>
  );
}

function ExportModal({
  artistA,
  artistB,
  conversation,
  mode,
  onClose,
}: {
  artistA: string;
  artistB: string;
  conversation: string;
  mode: BattleMode;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState(`${artistA} vs ${artistB}`);
  const [content, setContent] = useState("正在把这场 PK 整理成能发出去的报告。");

  useEffect(() => {
    let ignore = false;

    async function generateExport() {
      try {
        const response = await fetch("/api/ai/export", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode, artistA, artistB, conversation }),
        });
        const data = (await response.json()) as {
          title?: string;
          content?: string;
        };
        if (!ignore) {
          setTitle(data.title || `${artistA} vs ${artistB}`);
          setContent(data.content || "AI 没写出正文，稍后再试。");
        }
      } catch {
        if (!ignore) {
          setContent("AI 总结暂时失败，稍后再试。");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    generateExport();

    return () => {
      ignore = true;
    };
  }, [artistA, artistB, conversation, mode]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/18 p-5 backdrop-blur-sm">
      <div className="glass-strong grid w-full max-w-5xl grid-cols-[1.4fr_0.7fr] gap-7 rounded-[34px] p-8 max-md:grid-cols-1">
        <section>
          <p className="display-font text-5xl">{title}</p>
          <p className="mt-6 rounded-[24px] bg-white/55 p-6 text-xl font-bold leading-relaxed">
            {loading ? "AI 正在总结这场乱斗。" : content}
          </p>
        </section>
        <section className="border-l border-black/30 pl-7 max-md:border-l-0 max-md:pl-0">
          <button
            className="ml-auto flex size-12 items-center justify-center rounded-full bg-black/10"
            onClick={onClose}
            type="button"
          >
            <X strokeWidth={4} />
          </button>
          <p className="display-font mt-6 text-3xl">换背景</p>
          <div className="mt-5 grid gap-4">
            {["#4351F4", "#FF3F9A", "#EAFF3D", "#505368"].map((color) => (
              <span
                className="mx-auto size-20 rounded-full border border-black/20"
                key={color}
                style={{ background: color }}
              />
            ))}
          </div>
          <button
            className="display-font mt-8 w-full rounded-[22px] bg-[#2f7c2d] px-5 py-4 text-3xl"
            type="button"
          >
            <Sparkles className="mr-2 inline" /> 生成 PDF
          </button>
        </section>
      </div>
    </div>
  );
}

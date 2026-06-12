"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { useGsapReveal } from "@/lib/use-gsap-reveal";
import type { AgentWorkflowResult } from "@/lib/agent-workflow";
import type { BattleMode, MetricKey } from "@/lib/types";

export function AgentWorkflowPanel({
  artistAId,
  artistBId,
  metrics,
  mode,
  onComplete,
}: {
  artistAId: string;
  artistBId: string;
  metrics: MetricKey[];
  mode: BattleMode;
  onComplete: (result: AgentWorkflowResult) => void;
}) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AgentWorkflowResult | null>(null);
  const [error, setError] = useState("");
  const panelRef = useRef<HTMLElement | null>(null);
  const queryInputRef = useRef<HTMLTextAreaElement | null>(null);
  const isMean = mode === "mean";
  const cardBg = isMean ? "bg-[#F1FFE5]/72" : "bg-[#FFF0FA]/78";
  const accentText = isMean ? "text-[#335900]" : "text-[#8A0055]";
  const queryDisplayText = query || "太后垂帘听政中:>";
  const queryInputWidth = Math.min(
    Math.max(queryDisplayText.length * 1.45 + 8, 24),
    999,
  );

  useEffect(() => {
    const input = queryInputRef.current;
    if (!input) return;
    input.style.height = "64px";
    input.style.height = `${Math.max(64, input.scrollHeight)}px`;
  }, [query, queryInputWidth]);

  useGsapReveal(panelRef, {
    selector: "[data-agent-reveal]",
    y: 14,
    scale: 0.99,
    stagger: 0.14,
    duration: 1.18,
    dependencies: [Boolean(result), loading],
  });

  async function runWorkflow() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/agents/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          artistAId,
          artistBId,
          metrics,
          mode,
        }),
      });
      if (!response.ok) throw new Error("数据查询暂时失败");
      const data = (await response.json()) as AgentWorkflowResult;
      setResult(data);
      onComplete(data);
    } catch (workflowError) {
      setError(
        workflowError instanceof Error
          ? workflowError.message
          : "数据查询暂时失败",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section ref={panelRef} className={`mt-5 rounded-[28px] border border-white/75 p-5 shadow-[0_18px_44px_rgba(0,0,0,0.10)] backdrop-blur-[12px] ${cardBg}`} data-agent-reveal>
      <div className="flex flex-wrap items-start justify-between gap-3" data-agent-reveal>
        <div>
          <p className="display-font text-3xl leading-none">想看更多相关数据吗？</p>
          <p className="mt-2 text-sm font-black leading-snug text-black/62">
            RC Grammy Sales, anything for you &lt;3
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3" data-agent-reveal>
        <textarea
          className="min-h-16 max-w-[calc(100%-5rem)] resize-none overflow-hidden rounded-[32px] border border-black/15 bg-white/82 px-7 py-5 text-base font-black leading-6 outline-none transition-[width,border-color] duration-200 focus:border-black"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="太后垂帘听政中:>"
          ref={queryInputRef}
          rows={1}
          style={{ width: `min(calc(100% - 5rem), ${queryInputWidth}ch)` }}
          value={query}
        />
        <button
          className="flex size-16 shrink-0 items-center justify-center rounded-full bg-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-black/35"
          disabled={loading}
          onClick={runWorkflow}
          title={loading ? "查询中" : "启动"}
          type="button"
        >
          <Send />
        </button>
      </div>

      {error ? (
        <p className="mt-3 rounded-2xl bg-white/70 p-3 text-sm font-black text-red-700" data-agent-reveal>
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="mt-4 space-y-3">
          <div className="rounded-[20px] border border-black/10 bg-white/62 p-4 text-xs font-black leading-relaxed text-black/70" data-agent-reveal>
            <p className="mb-2 text-black">来源：Robert Christgau</p>
            <p>{result.summary[0]?.rc.guide}</p>
          </div>

          <div className="grid gap-3">
            {result.summary.map((artist) => (
              <div className="rounded-[24px] border border-black/10 bg-white/58 p-4" data-agent-reveal key={artist.artistId}>
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <p className="display-font text-2xl">{artist.artistName}</p>
                  <span className={`text-xs font-black ${accentText}`}>
                    来源：Robert Christgau / Grammy / ChartMasters
                  </span>
                </div>

                {artist.rc.reviews.length ? (
                  <div className="mt-3 max-h-64 overflow-auto rounded-[18px] border border-black/10 bg-white/54">
                    <table className="w-full min-w-[680px] table-fixed border-separate border-spacing-0 text-left text-xs font-black">
                      <thead className="sticky top-0 z-10 bg-white text-black shadow-[0_1px_0_rgba(0,0,0,0.12)]">
                        <tr>
                          <th className="w-[24%] px-3 py-2 align-top">专辑</th>
                          <th className="w-[12%] px-3 py-2 align-top">年份</th>
                          <th className="w-[12%] px-3 py-2 align-top">RC评分</th>
                          <th className="w-[52%] px-3 py-2 align-top">评价</th>
                        </tr>
                      </thead>
                      <tbody className="text-black/70">
                        {artist.rc.reviews.map((review) => (
                          <tr className="border-t border-black/10" data-agent-reveal key={`${review.title}-${review.year}-${review.grade}`}>
                            <td className="border-t border-black/10 px-3 py-2 align-top leading-snug break-words">{review.title}</td>
                            <td className="border-t border-black/10 px-3 py-2 align-top">{review.year || "-"}</td>
                            <td className="border-t border-black/10 px-3 py-2 align-top">{review.grade}</td>
                            <td className="border-t border-black/10 px-3 py-2 align-top leading-relaxed text-black/72">{review.reviewSummaryZh}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {artist.grammy ? (
                    <div className="rounded-[18px] bg-white/56 p-3 text-xs font-black leading-relaxed text-black/70">
                      <p className="mb-1 text-black">来源：Grammy</p>
                      {artist.grammy.lines.map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                    </div>
                  ) : null}
                  {artist.sales ? (
                    <div className="rounded-[18px] bg-white/56 p-3 text-xs font-black leading-relaxed text-black/70">
                      <p className="mb-1 text-black">来源：ChartMasters</p>
                      <p>销量：{artist.sales.value}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

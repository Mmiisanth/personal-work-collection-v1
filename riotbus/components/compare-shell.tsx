"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { BattleMode, MetricKey } from "@/lib/types";
import { AiPanel } from "@/components/ai-panel";
import { AgentWorkflowPanel } from "@/components/agent-workflow-panel";
import { DataTable } from "@/components/data-table";
import { useGsapReveal } from "@/lib/use-gsap-reveal";
import type { AgentWorkflowResult } from "@/lib/agent-workflow";

const validMetrics: MetricKey[] = ["sales", "streaming", "awards", "reviews"];

export function CompareShell() {
  const pageRef = useRef<HTMLElement | null>(null);
  const params = useSearchParams();
  const mode = (params.get("mode") || "mean") as BattleMode;
  const paramArtistA = params.get("a") || "taylor-swift";
  const paramArtistB = params.get("b") || "lady-gaga";
  const paramMetrics = useMemo(
    () =>
      (params.get("metrics") || validMetrics.join(","))
        .split(",")
        .filter((item): item is MetricKey =>
          validMetrics.includes(item as MetricKey),
        ),
    [params],
  );
  const [artistA, setArtistA] = useState(paramArtistA);
  const [artistB, setArtistB] = useState(paramArtistB);
  const [metrics, setMetrics] = useState<MetricKey[]>(paramMetrics);
  const [agentResult, setAgentResult] = useState<AgentWorkflowResult | null>(null);
  const isMean = mode === "mean";

  useGsapReveal(pageRef, {
    y: 22,
    scale: 0.99,
    stagger: 0.2,
    duration: 1.45,
    delay: 0.04,
  });

  useEffect(() => {
    setArtistA(paramArtistA);
    setArtistB(paramArtistB);
    setMetrics(paramMetrics.length ? paramMetrics : validMetrics);
    setAgentResult(null);
  }, [paramArtistA, paramArtistB, paramMetrics]);

  function handleAgentComplete(result: AgentWorkflowResult) {
    const [nextArtistA, nextArtistB] = result.query.artistIds;
    if (nextArtistA && nextArtistB) {
      setArtistA(nextArtistA);
      setArtistB(nextArtistB);
    }
    if (result.query.metrics.length) {
      setMetrics(result.query.metrics);
    }
    setAgentResult(result);
  }

  return (
    <main
      ref={pageRef}
      className={`compare-page relative min-h-screen [overflow-x:clip] px-6 py-10 max-sm:px-4 ${
        isMean ? "compare-page--mean bg-[#7FFF00]" : "compare-page--neutral bg-[#FF4FD8]"
      }`}
    >
      <div className="relative z-10 mx-auto max-w-7xl">
        <div
          className={`display-font mb-10 inline-flex rounded-[24px] px-8 py-5 text-4xl ${
            isMean ? "bg-[#9DFF55]" : "bg-[#FF8AD7]"
          }`}
          data-riot-reveal
        >
          {mode === "mean" ? "刻薄到底" : "清清白白"}
        </div>
        <div className="grid grid-cols-[1fr_0.95fr] gap-9 max-xl:grid-cols-1">
          <div>
            <DataTable
              artistAId={artistA}
              artistBId={artistB}
              metrics={metrics}
              mode={mode}
            />
            <AgentWorkflowPanel
              artistAId={artistA}
              artistBId={artistB}
              metrics={metrics}
              mode={mode}
              onComplete={handleAgentComplete}
            />
          </div>
          <div>
            <AiPanel
              artistAId={artistA}
              artistBId={artistB}
              metrics={metrics}
              mode={mode}
              agentContext={agentResult?.evidenceText ?? ""}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

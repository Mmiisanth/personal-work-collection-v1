"use client";

import { useSearchParams } from "next/navigation";
import type { BattleMode, MetricKey } from "@/lib/types";
import { AiPanel } from "@/components/ai-panel";
import { DataTable } from "@/components/data-table";

const validMetrics: MetricKey[] = ["sales", "streaming", "awards", "reviews"];

export function CompareShell() {
  const params = useSearchParams();
  const mode = (params.get("mode") || "mean") as BattleMode;
  const artistA = params.get("a") || "taylor-swift";
  const artistB = params.get("b") || "lady-gaga";
  const metrics = (params.get("metrics") || validMetrics.join(","))
    .split(",")
    .filter((item): item is MetricKey =>
      validMetrics.includes(item as MetricKey),
    );
  const isMean = mode === "mean";

  return (
    <main
      className={`compare-page relative min-h-screen overflow-hidden px-6 py-10 max-sm:px-4 ${
        isMean ? "compare-page--mean bg-[#7FFF00]" : "compare-page--neutral bg-[#FF4FD8]"
      }`}
    >
      <div className="relative z-10 mx-auto max-w-7xl">
        <div
          className={`display-font mb-10 inline-flex rounded-[24px] px-8 py-5 text-4xl ${
            isMean ? "bg-[#9DFF55]" : "bg-[#FF8AD7]"
          }`}
        >
          {mode === "mean" ? "刻薄到底" : "清清白白"}
        </div>
        <div className="grid grid-cols-[1fr_0.95fr] gap-9 max-xl:grid-cols-1">
          <DataTable
            artistAId={artistA}
            artistBId={artistB}
            metrics={metrics}
            mode={mode}
          />
          <AiPanel
            artistAId={artistA}
            artistBId={artistB}
            metrics={metrics}
            mode={mode}
          />
        </div>
      </div>
    </main>
  );
}

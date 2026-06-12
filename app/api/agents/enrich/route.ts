import { NextResponse } from "next/server";
import { buildAgentWorkflow } from "@/lib/agent-workflow";
import type { BattleMode, MetricKey } from "@/lib/types";

const fallbackMetrics: MetricKey[] = ["sales", "streaming", "awards", "reviews"];

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | {
        query?: string;
        artistAId?: string;
        artistBId?: string;
        metrics?: MetricKey[];
        mode?: BattleMode;
      }
    | null;

  const result = await buildAgentWorkflow({
    query: body?.query ?? "",
    artistAId: body?.artistAId ?? "taylor-swift",
    artistBId: body?.artistBId ?? "lady-gaga",
    metrics: body?.metrics?.length ? body.metrics : fallbackMetrics,
    mode: body?.mode ?? "mean",
  });

  return NextResponse.json(result);
}

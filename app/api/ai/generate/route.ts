import { NextResponse } from "next/server";
import { callOpenAICompatible } from "@/lib/ai";
import { buildReportPrompt } from "@/lib/prompts";
import type { BattleMode, MetricKey } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | {
        mode?: BattleMode;
        artistA?: string;
        artistB?: string;
        metrics?: MetricKey[];
        provider?: {
          baseUrl?: string;
          apiKey?: string;
          model?: string;
        };
        dataSummary?: string;
      }
    | null;
  const mode = body?.mode ?? "mean";
  const artistA = body?.artistA ?? "artist A";
  const artistB = body?.artistB ?? "artist B";
  const metrics: MetricKey[] = body?.metrics?.length
    ? body.metrics
    : ["sales", "streaming"];

  try {
    const message = await callOpenAICompatible({
      baseUrl: body?.provider?.baseUrl,
      apiKey: body?.provider?.apiKey,
      model: body?.provider?.model,
      messages: buildReportPrompt({
        mode,
        artistA,
        artistB,
        metrics,
        dataSummary: body?.dataSummary ?? "暂无结构化数据。",
      }),
      temperature: mode === "mean" ? 0.9 : 0.5,
    });

    return NextResponse.json({ message });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "AI 生成失败，稍后再试。",
      },
      { status: 500 },
    );
  }
}

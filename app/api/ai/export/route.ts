import { NextResponse } from "next/server";
import { callOpenAICompatible } from "@/lib/ai";
import { buildExportPrompt } from "@/lib/prompts";
import type { BattleMode } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | {
        mode?: BattleMode;
        artistA?: string;
        artistB?: string;
        conversation?: string;
      }
    | null;
  const mode = body?.mode ?? "mean";
  const artistA = body?.artistA ?? "artist A";
  const artistB = body?.artistB ?? "artist B";
  const conversation = body?.conversation ?? "暂无对话内容。";

  try {
    const output = await callOpenAICompatible({
      messages: buildExportPrompt({ mode, artistA, artistB, conversation }),
      temperature: mode === "mean" ? 0.9 : 0.5,
    });

    const [rawTitle, ...rest] = output.split("\n");
    return NextResponse.json({
      title: rawTitle.replace(/^标题[:：]\s*/, "").trim() || `${artistA} vs ${artistB}`,
      content: rest.join("\n").replace(/^正文[:：]\s*/, "").trim() || output,
    });
  } catch (error) {
    return NextResponse.json(
      {
        title: `${artistA} vs ${artistB}`,
        content:
          error instanceof Error
            ? error.message
            : "AI 总结失败，稍后再试。",
      },
      { status: 500 },
    );
  }
}

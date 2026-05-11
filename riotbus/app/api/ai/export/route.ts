import { NextResponse } from "next/server";
import { callOpenAICompatible } from "@/lib/ai";
import { buildExportPrompt } from "@/lib/prompts";
import { buildRagContext, buildTitleContext } from "@/lib/rag";
import type { AiProvider, BattleMode } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | {
        mode?: BattleMode;
        artistA?: string;
        artistB?: string;
        conversation?: string;
        provider?: AiProvider;
      }
    | null;
  const mode = body?.mode ?? "mean";
  const artistA = body?.artistA ?? "artist A";
  const artistB = body?.artistB ?? "artist B";
  const conversation = body?.conversation ?? "暂无对话内容。";

  try {
    const output = await callOpenAICompatible({
      baseUrl: body?.provider?.baseUrl,
      apiKey: body?.provider?.apiKey,
      model: body?.provider?.model,
      messages: buildExportPrompt({
        mode,
        artistA,
        artistB,
        conversation,
        ragContext: buildRagContext({ artistA, artistB, mode }),
        titleContext: buildTitleContext(mode),
      }),
      temperature: mode === "mean" ? 0.9 : 0.5,
    });

    const normalizedOutput = output.trim();
    const explicitTitle = normalizedOutput.match(/标题[:：]\s*([^\n]+)/u)?.[1];
    const explicitContent = normalizedOutput.match(/正文内容?[:：]\s*([\s\S]+)/u)?.[1];
    const [rawTitle, ...rest] = normalizedOutput.split("\n");
    return NextResponse.json({
      title:
        (explicitTitle ?? rawTitle)
          .replace(/^标题[:：]\s*/, "")
          .replace(/<shade>([\s\S]+?)<\/shade>/g, "$1")
          .trim() || `${artistA} vs ${artistB}`,
      content:
        (explicitContent ?? rest.join("\n"))
          .replace(/^\s*(正文|正文内容)[:：]\s*/u, "")
          .replace(/^\s*标题[:：].*\n?/u, "")
          .replace(/(^|\n)\s*(总判词|判词|数据|本地库补刀|最终补刀|补刀|总结)[:：]\s*/gu, "$1")
          .trim() || output.replace(/^\s*(正文|正文内容)[:：]\s*/u, ""),
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

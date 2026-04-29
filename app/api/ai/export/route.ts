import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { mode?: "mean" | "neutral"; artistA?: string; artistB?: string }
    | null;
  const mode = body?.mode ?? "mean";
  const artistA = body?.artistA ?? "artist A";
  const artistB = body?.artistB ?? "artist B";

  return NextResponse.json({
    title:
      mode === "mean"
        ? `${artistA} vs ${artistB}：这车开得有点颠`
        : `${artistA} 与 ${artistB} 数据对比摘要`,
    content:
      "这里会汇总当前 PK 数据、AI 首轮报告和后续追问内容，生成适合分享的报告正文。",
  });
}

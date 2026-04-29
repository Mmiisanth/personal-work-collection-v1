import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { mode?: "mean" | "neutral"; artistA?: string; artistB?: string }
    | null;
  const mode = body?.mode ?? "mean";
  const artistA = body?.artistA ?? "artist A";
  const artistB = body?.artistB ?? "artist B";

  const message =
    mode === "mean"
      ? `${artistA} vs ${artistB}，这局先别急着喊赢，数据上桌以后谁裸泳会比较明显。`
      : `${artistA} 与 ${artistB} 的对比需要结合销量、流媒体、奖项和乐评共同判断。`;

  return NextResponse.json({ message });
}

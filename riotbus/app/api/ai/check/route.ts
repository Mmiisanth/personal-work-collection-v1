import { NextResponse } from "next/server";
import { callOpenAICompatible } from "@/lib/ai";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { baseUrl?: string; apiKey?: string; model?: string }
    | null;

  if (!body?.baseUrl || !body?.apiKey || !body?.model) {
    return NextResponse.json(
      { ok: false, message: "base_url、api_key、model 都要填。" },
      { status: 400 },
    );
  }

  try {
    await callOpenAICompatible({
      baseUrl: body.baseUrl,
      apiKey: body.apiKey,
      model: body.model,
      temperature: 0,
      messages: [
        {
          role: "user",
          content: "Reply with exactly: ok",
        },
      ],
    });

    return NextResponse.json({
      ok: true,
      message: "API 可用，可以发车。",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "API 校验失败。",
      },
      { status: 400 },
    );
  }
}

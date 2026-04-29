import { NextResponse } from "next/server";

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

  return NextResponse.json({
    ok: true,
    message: "MVP mock check passed. Real provider check comes next.",
  });
}

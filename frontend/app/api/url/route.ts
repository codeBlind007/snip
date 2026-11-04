import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queryString = searchParams.toString();
    const endpoint = queryString ? `${BACKEND_URL}/url?${queryString}` : `${BACKEND_URL}/url`;

    const token = req.cookies.get("access_token")?.value;
    const headers: Record<string, string> = {};
    if (token) {
      headers["Cookie"] = `access_token=${token}`;
    }

    const backendRes = await fetch(endpoint, {
      method: "GET",
      headers,
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Failed to fetch URLs" },
      { status: 502 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const idempotencyKey =
      req.headers.get("idempotency-key") ||
      req.headers.get("Idempotency-Key") ||
      crypto.randomUUID();

    const token = req.cookies.get("access_token")?.value;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    };
    if (token) {
      headers["Cookie"] = `access_token=${token}`;
    }

    const backendRes = await fetch(`${BACKEND_URL}/url`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Failed to shorten URL" },
      { status: 502 }
    );
  }
}


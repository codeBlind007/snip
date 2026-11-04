import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

export async function GET() {
  try {
    const backendRes = await fetch(`${BACKEND_URL}/health-status`, {
      method: "GET",
      cache: "no-store",
    });

    if (!backendRes.ok) {
      return NextResponse.json({ "server-health": "unhealthy" }, { status: backendRes.status });
    }

    const data = await backendRes.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ "server-health": "offline" }, { status: 503 });
  }
}


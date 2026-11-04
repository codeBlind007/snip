import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;

  if (!token) {
    return NextResponse.json({ user: null });
  }

  try {
    // Validate the token by hitting the backend protected endpoint
    const backendRes = await fetch(`${BACKEND_URL}/url?page=1`, {
      method: "GET",
      headers: {
        Cookie: `access_token=${token}`,
      },
    });

    if (!backendRes.ok) {
      return NextResponse.json({ user: null });
    }

    // Attempt to parse JWT sub for user id
    let userId: number | null = null;
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
        if (payload?.sub) {
          userId = Number(payload.sub);
        }
      }
    } catch {
      // Ignore token parse error
    }

    return NextResponse.json({
      user: {
        id: userId || 1,
        email_id: "user@snip.link",
        fullname: "Active User",
      },
    });
  } catch {
    return NextResponse.json({ user: null });
  }
}


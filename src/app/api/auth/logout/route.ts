import { NextResponse } from "next/server";

// Older guards navigate here. The login recovery path also expires the cookie.
export function GET(request: Request) {
  const reason = new URL(request.url).searchParams.get("reason") || "success";
  const target = new URL("/login", request.url);
  target.searchParams.set("logout", reason);
  return NextResponse.redirect(target, { headers: { "Cache-Control": "no-store" } });
}

export function POST(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return NextResponse.json({ error: "Invalid logout request" }, { status: 403 });
  }

  const response = NextResponse.json({ success: true }, {
    headers: { "Cache-Control": "no-store" },
  });
  response.cookies.set("session", "", {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
  });
  return response;
}

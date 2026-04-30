import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: Request) {
    const url = new URL(req.url);
    const reason = url.searchParams.get("reason") || "success";
    const cookieStore = await cookies();
    cookieStore.delete("session");

    return NextResponse.redirect(new URL(`/login?logout=${encodeURIComponent(reason)}`, req.url));
}

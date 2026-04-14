import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
    const cookieStore = await cookies();
    cookieStore.delete("session");

    return NextResponse.redirect(new URL('/login?logout=success', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
}
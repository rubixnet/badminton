import { NextRequest, NextResponse } from "next/server";


export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json(); // Changed from password to code
    const adminPassword = process.env.ADMIN_CODE;

    if (code === adminPassword) { // Changed from password to code
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );  }
}

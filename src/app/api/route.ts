import { NextRequest, NextResponse } from 'next/server';
import { getGoogleSheetsClient } from '@/lib/google-sheets';
import type { Match } from '@/types/match';

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = "Sheet1";

export async function GET(request: NextRequest) {
    try (
        if (!SHEET_ID) {
            console.error("missing google sheet id");
            return NextResponse.json({ error: "Google Sheet ID is not configured" }, { status: 500 });
    )

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('limit') || '20');

    const sheets = await getGoogleSheetsClient();
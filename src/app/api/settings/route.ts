import { NextRequest, NextResponse } from "next/server";
import { getGoogleSheetsClient } from "@/lib/google-sheets";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = "Sheet1";
const SETTINGS_RANGE = `${SHEET_NAME}!Q1`;

type FormSettings = {
  bonusEnabled?: boolean;
};

async function readSettings(): Promise<FormSettings> {
  if (!SHEET_ID) {
    return {};
  }

  const sheets = await getGoogleSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: SETTINGS_RANGE,
  });

  const rawValue = response.data.values?.[0]?.[0];

  if (!rawValue) {
    return {};
  }

  try {
    return JSON.parse(rawValue) as FormSettings;
  } catch {
    return {};
  }
}

export async function GET() {
  try {
    const settings = await readSettings();

    return NextResponse.json({
      bonusEnabled: settings.bonusEnabled ?? false,
    });
  } catch (error) {
    console.error("Error loading form settings:", error);
    return NextResponse.json({ bonusEnabled: false });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as FormSettings;

    if (!SHEET_ID) {
      return NextResponse.json({ persisted: false, ...body });
    }

    const sheets = await getGoogleSheetsClient();
    const currentSettings = await readSettings();

    const nextSettings: FormSettings = {
      ...currentSettings,
      ...body,
    };

    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: SETTINGS_RANGE,
      valueInputOption: "RAW",
      requestBody: {
        values: [[JSON.stringify(nextSettings)]],
      },
    });

    return NextResponse.json({ persisted: true, ...nextSettings });
  } catch (error) {
    console.error("Error saving form settings:", error);
    return NextResponse.json(
      { error: "Failed to save form settings" },
      { status: 500 },
    );
  }
}
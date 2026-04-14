"use node"; // <--- THIS MUST BE THE FIRST LINE

import { v } from "convex/values";
import { action } from "./_generated/server";
import { google } from "googleapis";

export const recordMatchToSheets = action({
  args: {
    groupId: v.string(),
    userId: v.string(),
    userRole: v.string(),
    matchData: v.any(),
  },
  handler: async (ctx, args) => {
    const { matchData } = args;

    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });

    const values = [[
      matchData.id,
      matchData.createdAt,
      matchData.winner,
      matchData.team1.score,
      matchData.team2.score,
      matchData.team1.players[0]?.name || "",
      matchData.team1.players[0]?.bonusPoints || 0,
      matchData.team1.players[1]?.name || "",
      matchData.team1.players[1]?.bonusPoints || 0,
      matchData.team2.players[0]?.name || "",
      matchData.team2.players[0]?.bonusPoints || 0,
      matchData.team2.players[1]?.name || "",
      matchData.team2.players[1]?.bonusPoints || 0,
      JSON.stringify(matchData.checkpoints || []),
      args.groupId,  // Column O
      args.userId,   // Column P
      args.userRole, // Column Q
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Sheet1!A:Q",
      valueInputOption: "RAW",
      requestBody: { values },
    });

    return { success: true };
  },
});
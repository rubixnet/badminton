import { NextRequest, NextResponse } from 'next/server'
import { getGoogleSheetsClient } from '@/lib/google-sheets'
import type { Match } from '@/types/match'

const SHEET_ID = process.env.GOOGLE_SHEET_ID
const SHEET_NAME = 'Sheet1'

export async function GET(request: NextRequest) {
  try {
    if (!SHEET_ID) return NextResponse.json({ error: 'Config error' }, { status: 500 })

    const sheets = await getGoogleSheetsClient()
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A2:N`,
    })

    const rows = response.data.values || []
    
    const matches: Match[] = rows.map(row => {
         try {
          if (row[0] && row[0].trim().startsWith('{')) return JSON.parse(row[0])
          if (!row[0]) return null;
          return {
            id: row[0],
            createdAt: row[1],
            winner: row[2] as 'team1' | 'team2' | 'draw',
            team1: {
              score: parseInt(row[3] || '0'),
              players: [
                { name: row[5] || '', bonusPoints: parseInt(row[6] || '0') },
                ...(row[7] ? [{ name: row[7], bonusPoints: parseInt(row[8] || '0') }] : [])
              ]
            },
            team2: {
              score: parseInt(row[4] || '0'),
              players: [
                { name: row[9] || '', bonusPoints: parseInt(row[10] || '0') },
                ...(row[11] ? [{ name: row[11], bonusPoints: parseInt(row[12] || '0') }] : [])
              ]
            },
            checkpoints: row[13] ? JSON.parse(row[13]) : []
          } as Match
        } catch (e) { return null }
    }).filter((m): m is Match => m !== null)

    return NextResponse.json({ matches })

  } catch (error) {
    return NextResponse.json({ error: 'Failed to calculate analytics' }, { status: 500 })
  }
}
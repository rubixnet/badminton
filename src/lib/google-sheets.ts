import { google } from 'googleapis';
import type { sheets_v4 } from 'googleapis';

let sheets: sheets_v4.Sheets | undefined;

export async function getGoogleSheetsClient() {
    if (sheets) return sheets;
    try {
        const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
        const credentials = key ? JSON.parse(key) : {};
        const clientEmail = process.env.GOOGLE_CLIENT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || credentials.client_email;
        const privateKeyRaw = process.env.GOOGLE_PRIVATE_KEY || credentials.private_key;

        if (!clientEmail || !privateKeyRaw) {
            console.error("Missing credentials:", { clientEmail: !!clientEmail, privateKey: !!privateKeyRaw });
            throw new Error("Google Sheets credentials are not properly configured.");
        }

        let privateKey = privateKeyRaw.replace(/\\n/g, '\n');

        if (!privateKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
            privateKey = "-----BEGIN PRIVATE KEY-----\n" + privateKey;
        }

        if (!privateKey.endsWith("-----END PRIVATE KEY-----") &&
            !privateKey.endsWith("-----END PRIVATE KEY-----\n")
        ) {
            privateKey = privateKey + "\n-----END PRIVATE KEY-----";
        }
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: clientEmail,
                private_key: privateKey,
            },

            scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });

        sheets = google.sheets({ version: "v4", auth });
        return sheets;
    } catch (error: any) {
        if (error.code === "ERR_OSSL_UNSUPPORTED") {
            console.error(
                "Error: Invalid Google Private Key format. Please check your .env.local file.",
            );
            console.error(
                'Make sure the key starts with "-----BEGIN PRIVATE KEY-----" and ends with "-----END PRIVATE KEY-----"',
            );
            console.error(
                'If the key is in a single line, ensure all "\\n" characters are preserved.',
            );
        }
        console.error("Error initializing Google Sheets client:", error);
        throw error;
    }
}

import { google } from 'googleapis';

export async function getGoogleSheetsClient() {
    try {
        if (
            !process.env.GOOGLE_CLIENT_EMAIL ||
            !process.env.GOOGLE_PRIVATE_KEY ||
        ) {
            throw new Error("Google Sheets credentials are not properly configured.");
        }

        let privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');

        if (!privateKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
            priavteKey = "-----BEGIN PRIVATE KEY-----/n" + priavteKey;
        }

        if !privateKey.endsWith("-----END PRIVATE KEY-----") &&
            !privateKey.endsWith("-----END PRIVATE KEY-----\n")
        ) {
            privateKey = privateKey + "/n----END PRIVATE KEY-----";

        }
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_CLIENT_EMAIL,
                private_key: privateKey,
            },

            scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        })
        const client = await auth.getClient();

        return google.sheets({ version: "v4", auth: client });
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

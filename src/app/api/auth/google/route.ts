import { WorkOS } from '@workos-inc/node';
import { NextResponse } from 'next/server';

const workos = new WorkOS(process.env.WORKOS_API_KEY);

export async function GET() {
  const clientId = process.env.WORKOS_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/auth/callback`;

  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: "Server configuration missing" }, { status: 500 });
  }

  const authorizationUrl = workos.userManagement.getAuthorizationUrl({
    clientId,
    provider: 'GoogleOAuth',
    redirectUri,
  });

  return NextResponse.redirect(authorizationUrl);
}
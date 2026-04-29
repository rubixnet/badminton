import { WorkOS } from '@workos-inc/node';
import { NextResponse } from 'next/server';

const workos = new WorkOS(process.env.WORKOS_API_KEY);

export async function GET(req: Request) {
  const requestUrl = new URL(req.url);
  const { searchParams } = new URL(req.url);
  const clientId = process.env.WORKOS_CLIENT_ID;
  const redirectUri = new URL("/api/auth/callback", requestUrl.origin).toString();

  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: "Server configuration missing" }, { status: 500 });
  }

  const invite = searchParams.get('invite');
  const via = searchParams.get('via');

  const state = invite 
    ? Buffer.from(JSON.stringify({ invite, via })).toString('base64')
    : undefined;

  const authorizationUrl = workos.userManagement.getAuthorizationUrl({
    clientId,
    provider: 'GoogleOAuth',
    redirectUri,
    state, 
  });

  return NextResponse.redirect(authorizationUrl);
}

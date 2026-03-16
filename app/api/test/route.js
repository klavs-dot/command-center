export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET() {
  const r = {};
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN_1;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: 'refresh_token' }),
  });
  const t = await tokenRes.json();
  if (!t.access_token) return Response.json({ error: 'Token fail', details: t });

  const h = { Authorization: `Bearer ${t.access_token}` };

  const prof = await (await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', { headers: h })).json();
  r.account = prof.emailAddress;
  r.scopes = t.scope;

  const q1 = await (await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread&maxResults=5`, { headers: h })).json();
  r.unread_all = q1.resultSizeEstimate || 0;

  const q2 = await (await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread%20in:inbox&maxResults=5`, { headers: h })).json();
  r.unread_inbox = q2.resultSizeEstimate || 0;

  const q3 = await (await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=3`, { headers: h })).json();
  r.total_recent = q3.resultSizeEstimate || 0;

  if (q1.messages?.[0]) {
    const msg = await (await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${q1.messages[0].id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`, { headers: h })).json();
    r.first_unread = {
      subject: msg.payload?.headers?.find(x => x.name === 'Subject')?.value,
      from: msg.payload?.headers?.find(x => x.name === 'From')?.value,
    };
  }

  return Response.json(r);
}

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET() {
  const r = {};
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN_1,
      grant_type: 'refresh_token',
    }),
  });
  const t = await tokenRes.json();
  if (!t.access_token) return Response.json({ error: 'Token fail', details: t });

  const h = { Authorization: `Bearer ${t.access_token}` };

  const prof = await (await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', { headers: h })).json();
  r.account = prof.emailAddress || prof;

  const q = await (await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread%20in:inbox&maxResults=3', { headers: h })).json();
  r.unread = q.resultSizeEstimate || 0;
  r.error = q.error || null;

  return Response.json(r);
}

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET() {
  const results = {};

  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN_1;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  // 1. Dabūjam access token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    return Response.json({ error: 'Token kļūda', details: tokenData });
  }

  results.token = 'OK';
  const headers = { Authorization: `Bearer ${tokenData.access_token}` };

  // 2. Kāds ir profils?
  const profileRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', { headers });
  const profile = await profileRes.json();
  results.email = profile.emailAddress;
  results.totalMessages = profile.messagesTotal;

  // 3. Vienkārši is:unread (bez datuma filtra)
  const unreadRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent('is:unread')}&maxResults=5`,
    { headers }
  );
  const unreadData = await unreadRes.json();
  results.unread_total = unreadData.resultSizeEstimate;
  results.unread_ids = (unreadData.messages || []).length;

  // 4. is:unread in:inbox
  const inboxRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent('is:unread in:inbox')}&maxResults=5`,
    { headers }
  );
  const inboxData = await inboxRes.json();
  results.unread_inbox = inboxData.resultSizeEstimate;

  // 5. Ar datuma filtru (kā mūsu kods)
  const sevenDaysAgo = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
  const queryRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(`is:unread after:${sevenDaysAgo}`)}&maxResults=5`,
    { headers }
  );
  const queryData = await queryRes.json();
  results.unread_7d = queryData.resultSizeEstimate;

  // 6. Pirmā e-pasta detaļas
  if (unreadData.messages?.[0]) {
    const msgRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${unreadData.messages[0].id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`,
      { headers }
    );
    const msg = await msgRes.json();
    const subj = msg.payload?.headers?.find(h => h.name === 'Subject')?.value;
    const from = msg.payload?.headers?.find(h => h.name === 'From')?.value;
    results.first_email = { subject: subj, from: from };
  }

  return Response.json(results);
}

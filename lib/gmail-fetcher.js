// lib/gmail-fetcher.js

async function getAccessToken(refreshToken) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) return null;
  return (await res.json()).access_token;
}

async function fetchEmailsForAccount(refreshToken, accountName) {
  const accessToken = await getAccessToken(refreshToken);
  if (!accessToken) return [];

  try {
    const colors = { MOSPH: '#a064ff', DRIFT: '#ff2d78', GWM: '#00e8fc' };
    const headers = { Authorization: `Bearer ${accessToken}` };

    // Dabūjam nelasītos no inbox
    const listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent('is:unread in:inbox')}&maxResults=25`,
      { headers }
    );
    if (!listRes.ok) { console.error(`[Gmail] ${accountName}: ${listRes.status}`); return []; }
    const listData = await listRes.json();
    const messages = listData.messages || [];
    console.log(`[Gmail] ${accountName}: ${messages.length} nelasīti`);

    const emails = [];
    for (const msg of messages.slice(0, 25)) {
      try {
        const msgRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
          { headers }
        );
        if (!msgRes.ok) continue;
        const msgData = await msgRes.json();
        const hdrs = msgData.payload?.headers || [];
        const subject = hdrs.find(h => h.name === 'Subject')?.value || '(bez temata)';
        const from = hdrs.find(h => h.name === 'From')?.value || '';
        const dateStr = hdrs.find(h => h.name === 'Date')?.value || '';
        const snippet = msgData.snippet || '';
        const emailDate = new Date(dateStr);
        const diffDays = Math.max(0, Math.floor((Date.now() - emailDate.getTime()) / 86400000));

        let relDate;
        if (diffDays === 0) relDate = `šod ${emailDate.getHours()}:${String(emailDate.getMinutes()).padStart(2,'0')}`;
        else if (diffDays === 1) relDate = `vak ${emailDate.getHours()}:${String(emailDate.getMinutes()).padStart(2,'0')}`;
        else if (diffDays === 2) relDate = `aizv`;
        else relDate = `${diffDays}d`;

        emails.push({
          id: msg.id, subject,
          from: from.replace(/<.*>/, '').replace(/"/g, '').trim(),
          date: relDate, daysOld: diffDays,
          snippet: snippet.substring(0, 120),
          account: accountName,
          accountColor: colors[accountName] || '#00e8fc',
        });
      } catch (e) { continue; }
    }
    return emails;
  } catch (e) { console.error(`[Gmail] ${accountName}:`, e); return []; }
}

export async function fetchGmailData() {
  const accounts = [
    { token: process.env.GOOGLE_REFRESH_TOKEN_1, name: process.env.GMAIL_ACCOUNT_1_NAME || 'KONTS1' },
    { token: process.env.GOOGLE_REFRESH_TOKEN_2, name: process.env.GMAIL_ACCOUNT_2_NAME || 'KONTS2' },
    { token: process.env.GOOGLE_REFRESH_TOKEN_3, name: process.env.GMAIL_ACCOUNT_3_NAME || 'KONTS3' },
  ].filter(a => a.token && a.token !== 'xxxxx');

  if (accounts.length === 0) { console.log('[Gmail] Nav kontu'); return null; }

  const allResults = await Promise.all(accounts.map(a => fetchEmailsForAccount(a.token, a.name)));
  const allEmails = allResults.flat().sort((a, b) => a.daysOld - b.daysOld);

  console.log(`[Gmail] Kopā: ${allEmails.length} e-pasti`);

  return {
    recent: allEmails.filter(e => e.daysOld <= 1).slice(0, 10),
    old: allEmails.filter(e => e.daysOld > 1).sort((a, b) => b.daysOld - a.daysOld).slice(0, 15),
    total: allEmails.length,
  };
}

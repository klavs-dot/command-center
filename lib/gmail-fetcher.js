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
    const sevenDaysAgo = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
    const query = `is:unread after:${sevenDaysAgo}`;

    const listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=30`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!listRes.ok) { console.error(`[Gmail] ${accountName}:`, listRes.status); return []; }

    const listData = await listRes.json();
    const emails = [];

    for (const msg of (listData.messages || []).slice(0, 30)) {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!msgRes.ok) continue;
      const msgData = await msgRes.json();
      const headers = msgData.payload?.headers || [];
      const subject = headers.find(h => h.name === 'Subject')?.value || '(bez temata)';
      const from = headers.find(h => h.name === 'From')?.value || '';
      const dateStr = headers.find(h => h.name === 'Date')?.value || '';
      const snippet = msgData.snippet || '';
      const emailDate = new Date(dateStr);
      const diffDays = Math.floor((Date.now() - emailDate) / 86400000);

      let relDate;
      if (diffDays === 0) relDate = `šod ${emailDate.getHours()}:${String(emailDate.getMinutes()).padStart(2,'0')}`;
      else if (diffDays === 1) relDate = `vak ${emailDate.getHours()}:${String(emailDate.getMinutes()).padStart(2,'0')}`;
      else if (diffDays === 2) relDate = `aizv ${emailDate.getHours()}:${String(emailDate.getMinutes()).padStart(2,'0')}`;
      else relDate = `${diffDays}d`;

      const colors = { MOSPH: '#a064ff', DRIFT: '#ff2d78', GWM: '#00e8fc' };

      emails.push({
        id: msg.id, subject,
        from: from.replace(/<.*>/, '').replace(/"/g, '').trim(),
        date: relDate, daysOld: diffDays,
        snippet: snippet.substring(0, 120),
        account: accountName,
        accountColor: colors[accountName] || '#00e8fc',
      });
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

  if (accounts.length === 0) { console.log('[Gmail] Nav konfigurēts'); return null; }

  const allResults = await Promise.all(accounts.map(a => fetchEmailsForAccount(a.token, a.name)));
  const allEmails = allResults.flat().sort((a, b) => a.daysOld - b.daysOld);

  return {
    recent: allEmails.filter(e => e.daysOld <= 1).slice(0, 10),
    old: allEmails.filter(e => e.daysOld > 1).sort((a, b) => b.daysOld - a.daysOld).slice(0, 15),
    total: allEmails.length,
  };
}

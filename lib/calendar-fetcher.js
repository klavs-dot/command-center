// lib/calendar-fetcher.js

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

export async function fetchCalendarData() {
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN_1 || process.env.GOOGLE_REFRESH_TOKEN_2;
  if (!refreshToken) { console.log('[Calendar] Nav konfigurēts'); return null; }

  const accessToken = await getAccessToken(refreshToken);
  if (!accessToken) return null;

  try {
    const now = new Date(); now.setHours(0,0,0,0);
    const endDate = new Date(now); endDate.setDate(endDate.getDate() + 3); endDate.setHours(23,59,59,999);

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now.toISOString()}&timeMax=${endDate.toISOString()}&singleEvents=true&orderBy=startTime&maxResults=30`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!res.ok) { console.error('[Calendar]', res.status); return null; }
    const data = await res.json();

    const today = new Date(); today.setHours(0,0,0,0);
    const tom = new Date(today); tom.setDate(tom.getDate()+1);
    const dayAfter = new Date(today); dayAfter.setDate(dayAfter.getDate()+2);

    const days = [
      { day: 'Šodien', color: '#ff2d78', events: [] },
      { day: 'Rīt', color: '#ffaa00', events: [] },
      { day: 'Parīt', color: '#00ff88', events: [] },
    ];
    const travel = [];

    for (const event of data.items || []) {
      const isAllDay = !!event.start?.date && !event.start?.dateTime;
      const start = event.start?.dateTime || event.start?.date;
      if (!start) continue;

      // Visa diena notikumi = ceļojumi (augšējā joslā)
      if (isAllDay && event.location) {
        const eventStart = new Date(event.start.date);
        const daysUntil = Math.ceil((eventStart - new Date()) / 86400000);
        if (daysUntil > 0 && daysUntil <= 30) {
          travel.push({
            days: daysUntil,
            label: `${event.location} — ${event.summary || ''}`.substring(0, 35).toUpperCase(),
            color: daysUntil <= 7 ? '#ffaa00' : '#ff2d78',
          });
        }
        continue;
      }

      const eventDate = new Date(start); eventDate.setHours(0,0,0,0);
      const eventTime = event.start?.dateTime
        ? new Date(event.start.dateTime).toLocaleTimeString('lv-LV', { hour:'2-digit', minute:'2-digit', hour12:false, timeZone:'Europe/Riga' })
        : 'Visa diena';

      let duration = '';
      if (event.start?.dateTime && event.end?.dateTime) {
        const mins = Math.round((new Date(event.end.dateTime) - new Date(event.start.dateTime)) / 60000);
        duration = mins < 60 ? `${mins}m` : `${Math.floor(mins/60)}h${mins%60 > 0 ? ` ${mins%60}m` : ''}`;
      }

      let platform = 'Klātienē';
      const loc = (event.location||'').toLowerCase();
      const desc = (event.description||'').toLowerCase();
      if (loc.includes('meet.google') || desc.includes('meet.google') || event.hangoutLink) platform = 'Meet';
      else if (loc.includes('zoom') || desc.includes('zoom')) platform = 'Zoom';

      const title = (event.summary||'').toLowerCase();
      let color = '#00e8fc';
      if (title.includes('drift') || title.includes('arēn')) color = '#ff2d78';
      else if (title.includes('mosph')) color = '#a064ff';
      else if (title.includes('visit') || title.includes('liepāj')) color = '#00ff88';

      const formatted = { time: eventTime, title: event.summary || '(bez nos.)', platform, duration, color };

      if (eventDate.getTime() === today.getTime()) days[0].events.push(formatted);
      else if (eventDate.getTime() === tom.getTime()) days[1].events.push(formatted);
      else days[2].events.push(formatted);
    }

    return { calendar: days, travel: travel.slice(0, 3) };
  } catch (e) { console.error('[Calendar]', e); return null; }
}

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

async function fetchCalendarForAccount(refreshToken) {
  const accessToken = await getAccessToken(refreshToken);
  if (!accessToken) return { events: [], topBar: [] };

  try {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const endDate = new Date(now); endDate.setDate(endDate.getDate() + 30); endDate.setHours(23, 59, 59, 999);

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now.toISOString()}&timeMax=${endDate.toISOString()}&singleEvents=true&orderBy=startTime&maxResults=50`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!res.ok) { console.error('[Calendar]', res.status); return { events: [], topBar: [] }; }
    const data = await res.json();

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tom = new Date(today); tom.setDate(tom.getDate() + 1);
    const dayAfter = new Date(today); dayAfter.setDate(dayAfter.getDate() + 2);
    const nowMs = Date.now();

    const calEvents = [];
    const topBarEvents = [];

    for (const event of data.items || []) {
      const isAllDay = !!event.start?.date && !event.start?.dateTime;
      const start = event.start?.dateTime || event.start?.date;
      if (!start) continue;

      // Aprēķinam ilgumu stundās
      let durationHours = 24; // all-day default
      if (event.start?.dateTime && event.end?.dateTime) {
        durationHours = (new Date(event.end.dateTime) - new Date(event.start.dateTime)) / 3600000;
      } else if (event.start?.date && event.end?.date) {
        durationHours = (new Date(event.end.date) - new Date(event.start.date)) / 3600000;
      }

      // TOP BAR: tikai all-day vai ilgāk par 3h
      if (isAllDay || durationHours >= 3) {
        const eventStart = isAllDay ? new Date(event.start.date) : new Date(event.start.dateTime);
        const eventEnd = isAllDay
          ? (event.end?.date ? new Date(event.end.date) : eventStart)
          : new Date(event.end.dateTime);

        // Izlaiž pagātnes notikumus
        if (eventEnd.getTime() < nowMs) continue;

        const daysUntil = Math.max(0, Math.ceil((eventStart - today) / 86400000));
        const isOngoing = eventStart <= today && eventEnd > today;
        const d = isOngoing ? 0 : daysUntil;

        // Krāsas: šodien=zaļš, <7d=dzeltens, >7d=pelēks
        let color;
        if (d === 0) color = '#30d158';
        else if (d <= 7) color = '#ff9f0a';
        else color = '#8e8e93';

        const label = event.location
          ? `${event.summary || ''} — ${event.location}`.substring(0, 40).toUpperCase()
          : (event.summary || '').substring(0, 40).toUpperCase();

        topBarEvents.push({ days: d, label, color });

        // All-day events neiet uz kalendāra kolonnu
        if (isAllDay) continue;
      }

      // KALENDĀRA KOLONNA: normālie notikumi
      const eventDate = new Date(start); eventDate.setHours(0, 0, 0, 0);
      const eventTime = event.start?.dateTime
        ? new Date(event.start.dateTime).toLocaleTimeString('lv-LV', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Riga' })
        : 'Visa diena';

      let duration = '';
      if (event.start?.dateTime && event.end?.dateTime) {
        const mins = Math.round((new Date(event.end.dateTime) - new Date(event.start.dateTime)) / 60000);
        duration = mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h${mins % 60 > 0 ? ` ${mins % 60}m` : ''}`;
      }

      let platform = 'Klātienē';
      const loc = (event.location || '').toLowerCase();
      const desc = (event.description || '').toLowerCase();
      if (loc.includes('meet.google') || desc.includes('meet.google') || event.hangoutLink) platform = 'Meet';
      else if (loc.includes('zoom') || desc.includes('zoom')) platform = 'Zoom';

      const title = (event.summary || '').toLowerCase();
      let color = '#0a84ff';
      if (title.includes('drift') || title.includes('arēn')) color = '#ff375f';
      else if (title.includes('mosph')) color = '#bf5af2';
      else if (title.includes('visit') || title.includes('liepāj')) color = '#30d158';

      const dayIdx = eventDate.getTime() === today.getTime() ? 0
        : eventDate.getTime() === tom.getTime() ? 1
        : eventDate.getTime() === dayAfter.getTime() ? 2
        : -1;

      if (dayIdx >= 0) {
        calEvents.push({ dayIdx, time: eventTime, title: event.summary || '(bez nos.)', platform, duration, color });
      }
    }

    return { events: calEvents, topBar: topBarEvents };
  } catch (e) { console.error('[Calendar]', e); return { events: [], topBar: [] }; }
}

export async function fetchCalendarData() {
  const tokens = [
    process.env.GOOGLE_REFRESH_TOKEN_1,
    process.env.GOOGLE_REFRESH_TOKEN_2,
    process.env.GOOGLE_REFRESH_TOKEN_3,
  ].filter(t => t && t !== 'xxxxx');

  if (tokens.length === 0) { console.log('[Calendar] Nav konfigurēts'); return null; }

  const results = await Promise.all(tokens.map(t => fetchCalendarForAccount(t)));

  const days = [
    { day: 'Šodien', color: '#ff375f', events: [] },
    { day: 'Rīt', color: '#ff9f0a', events: [] },
    { day: 'Parīt', color: '#30d158', events: [] },
  ];

  // Apvienojam kalendāra notikumus no visiem kontiem
  for (const r of results) {
    for (const ev of r.events) {
      days[ev.dayIdx].events.push(ev);
    }
  }

  // Sakārtojam katras dienas notikumus pēc laika
  for (const d of days) {
    d.events.sort((a, b) => a.time.localeCompare(b.time));
  }

  // Apvienojam top bar no visiem kontiem, sakārtojam, ņemam pirmos 3
  const allTopBar = results.flatMap(r => r.topBar);
  // Noņemam dublikātus pēc label
  const seen = new Set();
  const uniqueTopBar = allTopBar.filter(t => {
    if (seen.has(t.label)) return false;
    seen.add(t.label);
    return true;
  });
  const travel = uniqueTopBar.sort((a, b) => a.days - b.days).slice(0, 3);

  console.log(`[Calendar] ${days.map(d => d.events.length).join('+')} notikumi, ${travel.length} top bar`);
  return { calendar: days, travel };
}

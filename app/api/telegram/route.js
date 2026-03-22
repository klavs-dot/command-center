// app/api/telegram/route.js
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const TELEGRAM = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
const ALLOWED_CHAT = process.env.TELEGRAM_CHAT_ID;

export async function POST(req) {
  try {
    const body = await req.json();
    const msg = body.message;
    if (!msg) return Response.json({ ok: true });

    const chatId = msg.chat.id;
    if (ALLOWED_CHAT && String(chatId) !== String(ALLOWED_CHAT)) {
      await send(chatId, '⛔ Nav piekļuves.');
      return Response.json({ ok: true });
    }

    let text = msg.text;

    // Balss ziņa
    if (msg.voice || msg.audio) {
      const fileId = (msg.voice || msg.audio).file_id;
      await send(chatId, '🎤 Klausos...');
      text = await transcribeVoice(fileId);
      if (!text) {
        await send(chatId, '❌ Neizdevās atpazīt runu. Pamēģini vēlreiz.');
        return Response.json({ ok: true });
      }
      await send(chatId, `📝 Sapratu: "${text}"`);
    }

    if (!text) return Response.json({ ok: true });

    if (text === '/start') {
      await send(chatId, '👋 Čau, Klāv!\n\n🎤 Ierunā vai ✍️ raksti:\n\n📅 "Kas man šodien/rīt kalendārā?"\n📧 "Parādi pēdējos e-pastus"\n📅 "Ieliec kalendārā piektdien Rīga meetings"\n📋 "Iedod Paulai uzdevumu — prezentācija"\n✉️ "Sagatavo draftu Ievai — tikšanās der"');
      return Response.json({ ok: true });
    }

    await send(chatId, '🤖 Domāju...');
    const action = await askClaude(text);
    if (!action) { await send(chatId, '❌ Kaut kas nogāja greizi.'); return Response.json({ ok: true }); }

    const result = await executeAction(action);
    await send(chatId, result);
  } catch (e) { console.error('[TG]', e); }
  return Response.json({ ok: true });
}

async function send(chatId, text) {
  await fetch(`${TELEGRAM}/sendMessage`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  });
}

// ═══ BALSS ATPAZĪŠANA ═══
async function transcribeVoice(fileId) {
  try {
    const fileRes = await fetch(`${TELEGRAM}/getFile?file_id=${fileId}`);
    const fileData = await fileRes.json();
    const filePath = fileData.result?.file_path;
    if (!filePath) return null;

    const audioRes = await fetch(`https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${filePath}`);
    const audioBuffer = Buffer.from(await audioRes.arrayBuffer());
    const audioBase64 = audioBuffer.toString('base64');

    const apiKey = process.env.GOOGLE_SPEECH_API_KEY;
    if (!apiKey) { console.error('[Speech] Nav API key'); return null; }

    const speechRes = await fetch(`https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config: { encoding: 'OGG_OPUS', sampleRateHertz: 48000, languageCode: 'lv-LV', alternativeLanguageCodes: ['en-US', 'ru-RU'], model: 'latest_long' },
        audio: { content: audioBase64 },
      }),
    });
    const speechData = await speechRes.json();
    return speechData.results?.[0]?.alternatives?.[0]?.transcript || null;
  } catch (e) { console.error('[Speech]', e); return null; }
}

// ═══ CLAUDE ═══
async function askClaude(userText) {
  const now = new Date();
  const today = now.toLocaleDateString('lv-LV', { timeZone: 'Europe/Riga', weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' });
  const todayISO = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Riga' }));
  const yyyy = todayISO.getFullYear(), mm = String(todayISO.getMonth()+1).padStart(2,'0'), dd = String(todayISO.getDate()).padStart(2,'0');
  const todayDate = `${yyyy}-${mm}-${dd}`;

  const prompt = `Tu esi Klāva biznesa asistents. Šodien: ${today} (${todayDate}).

Uzņēmumi: VisitLiepāja (VL), Drift Arena (DA), Mosphera (MO), Global Wolf Motors (GWM).
Komanda: Paula (PA), Elizabete (EL).
E-pasti: klavs@globalwolfmotors.com (GWM konts=1), franchise@driftarena.com (DRIFT konts=2), hello@mosphera.com (MOSPH konts=3).

Saproti komandu un atgriez TIKAI JSON (bez markdown):

KALENDĀRA NOTIKUMS:
{"action":"calendar","summary":"...","date":"YYYY-MM-DD","allDay":true,"location":"...","startTime":"HH:MM","endTime":"HH:MM","reply":"..."}

E-PASTA DRAFTS:
{"action":"email","to":"email@...","subject":"...","body":"...","account":"GWM","reply":"..."}

CLICKUP UZDEVUMS:
{"action":"task","title":"...","assignee":"Paula","dueDate":"YYYY-MM-DD","reply":"..."}

LASĪT E-PASTUS (kad jautā par e-pastiem, inbox, kas rakstījis):
{"action":"readEmails","accounts":[1,2,3],"count":5,"reply":"Lasu e-pastus..."}
Ja jautā par konkrētu kontu, liec tikai to numuru. Ja jautā vispārīgi, liec visus [1,2,3]. count = cik e-pastus rādīt.

LASĪT KALENDĀRU (kad jautā kas šodien/rīt/šonedēļ kalendārā):
{"action":"readCalendar","accounts":[1,2,3],"daysAhead":1,"reply":"Skatos kalendāru..."}
daysAhead: 0=šodien, 1=rīt, 7=šonedēļ. Ja jautā par konkrētu kontu, liec tikai to.

CITS/JAUTĀJUMS:
{"action":"info","reply":"Atbilde..."}

Komanda: ${userText}`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1500, messages: [{ role: 'user', content: prompt }] }),
    });
    const data = await res.json();
    const text = data.content?.filter(i => i.type === 'text').map(i => i.text).join('') || '';
    const clean = text.replace(/```json|```/g, '').trim();
    const s = clean.indexOf('{'), e = clean.lastIndexOf('}');
    if (s === -1 || e === -1) return null;
    return JSON.parse(clean.substring(s, e + 1));
  } catch (e) { console.error('[Claude]', e); return null; }
}

// ═══ IZPILDE ═══
async function executeAction(action) {
  try {
    switch (action.action) {
      case 'calendar': return await doCalendar(action);
      case 'email': return await doEmail(action);
      case 'task': return await doTask(action);
      case 'readEmails': return await doReadEmails(action);
      case 'readCalendar': return await doReadCalendar(action);
      case 'info': return `💬 ${action.reply}`;
      default: return `💬 ${action.reply || 'Nesapratu.'}`;
    }
  } catch (e) { console.error('[Action]', e); return `❌ Kļūda: ${e.message}`; }
}

// ═══ LASĪT E-PASTUS ═══
async function doReadEmails(a) {
  const tokenKeys = [process.env.GOOGLE_REFRESH_TOKEN_1, process.env.GOOGLE_REFRESH_TOKEN_2, process.env.GOOGLE_REFRESH_TOKEN_3];
  const names = [process.env.GMAIL_ACCOUNT_1_NAME || 'GWM', process.env.GMAIL_ACCOUNT_2_NAME || 'DRIFT', process.env.GMAIL_ACCOUNT_3_NAME || 'MOSPH'];
  const accounts = (a.accounts || [1, 2, 3]).filter(i => tokenKeys[i - 1]);
  const count = a.count || 5;
  let result = '📧 <b>Nelasītie e-pasti:</b>\n\n';

  for (const idx of accounts) {
    const token = await getGoogleToken(tokenKeys[idx - 1]);
    if (!token) continue;
    const h = { Authorization: `Bearer ${token}` };

    const listRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent('is:unread in:inbox')}&maxResults=${count}`, { headers: h });
    if (!listRes.ok) continue;
    const listData = await listRes.json();
    const msgs = listData.messages || [];

    if (msgs.length === 0) {
      result += `<b>${names[idx - 1]}</b>: Nav nelasītu ✅\n\n`;
      continue;
    }

    result += `<b>${names[idx - 1]}</b> (${listData.resultSizeEstimate || msgs.length} nelasīti):\n`;

    for (const m of msgs.slice(0, count)) {
      try {
        const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`, { headers: h });
        if (!msgRes.ok) continue;
        const msgData = await msgRes.json();
        const hdrs = msgData.payload?.headers || [];
        const subj = hdrs.find(x => x.name === 'Subject')?.value || '(bez temata)';
        const from = (hdrs.find(x => x.name === 'From')?.value || '').replace(/<.*>/, '').replace(/"/g, '').trim();
        const dateStr = hdrs.find(x => x.name === 'Date')?.value || '';
        const d = new Date(dateStr);
        const timeStr = `${d.getDate()}.${d.getMonth() + 1} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        result += `  • <b>${subj}</b>\n    ${from} · ${timeStr}\n`;
      } catch (e) { continue; }
    }
    result += '\n';
  }

  return result;
}

// ═══ LASĪT KALENDĀRU ═══
async function doReadCalendar(a) {
  const tokenKeys = [process.env.GOOGLE_REFRESH_TOKEN_1, process.env.GOOGLE_REFRESH_TOKEN_2, process.env.GOOGLE_REFRESH_TOKEN_3];
  const names = [process.env.GMAIL_ACCOUNT_1_NAME || 'GWM', process.env.GMAIL_ACCOUNT_2_NAME || 'DRIFT', process.env.GMAIL_ACCOUNT_3_NAME || 'MOSPH'];
  const accounts = (a.accounts || [1, 2, 3]).filter(i => tokenKeys[i - 1]);
  const daysAhead = a.daysAhead ?? 1;

  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Riga' }));
  const start = new Date(now); start.setHours(0, 0, 0, 0);
  const end = new Date(start); end.setDate(end.getDate() + daysAhead + 1);

  const dayNames = ['Svētdiena', 'Pirmdiena', 'Otrdiena', 'Trešdiena', 'Ceturtdiena', 'Piektdiena', 'Sestdiena'];
  let result = `📅 <b>Kalendārs (${daysAhead === 0 ? 'šodien' : daysAhead === 1 ? 'šodien + rīt' : `nākamās ${daysAhead + 1} dienas`}):</b>\n\n`;

  const allEvents = [];

  for (const idx of accounts) {
    const token = await getGoogleToken(tokenKeys[idx - 1]);
    if (!token) continue;

    const calRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${start.toISOString()}&timeMax=${end.toISOString()}&singleEvents=true&orderBy=startTime&maxResults=30`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!calRes.ok) continue;
    const calData = await calRes.json();

    for (const ev of calData.items || []) {
      const isAllDay = !!ev.start?.date;
      const evStart = isAllDay ? new Date(ev.start.date) : new Date(ev.start.dateTime);
      allEvents.push({
        summary: ev.summary || '(bez nos.)',
        start: evStart,
        isAllDay,
        time: isAllDay ? 'Visa diena' : evStart.toLocaleTimeString('lv-LV', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Riga' }),
        location: ev.location || '',
        account: names[idx - 1],
      });
    }
  }

  allEvents.sort((a, b) => a.start - b.start);

  if (allEvents.length === 0) {
    return result + 'Nav notikumu! 🎉';
  }

  // Grupējam pa dienām
  let currentDay = '';
  for (const ev of allEvents) {
    const evDay = ev.start.toLocaleDateString('lv-LV', { timeZone: 'Europe/Riga', weekday: 'long', day: '2-digit', month: '2-digit' });
    if (evDay !== currentDay) {
      currentDay = evDay;
      result += `\n<b>📆 ${evDay}</b>\n`;
    }
    result += `  ${ev.isAllDay ? '🔵' : '⏰'} <b>${ev.time}</b> — ${ev.summary}`;
    if (ev.location) result += ` 📍${ev.location}`;
    result += ` <i>(${ev.account})</i>\n`;
  }

  return result;
}

// ═══ KALENDĀRA NOTIKUMS ═══
async function doCalendar(a) {
  const token = await getGoogleToken(process.env.GOOGLE_REFRESH_TOKEN_1);
  if (!token) return '❌ Nav piekļuves kalendāram';

  const event = { summary: a.summary };
  if (a.location) event.location = a.location;

  if (a.allDay || !a.startTime) {
    event.start = { date: a.date };
    const endDate = new Date(a.date); endDate.setDate(endDate.getDate() + 1);
    event.end = { date: endDate.toISOString().split('T')[0] };
  } else {
    event.start = { dateTime: `${a.date}T${a.startTime}:00`, timeZone: 'Europe/Riga' };
    const endTime = a.endTime || `${(parseInt(a.startTime) + 1).toString().padStart(2, '0')}:${a.startTime.split(':')[1] || '00'}`;
    event.end = { dateTime: `${a.date}T${endTime}:00`, timeZone: 'Europe/Riga' };
  }

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });

  if (res.ok) return `✅ Kalendārā ielikts: <b>${a.summary}</b>\n📅 ${a.date}${a.startTime ? ' ' + a.startTime : ' (visa diena)'}${a.location ? '\n📍 ' + a.location : ''}`;
  return '❌ Neizdevās ielikt kalendārā';
}

// ═══ E-PASTA DRAFTS ═══
async function doEmail(a) {
  const tokenMap = { GWM: process.env.GOOGLE_REFRESH_TOKEN_1, DRIFT: process.env.GOOGLE_REFRESH_TOKEN_2, MOSPH: process.env.GOOGLE_REFRESH_TOKEN_3 };
  const token = await getGoogleToken(tokenMap[a.account] || process.env.GOOGLE_REFRESH_TOKEN_1);
  if (!token) return '❌ Nav piekļuves e-pastam';

  const raw = btoa(unescape(encodeURIComponent(`To: ${a.to}\r\nSubject: ${a.subject}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${a.body}`)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: { raw } }),
  });

  if (res.ok) return `✅ Drafts sagatavots (${a.account}):\n📧 Kam: ${a.to}\n📝 Temats: ${a.subject}\n\n💬 ${a.body}`;
  return '❌ Neizdevās sagatavot draftu';
}

// ═══ CLICKUP ═══
async function doTask(a) {
  const token = process.env.CLICKUP_API_TOKEN;
  if (!token) return '❌ Nav ClickUp tokena';
  const headers = { Authorization: token, 'Content-Type': 'application/json' };

  const teamsRes = await fetch('https://api.clickup.com/api/v2/team', { headers });
  const teamId = (await teamsRes.json()).teams?.[0]?.id;
  if (!teamId) return '❌ Nav ClickUp team';

  const spacesRes = await fetch(`https://api.clickup.com/api/v2/team/${teamId}/space?archived=false`, { headers });
  const spaces = (await spacesRes.json()).spaces || [];
  if (!spaces[0]) return '❌ Nav ClickUp space';

  let listId = null;
  const foldersRes = await fetch(`https://api.clickup.com/api/v2/space/${spaces[0].id}/folder?archived=false`, { headers });
  const folders = (await foldersRes.json()).folders || [];
  if (folders[0]?.lists?.[0]) listId = folders[0].lists[0].id;
  if (!listId) {
    const listsRes = await fetch(`https://api.clickup.com/api/v2/space/${spaces[0].id}/list?archived=false`, { headers });
    const lists = (await listsRes.json()).lists || [];
    if (lists[0]) listId = lists[0].id;
  }
  if (!listId) return '❌ Nav ClickUp list';

  const taskData = { name: a.title };
  if (a.dueDate) taskData.due_date = new Date(a.dueDate).getTime();

  const res = await fetch(`https://api.clickup.com/api/v2/list/${listId}/task`, { method: 'POST', headers, body: JSON.stringify(taskData) });

  if (res.ok) return `✅ Uzdevums izveidots:\n📋 ${a.title}${a.assignee ? '\n👤 ' + a.assignee : ''}${a.dueDate ? '\n📅 līdz ' + a.dueDate : ''}`;
  return '❌ Neizdevās izveidot uzdevumu';
}

// ═══ GOOGLE TOKEN ═══
async function getGoogleToken(refreshToken) {
  if (!refreshToken) return null;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, refresh_token: refreshToken, grant_type: 'refresh_token' }),
  });
  if (!res.ok) return null;
  return (await res.json()).access_token;
}

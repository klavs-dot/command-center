// app/api/telegram/route.js
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const TELEGRAM = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
const ALLOWED_CHAT = process.env.TELEGRAM_CHAT_ID;

// ═══ WEBHOOK HANDLER ═══
export async function POST(req) {
  try {
    const body = await req.json();
    const msg = body.message;
    if (!msg) return Response.json({ ok: true });

    const chatId = msg.chat.id;

    // Drošība — tikai Klāvs var lietot
    if (ALLOWED_CHAT && String(chatId) !== String(ALLOWED_CHAT)) {
      await sendTelegram(chatId, '⛔ Nav piekļuves.');
      return Response.json({ ok: true });
    }

    let text = msg.text;

    // Balss ziņa → transkribē
    if (msg.voice || msg.audio) {
      const fileId = (msg.voice || msg.audio).file_id;
      await sendTelegram(chatId, '🎤 Klausos...');
      text = await transcribeVoice(fileId);
      if (!text) {
        await sendTelegram(chatId, '❌ Neizdevās atpazīt runu. Pamēģini vēlreiz vai raksti tekstu.');
        return Response.json({ ok: true });
      }
      await sendTelegram(chatId, `📝 Sapratu: "${text}"`);
    }

    if (!text) return Response.json({ ok: true });

    // /start komanda
    if (text === '/start') {
      await sendTelegram(chatId, '👋 Čau, Klāv! Es esmu tavs Command Center bots.\n\nVari man:\n🎤 Ierunāt balss ziņu\n✍️ Vai rakstīt tekstu\n\nPiemēri:\n• "Ieliec kalendārā piektdien Rīga meetings"\n• "Iedod Paulai uzdevumu — prezentācija līdz piektdienai"\n• "Sagatavo draftu Ievai — tikšanās piektdien der"\n• "Kas man šodien kalendārā?"');
      return Response.json({ ok: true });
    }

    // Sūtam Claude
    await sendTelegram(chatId, '🤖 Domāju...');
    const action = await askClaude(text);

    if (!action) {
      await sendTelegram(chatId, '❌ Kaut kas nogāja greizi. Pamēģini vēlreiz.');
      return Response.json({ ok: true });
    }

    // Izpildam darbību
    const result = await executeAction(action);
    await sendTelegram(chatId, result);

  } catch (e) {
    console.error('[Telegram]', e);
  }
  return Response.json({ ok: true });
}

// ═══ TELEGRAM HELPERS ═══
async function sendTelegram(chatId, text) {
  await fetch(`${TELEGRAM}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  });
}

// ═══ VOICE TRANSCRIPTION (Google Speech-to-Text) ═══
async function transcribeVoice(fileId) {
  try {
    // 1. Dabūjam faila ceļu no Telegram
    const fileRes = await fetch(`${TELEGRAM}/getFile?file_id=${fileId}`);
    const fileData = await fileRes.json();
    const filePath = fileData.result?.file_path;
    if (!filePath) return null;

    // 2. Lejupielādējam audio
    const audioRes = await fetch(`https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${filePath}`);
    const audioBuffer = Buffer.from(await audioRes.arrayBuffer());
    const audioBase64 = audioBuffer.toString('base64');

    // 3. Google Speech-to-Text
    const apiKey = process.env.GOOGLE_SPEECH_API_KEY || process.env.GOOGLE_SHEETS_API_KEY;
    if (!apiKey) {
      console.error('[Speech] Nav API key');
      return null;
    }

    const speechRes = await fetch(`https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config: {
          encoding: 'OGG_OPUS',
          sampleRateHertz: 48000,
          languageCode: 'lv-LV',
          alternativeLanguageCodes: ['en-US', 'ru-RU'],
          model: 'latest_long',
        },
        audio: { content: audioBase64 },
      }),
    });

    const speechData = await speechRes.json();
    return speechData.results?.[0]?.alternatives?.[0]?.transcript || null;
  } catch (e) {
    console.error('[Speech]', e);
    return null;
  }
}

// ═══ CLAUDE — SAPROT KOMANDU ═══
async function askClaude(userText) {
  const today = new Date().toLocaleDateString('lv-LV', { timeZone: 'Europe/Riga', weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' });
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const prompt = `Tu esi Klāva biznesa asistents. Šodien ir ${today}. Rītdiena: ${tomorrow}.

Klāva uzņēmumi: VisitLiepāja (VL), Drift Arena (DA), Mosphera (MO), Global Wolf Motors (GWM).
Komanda: Paula (PA), Elizabete (EL).
E-pasti: klavs@globalwolfmotors.com (GWM), franchise@driftarena.com (DRIFT), hello@mosphera.com (MOSPH).

Saproti lietotāja komandu un atgriez TIKAI JSON (bez markdown, bez backticks):

Ja KALENDĀRS:
{"action":"calendar","summary":"...","date":"YYYY-MM-DD","allDay":true,"location":"...","startTime":"HH:MM","endTime":"HH:MM","reply":"..."}

Ja E-PASTA DRAFTS:
{"action":"email","to":"email@...","subject":"...","body":"...","account":"GWM","reply":"..."}

Ja CLICKUP UZDEVUMS:
{"action":"task","title":"...","assignee":"Paula vai Elizabete","dueDate":"YYYY-MM-DD","reply":"..."}

Ja JAUTĀJUMS vai CITS:
{"action":"info","reply":"Atbilde teksts..."}

Komanda: ${userText}`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, messages: [{ role: 'user', content: prompt }] }),
    });
    const data = await res.json();
    const text = data.content?.filter(i => i.type === 'text').map(i => i.text).join('') || '';
    const clean = text.replace(/```json|```/g, '').trim();
    const start = clean.indexOf('{'), end = clean.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    return JSON.parse(clean.substring(start, end + 1));
  } catch (e) {
    console.error('[Claude]', e);
    return null;
  }
}

// ═══ DARBĪBU IZPILDE ═══
async function executeAction(action) {
  try {
    switch (action.action) {
      case 'calendar':
        return await doCalendar(action);
      case 'email':
        return await doEmail(action);
      case 'task':
        return await doTask(action);
      case 'info':
        return `💬 ${action.reply}`;
      default:
        return `💬 ${action.reply || 'Nesapratu ko darīt.'}`;
    }
  } catch (e) {
    console.error('[Action]', e);
    return `❌ Kļūda: ${e.message}`;
  }
}

// ═══ KALENDĀRS ═══
async function doCalendar(a) {
  const accessToken = await getGoogleToken(process.env.GOOGLE_REFRESH_TOKEN_1);
  if (!accessToken) return '❌ Nav piekļuves kalendāram';

  const event = { summary: a.summary };
  if (a.location) event.location = a.location;

  if (a.allDay || !a.startTime) {
    event.start = { date: a.date };
    const endDate = new Date(a.date);
    endDate.setDate(endDate.getDate() + 1);
    event.end = { date: endDate.toISOString().split('T')[0] };
  } else {
    event.start = { dateTime: `${a.date}T${a.startTime}:00`, timeZone: 'Europe/Riga' };
    event.end = { dateTime: `${a.date}T${a.endTime || a.startTime.replace(/(\d+):/, (m, h) => `${(+h+1)%24}:`)}:00`, timeZone: 'Europe/Riga' };
  }

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });

  if (res.ok) {
    const d = await res.json();
    return `✅ Kalendārā ielikts: <b>${a.summary}</b>\n📅 ${a.date}${a.startTime ? ' ' + a.startTime : ' (visa diena)'}${a.location ? '\n📍 ' + a.location : ''}`;
  }
  return '❌ Neizdevās ielikt kalendārā';
}

// ═══ E-PASTA DRAFTS ═══
async function doEmail(a) {
  const tokenMap = { GWM: process.env.GOOGLE_REFRESH_TOKEN_1, DRIFT: process.env.GOOGLE_REFRESH_TOKEN_2, MOSPH: process.env.GOOGLE_REFRESH_TOKEN_3 };
  const refreshToken = tokenMap[a.account] || process.env.GOOGLE_REFRESH_TOKEN_1;
  const accessToken = await getGoogleToken(refreshToken);
  if (!accessToken) return '❌ Nav piekļuves e-pastam';

  const raw = btoa(
    `To: ${a.to}\r\nSubject: ${a.subject}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${a.body}`
  ).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: { raw } }),
  });

  if (res.ok) {
    return `✅ Drafts sagatavots (${a.account}):\n📧 Kam: ${a.to}\n📝 Temats: ${a.subject}`;
  }
  return '❌ Neizdevās sagatavot draftu';
}

// ═══ CLICKUP UZDEVUMS ═══
async function doTask(a) {
  const token = process.env.CLICKUP_API_TOKEN;
  if (!token) return '❌ Nav ClickUp tokena';

  const headers = { Authorization: token, 'Content-Type': 'application/json' };

  // Dabūjam pirmo space un list
  const teamsRes = await fetch('https://api.clickup.com/api/v2/team', { headers });
  const teamId = (await teamsRes.json()).teams?.[0]?.id;
  if (!teamId) return '❌ Nav ClickUp team';

  const spacesRes = await fetch(`https://api.clickup.com/api/v2/team/${teamId}/space?archived=false`, { headers });
  const spaces = (await spacesRes.json()).spaces || [];
  const space = spaces[0];
  if (!space) return '❌ Nav ClickUp space';

  // Dabūjam pirmo list
  const foldersRes = await fetch(`https://api.clickup.com/api/v2/space/${space.id}/folder?archived=false`, { headers });
  const folders = (await foldersRes.json()).folders || [];
  let listId = null;
  if (folders[0]?.lists?.[0]) listId = folders[0].lists[0].id;
  if (!listId) {
    const listsRes = await fetch(`https://api.clickup.com/api/v2/space/${space.id}/list?archived=false`, { headers });
    const lists = (await listsRes.json()).lists || [];
    if (lists[0]) listId = lists[0].id;
  }
  if (!listId) return '❌ Nav ClickUp list';

  const taskData = { name: a.title };
  if (a.dueDate) taskData.due_date = new Date(a.dueDate).getTime();

  const res = await fetch(`https://api.clickup.com/api/v2/list/${listId}/task`, {
    method: 'POST', headers,
    body: JSON.stringify(taskData),
  });

  if (res.ok) {
    return `✅ Uzdevums izveidots:\n📋 ${a.title}${a.assignee ? '\n👤 ' + a.assignee : ''}${a.dueDate ? '\n📅 līdz ' + a.dueDate : ''}`;
  }
  return '❌ Neizdevās izveidot uzdevumu';
}

// ═══ GOOGLE TOKEN HELPER ═══
async function getGoogleToken(refreshToken) {
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

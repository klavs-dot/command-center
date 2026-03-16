// lib/claude-fetcher.js
// Claude analizē e-pastus un uzraksta AI ieteikumus

export async function analyzeEmails(emails) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'sk-ant-xxxxx') return null;
  if (!emails?.length) return null;

  const emailList = emails.map(e => `- [${e.account}] "${e.subject}" no ${e.from}: ${e.snippet}`).join('\n');

  const prompt = `Tu esi biznesa asistents. Analizē šos nelasītos e-pastus un katram uzraksti:
1. summary: 1 teikums latviski par saturu (max 80 burti)
2. suggestion: 1 konkrēts ieteikums ko darīt/atbildēt (max 60 burti)
3. urgent: true/false

E-pasti:
${emailList}

Atgriez TIKAI JSON masīvu (bez markdown, bez backticks):
[{"subject": "...", "summary": "...", "suggestion": "...", "urgent": false}]`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 3000, messages: [{ role: 'user', content: prompt }] }),
    });

    if (!res.ok) { console.error('[Claude]', res.status); return null; }
    const data = await res.json();
    const text = data.content.filter(i => i.type === 'text').map(i => i.text).join('');
    const cleaned = text.replace(/```json|```/g, '').trim();
    const start = cleaned.indexOf('['), end = cleaned.lastIndexOf(']');
    if (start === -1 || end === -1) return null;
    const parsed = JSON.parse(cleaned.substring(start, end + 1));
    console.log(`[Claude] ${parsed.length} e-pastu analīzes saņemtas`);
    return parsed;
  } catch (e) { console.error('[Claude]', e); return null; }
}

// app/api/test/route.js
import { fetchGmailData } from '@/lib/gmail-fetcher';
import { fetchCalendarData } from '@/lib/calendar-fetcher';
import { fetchClickUpData } from '@/lib/clickup-fetcher';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET() {
  const results = {};

  // Test Gmail
  try {
    const gmail = await fetchGmailData();
    results.gmail = gmail ? `OK — ${gmail.total} e-pasti` : 'Nav konfigurēts';
  } catch (e) { results.gmail = `KĻŪDA: ${e.message}`; }

  // Test Calendar
  try {
    const cal = await fetchCalendarData();
    const events = cal?.calendar?.reduce((s, d) => s + d.events.length, 0) || 0;
    results.calendar = cal ? `OK — ${events} notikumi, ${cal.travel?.length || 0} ceļojumi` : 'Nav konfigurēts';
  } catch (e) { results.calendar = `KĻŪDA: ${e.message}`; }

  // Test ClickUp
  try {
    const clickup = await fetchClickUpData();
    results.clickup = clickup ? `OK — ${clickup.completed?.length || 0} pabeigti, ${clickup.overdue?.length || 0} kavējas` : 'Nav konfigurēts';
  } catch (e) { results.clickup = `KĻŪDA: ${e.message}`; }

  // API keys status
  results.keys = {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? 'Ir' : 'NAV',
    CLICKUP_API_TOKEN: process.env.CLICKUP_API_TOKEN ? 'Ir' : 'NAV',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'Ir' : 'NAV',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'Ir' : 'NAV',
    GOOGLE_REFRESH_TOKEN_1: process.env.GOOGLE_REFRESH_TOKEN_1 ? 'Ir' : 'NAV',
    GOOGLE_REFRESH_TOKEN_2: process.env.GOOGLE_REFRESH_TOKEN_2 ? 'Ir (nākamais konts)' : 'Nav (vēlāk)',
    GOOGLE_REFRESH_TOKEN_3: process.env.GOOGLE_REFRESH_TOKEN_3 ? 'Ir (nākamais konts)' : 'Nav (vēlāk)',
  };

  return Response.json(results);
}

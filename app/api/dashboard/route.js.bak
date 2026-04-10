// app/api/dashboard/route.js
import { fetchGmailData } from '@/lib/gmail-fetcher';
import { fetchCalendarData } from '@/lib/calendar-fetcher';
import { fetchClickUpData, mapCompany, mapPerson } from '@/lib/clickup-fetcher';
import { analyzeEmails } from '@/lib/claude-fetcher';
import { fetchSheetsData } from '@/lib/sheets-fetcher';
import { fetchAnalyticsData } from '@/lib/analytics-fetcher';
import { getMockData } from '@/lib/mock-data';
import { shouldCallClaude } from '@/lib/schedule';

let cache = { gmail: null, calendar: null, clickup: null, claudeAI: null, lastFetch: 0, lastClaude: 0 };

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET() {
  const mock = getMockData();
  let d = { ...mock, source: 'mock' };
  const now = Date.now();
  const fiveMin = 5 * 60 * 1000;
  const fiftyMin = 50 * 60 * 1000;

  // ══════════════════════════
  // 1. GMAIL (ik 5 min, bezmaksas)
  // ══════════════════════════
  if (now - cache.lastFetch > fiveMin) {
    const gmail = await fetchGmailData();
    if (gmail) cache.gmail = gmail;

    const cal = await fetchCalendarData();
    if (cal) cache.calendar = cal;

    const clickup = await fetchClickUpData();
    if (clickup) cache.clickup = clickup;

    cache.lastFetch = now;
  }

  // Ieliekam Gmail datus
  if (cache.gmail) {
    d.emailsRecent = cache.gmail.recent.map(e => {
      const ai = cache.claudeAI?.find(a => a.subject === e.subject);
      return { ...e, summary: ai?.summary || e.snippet, suggestion: ai?.suggestion || 'Izlasi un izlemj', urgent: ai?.urgent || false };
    });
    d.emailsOld = cache.gmail.old.map(e => ({
      subject: e.subject, account: e.account, accountColor: e.accountColor, daysOld: e.daysOld, urgent: e.daysOld >= 5,
    }));
  }

  // Ieliekam Calendar datus
  if (cache.calendar) {
    d.calendar = cache.calendar.calendar;
    if (cache.calendar.travel?.length) d.travel = cache.calendar.travel;
  }

  // Ieliekam ClickUp datus
  if (cache.clickup) {
    d.completedTasks = cache.clickup.completed.map(t => {
      const c = mapCompany(t.space || t.list);
      return { person: mapPerson(t.assignee), task: t.name, company: c.co, companyColor: c.cc };
    });
    d.overdueTasks = cache.clickup.overdue.map(t => {
      const c = mapCompany(t.space || t.list);
      return { person: mapPerson(t.assignee), task: t.name, company: c.co, companyColor: c.cc, daysLate: t.daysLate };
    });
    d.unassignedTasks = cache.clickup.unassigned.map(t => {
      const c = mapCompany(t.space || t.list);
      return { task: t.name, company: c.co, companyColor: c.cc, daysWaiting: t.daysWaiting };
    });
  }

  // ══════════════════════════
  // 2. CLAUDE AI analīze (ik stundu pēc grafika, ~$0.06)
  // ══════════════════════════
  if (shouldCallClaude() && (now - cache.lastClaude > fiftyMin) && cache.gmail?.recent?.length) {
    console.log('[Dashboard] Claude analīze...');
    const ai = await analyzeEmails(cache.gmail.recent);
    if (ai) {
      cache.claudeAI = ai;
      cache.lastClaude = now;
      // Pieliekam AI ieteikumus e-pastiem
      d.emailsRecent = cache.gmail.recent.map(e => {
        const a = ai.find(x => x.subject === e.subject);
        return { ...e, summary: a?.summary || e.snippet, suggestion: a?.suggestion || 'Izlasi un izlemj', urgent: a?.urgent || false };
      });
    }
  }

  // ══════════════════════════
  // 3. SHEETS + ANALYTICS (bezmaksas)
  // ══════════════════════════
  const sheets = await fetchSheetsData();
  if (sheets?.social) d.social = sheets.social;
  if (sheets?.arena) d.arena = sheets.arena;

  const analytics = await fetchAnalyticsData();
  if (analytics) d.analytics = analytics;

  // ══════════════════════════
  // STATUS
  // ══════════════════════════
  const src = [];
  if (cache.gmail) src.push('gmail');
  if (cache.calendar) src.push('cal');
  if (cache.clickup) src.push('clickup');
  if (cache.claudeAI) src.push('ai');
  d.source = src.length ? `live: ${src.join('+')}` : 'mock';
  d.lastUpdated = new Date().toISOString();

  return Response.json(d);
}

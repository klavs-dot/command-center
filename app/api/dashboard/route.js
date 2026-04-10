// app/api/dashboard/route.js
import { fetchCalendarData } from '@/lib/calendar-fetcher';
import { fetchClickUpData, mapCompany, mapPerson } from '@/lib/clickup-fetcher';
import { fetchSheetsData } from '@/lib/sheets-fetcher';
import { fetchAnalyticsData } from '@/lib/analytics-fetcher';
import { getMockData } from '@/lib/mock-data';

let cache = { calendar: null, clickup: null, lastFetch: 0 };

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET() {
  const mock = getMockData();
  let d = { ...mock, source: 'mock' };
  const now = Date.now();
  const fiveMin = 5 * 60 * 1000;

  // ══════════════════════════
  // 1. CALENDAR + CLICKUP (ik 5 min, bezmaksas)
  // ══════════════════════════
  if (now - cache.lastFetch > fiveMin) {
    const cal = await fetchCalendarData();
    if (cal) cache.calendar = cal;

    const clickup = await fetchClickUpData();
    if (clickup) cache.clickup = clickup;

    cache.lastFetch = now;
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
      const person = t.assignee ? mapPerson(t.assignee) : mapPerson(t.creator);
      const taskName = t.description ? `${t.name}: ${t.description}` : t.name;
      return { person, task: taskName, company: c.co, companyColor: c.cc };
    });
    d.overdueTasks = cache.clickup.overdue.map(t => {
      const c = mapCompany(t.space || t.list);
      const person = t.assignee ? mapPerson(t.assignee) : mapPerson(t.creator);
      return { person, task: t.name, company: c.co, companyColor: c.cc, daysLate: t.daysLate };
    });
    d.unassignedTasks = cache.clickup.unassigned.map(t => {
      const c = mapCompany(t.space || t.list);
      return { task: t.name, company: c.co, companyColor: c.cc, daysWaiting: t.daysWaiting };
    });
  }

  // ══════════════════════════
  // 2. SHEETS + ANALYTICS (bezmaksas)
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
  if (cache.calendar) src.push('cal');
  if (cache.clickup) src.push('clickup');
  d.source = src.length ? `live: ${src.join('+')}` : 'mock';
  d.lastUpdated = new Date().toISOString();

  return Response.json(d);
}

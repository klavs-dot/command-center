// app/api/dashboard/route.js
import { fetchCalendarData } from '@/lib/calendar-fetcher';
import { fetchAsanaData, mapProject, shortName } from '@/lib/asana-fetcher';
import { getMockData } from '@/lib/mock-data';

let cache = { calendar: null, asana: null, lastFetch: 0 };

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET() {
  const mock = getMockData();
  let d = { ...mock, source: 'mock' };
  const now = Date.now();
  const fiveMin = 5 * 60 * 1000;

  // ══════════════════════════
  // CALENDAR + ASANA (ik 5 min)
  // ══════════════════════════
  if (now - cache.lastFetch > fiveMin) {
    console.log('[Route] Fetching fresh data...');
    console.log('[Route] ASANA_ACCESS_TOKEN:', process.env.ASANA_ACCESS_TOKEN ? `set (${process.env.ASANA_ACCESS_TOKEN.substring(0, 10)}...)` : 'NOT SET');
    
    const cal = await fetchCalendarData();
    if (cal) cache.calendar = cal;

    const asana = await fetchAsanaData();
    console.log('[Route] Asana result:', asana ? `${asana.completed?.length} completed, ${asana.overdue?.length} overdue` : 'null');
    if (asana) cache.asana = asana;

    cache.lastFetch = now;
  }

  // Calendar
  if (cache.calendar) {
    d.calendar = cache.calendar.calendar;
    if (cache.calendar.travel?.length) d.travel = cache.calendar.travel;
  }

  // Asana
  if (cache.asana) {
    d.completedTasks = cache.asana.completed.map(t => {
      const p = mapProject(t.project);
      return { person: shortName(t.assignee), task: t.name, notes: t.notes, section: t.section, company: p.co, companyColor: p.cc, completedAt: t.completedAt };
    });
    d.overdueTasks = cache.asana.overdue.map(t => {
      const p = mapProject(t.project);
      return { person: shortName(t.assignee), task: t.name, company: p.co, companyColor: p.cc, daysLate: t.daysLate, section: t.section };
    });
    d.unassignedTasks = cache.asana.unassigned.map(t => {
      const p = mapProject(t.project);
      return { task: t.name, company: p.co, companyColor: p.cc, dueDate: t.dueDate, section: t.section };
    });
    d.upcomingTasks = cache.asana.upcoming.map(t => {
      const p = mapProject(t.project);
      return { person: shortName(t.assignee), task: t.name, company: p.co, companyColor: p.cc, dueDate: t.dueDate, section: t.section };
    });
    d.stats = {
      totalActive: cache.asana.totalActive,
      totalCompleted: cache.asana.totalCompleted,
      monthStats: cache.asana.monthStats,
      projectNames: cache.asana.projectNames,
    };
  }

  // STATUS
  const src = [];
  if (cache.calendar) src.push('cal');
  if (cache.asana) src.push('asana');
  d.source = src.length ? `live: ${src.join('+')}` : 'mock';
  d.lastUpdated = new Date().toISOString();

  return Response.json(d);
}

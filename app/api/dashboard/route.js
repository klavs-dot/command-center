// app/api/dashboard/route.js
import { fetchCalendarData } from '@/lib/calendar-fetcher';
import { fetchAsanaData, mapProject, shortName } from '@/lib/asana-fetcher';
import { getMockData } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET() {
  const mock = getMockData();
  let d = { ...mock, source: 'mock' };

  // ══════════════════════════
  // ALWAYS FRESH — nav cache, katru reizi svaigi dati
  // ══════════════════════════
  const [cal, asana] = await Promise.all([
    fetchCalendarData(),
    fetchAsanaData(),
  ]);

  // Calendar
  if (cal) {
    d.calendar = cal.calendar;
    if (cal.travel?.length) d.travel = cal.travel;
  }

  // Asana
  if (asana) {
    d.completedTasks = asana.completed.map(t => {
      const p = mapProject(t.project);
      return { person: shortName(t.assignee), task: t.name, notes: t.notes, section: t.section, company: p.co, companyColor: p.cc, completedAt: t.completedAt };
    });
    d.overdueTasks = asana.overdue.map(t => {
      const p = mapProject(t.project);
      return { person: shortName(t.assignee), task: t.name, company: p.co, companyColor: p.cc, daysLate: t.daysLate, section: t.section };
    });
    d.unassignedTasks = asana.unassigned.map(t => {
      const p = mapProject(t.project);
      return { task: t.name, company: p.co, companyColor: p.cc, dueDate: t.dueDate, section: t.section };
    });
    d.upcomingTasks = asana.upcoming.map(t => {
      const p = mapProject(t.project);
      return { person: shortName(t.assignee), task: t.name, company: p.co, companyColor: p.cc, dueDate: t.dueDate, section: t.section };
    });
    d.events = asana.events.map(t => {
      const p = mapProject(t.project);
      return { task: t.name, assignee: shortName(t.assignee), dueDate: t.dueDate, company: p.co, companyColor: p.cc };
    });
    d.stats = {
      totalActive: asana.totalActive,
      totalCompleted: asana.totalCompleted,
      monthStats: asana.monthStats,
      projectNames: asana.projectNames,
    };
  }

  // STATUS
  const src = [];
  if (cal) src.push('cal');
  if (asana) src.push('asana');
  d.source = src.length ? `live: ${src.join('+')}` : 'mock';
  d.lastUpdated = new Date().toISOString();

  return Response.json(d);
}

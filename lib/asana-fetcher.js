// lib/asana-fetcher.js

const BASE = 'https://app.asana.com/api/1.0';
const FIELDS = 'name,completed,completed_at,assignee,assignee.name,due_on,memberships.section.name,notes,created_at';

async function api(path, token) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      console.error(`[Asana] ${res.status} ${path}`);
      return null;
    }
    return (await res.json()).data;
  } catch (e) {
    console.error(`[Asana] Error:`, e.message);
    return null;
  }
}

export async function fetchAsanaData() {
  const token = process.env.ASANA_ACCESS_TOKEN;
  if (!token) { console.log('[Asana] Nav token'); return null; }

  try {
    // 1. Workspaces
    const ws = await api('/workspaces', token);
    if (!ws?.length) return null;

    // 2. Projects
    const projects = await api(`/workspaces/${ws[0].gid}/projects?opt_fields=name,archived&limit=50`, token);
    if (!projects) return null;

    const active = [];
    const completed = [];
    const projectNames = [];
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Mēneša stats
    const monthNames = ['janvārī','februārī','martā','aprīlī','maijā','jūnijā','jūlijā','augustā','septembrī','oktobrī','novembrī','decembrī'];
    const thisMonthStart = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01T00:00:00Z`;
    const lastMonth = new Date(now.getFullYear(), now.getMonth()-1, 1);
    const lastMonthStart = lastMonth.toISOString();
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();
    let lmCreated=0, lmDone=0, tmCreated=0, tmDone=0;

    for (const proj of projects.filter(p => !p.archived)) {
      projectNames.push(proj.name);

      // Visi aktīvie uzdevumi
      const tasks = await api(`/projects/${proj.gid}/tasks?opt_fields=${FIELDS}&limit=100`, token);
      if (!tasks) continue;

      console.log(`[Asana] Project "${proj.name}": ${tasks.length} tasks`);

      for (const t of tasks) {
        const sec = t.memberships?.[0]?.section?.name || '';
        const assigneeName = t.assignee?.name || null;
        const obj = {
          id: t.gid, name: t.name, completed: !!t.completed,
          completedAt: t.completed_at, assignee: assigneeName,
          dueDate: t.due_on, section: sec, project: proj.name,
          notes: (t.notes||'').substring(0,120), createdAt: t.created_at,
        };

        if (t.completed) {
          completed.push(obj);
          if (t.completed_at >= thisMonthStart) tmDone++;
          if (t.completed_at >= lastMonthStart && t.completed_at <= lastMonthEnd) lmDone++;
        } else {
          active.push(obj);
        }

        if (t.created_at >= thisMonthStart) tmCreated++;
        if (t.created_at >= lastMonthStart && t.created_at <= lastMonthEnd) lmCreated++;
      }

      // Nesen pabeigti (30d)
      const since = new Date(now - 30*86400000).toISOString();
      const done = await api(`/projects/${proj.gid}/tasks?completed_since=${since}&opt_fields=${FIELDS}&limit=100`, token);
      if (done) {
        for (const t of done) {
          if (t.completed && !completed.find(c => c.id === t.gid)) {
            completed.push({
              id: t.gid, name: t.name, completed: true,
              completedAt: t.completed_at, assignee: t.assignee?.name || null,
              dueDate: t.due_on, section: t.memberships?.[0]?.section?.name || '',
              project: proj.name, notes: (t.notes||'').substring(0,120), createdAt: t.created_at,
            });
            if (t.completed_at >= thisMonthStart) tmDone++;
            if (t.completed_at >= lastMonthStart && t.completed_at <= lastMonthEnd) lmDone++;
            if (t.created_at >= thisMonthStart) tmCreated++;
            if (t.created_at >= lastMonthStart && t.created_at <= lastMonthEnd) lmCreated++;
          }
        }
      }
    }

    // Sort completed newest first
    completed.sort((a,b) => new Date(b.completedAt||0) - new Date(a.completedAt||0));

    // Overdue
    const overdue = active
      .filter(t => t.dueDate && t.dueDate < today)
      .map(t => ({ ...t, daysLate: Math.max(1, Math.ceil((Date.now() - new Date(t.dueDate).getTime())/86400000)) }))
      .sort((a,b) => b.daysLate - a.daysLate);

    // Unassigned
    const unassigned = active
      .filter(t => !t.assignee)
      .sort((a,b) => (a.dueDate||'z').localeCompare(b.dueDate||'z'));

    // Upcoming = ALL active with assignee
    const upcoming = active
      .filter(t => t.assignee)
      .sort((a,b) => (a.dueDate||'z').localeCompare(b.dueDate||'z'));

    // Events = Pasākumi section
    const events = active
      .filter(t => {
        const s = (t.section||'').toLowerCase();
        return s.includes('pasāk') || s.includes('pasak');
      })
      .filter(t => t.dueDate && t.dueDate >= today)
      .sort((a,b) => a.dueDate.localeCompare(b.dueDate));

    // Log per-person counts
    const byPerson = {};
    for (const t of upcoming) { byPerson[t.assignee] = (byPerson[t.assignee]||0)+1; }
    console.log(`[Asana] Active: ${active.length}, Completed: ${completed.length}, Upcoming by person:`, byPerson);

    return {
      completed: completed.slice(0,15),
      overdue: overdue.slice(0,15),
      unassigned: unassigned.slice(0,15),
      upcoming: upcoming.slice(0,30),
      events: events.slice(0,10),
      totalActive: active.length,
      totalCompleted: completed.length,
      projectNames,
      monthStats: {
        lastMonthName: monthNames[(now.getMonth()-1+12)%12],
        lastMonthCreated: lmCreated, lastMonthCompleted: lmDone,
        thisMonthName: monthNames[now.getMonth()],
        thisMonthCreated: tmCreated, thisMonthCompleted: tmDone,
      },
    };
  } catch(e) { console.error('[Asana]', e); return null; }
}

export function mapProject(name) {
  const n = (name||'').toLowerCase();
  if (n.includes('visit') || n.includes('liepaj')) return {co:'VL',cc:'#64d2ff'};
  if (n.includes('drift') || n.includes('arena')) return {co:'DA',cc:'#ff375f'};
  if (n.includes('mosph')) return {co:'MO',cc:'#bf5af2'};
  if (n.includes('wolf') || n.includes('gwm')) return {co:'GWM',cc:'#30d158'};
  return {co:'??',cc:'#636366'};
}

export function shortName(full) {
  if (!full) return '—';
  let n = full.includes('@') ? full.split('@')[0] : full.split(' ')[0];
  return n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();
}

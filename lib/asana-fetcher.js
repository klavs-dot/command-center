// lib/asana-fetcher.js

const ASANA_BASE = 'https://app.asana.com/api/1.0';

async function asanaFetch(path, token) {
  const res = await fetch(`${ASANA_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) { console.error(`[Asana] ${res.status} ${path}`); return null; }
  return (await res.json()).data;
}

export async function fetchAsanaData() {
  const token = process.env.ASANA_ACCESS_TOKEN;
  if (!token || token === 'xxxxx') { console.log('[Asana] Nav konfigurēts'); return null; }

  try {
    const workspaces = await asanaFetch('/workspaces', token);
    if (!workspaces?.length) throw new Error('Nav workspace');
    const workspaceId = workspaces[0].gid;

    const projects = await asanaFetch(`/workspaces/${workspaceId}/projects?opt_fields=name,color,archived&limit=50`, token);
    if (!projects) throw new Error('Nav projektu');

    const allTasks = [];
    const completedTasks = [];
    const projectNames = [];
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

    // Mēneša nosaukumi latviski
    const monthNames = ['janvārī', 'februārī', 'martā', 'aprīlī', 'maijā', 'jūnijā', 'jūlijā', 'augustā', 'septembrī', 'oktobrī', 'novembrī', 'decembrī'];
    const lastMonthName = monthNames[(now.getMonth() - 1 + 12) % 12];
    const thisMonthName = monthNames[now.getMonth()];

    let lastMonthCreated = 0, lastMonthCompleted = 0;
    let thisMonthCreated = 0, thisMonthCompleted = 0;

    for (const project of projects.filter(p => !p.archived)) {
      projectNames.push(project.name);

      // Aktīvie uzdevumi
      const tasks = await asanaFetch(
        `/projects/${project.gid}/tasks?opt_fields=name,completed,completed_at,assignee.name,due_on,start_on,memberships.section.name,notes,created_at&limit=100`,
        token
      );
      if (!tasks) continue;

      for (const t of tasks) {
        const section = t.memberships?.[0]?.section?.name || '';
        const task = {
          id: t.gid, name: t.name, completed: t.completed, completedAt: t.completed_at,
          assignee: t.assignee?.name || null, dueDate: t.due_on, section,
          project: project.name, notes: (t.notes || '').substring(0, 120),
          createdAt: t.created_at,
        };

        console.log(`[Asana] Task: "${t.name}" assignee=${t.assignee?.name || 'none'} completed=${t.completed} section="${section}"`);

        if (t.completed && t.completed_at) {
          completedTasks.push(task);
        } else if (!t.completed) {
          allTasks.push(task);
        }

        // Mēneša statistika
        if (t.created_at >= thisMonthStart) thisMonthCreated++;
        if (t.created_at >= lastMonthStart && t.created_at <= lastMonthEnd) lastMonthCreated++;
        if (t.completed_at && t.completed_at >= thisMonthStart) thisMonthCompleted++;
        if (t.completed_at && t.completed_at >= lastMonthStart && t.completed_at <= lastMonthEnd) lastMonthCompleted++;
      }

      // Nesen pabeigti (30 dienas)
      const thirtyDaysAgo = new Date(now - 30 * 86400000).toISOString();
      const recentCompleted = await asanaFetch(
        `/projects/${project.gid}/tasks?completed_since=${thirtyDaysAgo}&opt_fields=name,completed,completed_at,assignee.name,due_on,memberships.section.name,notes,created_at&limit=50`,
        token
      );
      if (recentCompleted) {
        for (const t of recentCompleted) {
          if (t.completed && t.completed_at && !completedTasks.find(c => c.id === t.gid)) {
            completedTasks.push({
              id: t.gid, name: t.name, completed: true, completedAt: t.completed_at,
              assignee: t.assignee?.name || null, dueDate: t.due_on,
              section: t.memberships?.[0]?.section?.name || '', project: project.name,
              notes: (t.notes || '').substring(0, 120), createdAt: t.created_at,
            });
            if (t.completed_at >= thisMonthStart) thisMonthCompleted++;
            if (t.completed_at >= lastMonthStart && t.completed_at <= lastMonthEnd) lastMonthCompleted++;
            if (t.created_at >= thisMonthStart) thisMonthCreated++;
            if (t.created_at >= lastMonthStart && t.created_at <= lastMonthEnd) lastMonthCreated++;
          }
        }
      }
    }

    completedTasks.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

    const today = new Date().toISOString().split('T')[0];
    const nowMs = Date.now();

    const overdue = allTasks
      .filter(t => t.dueDate && t.dueDate < today)
      .map(t => ({ ...t, daysLate: Math.max(1, Math.ceil((nowMs - new Date(t.dueDate).getTime()) / 86400000)) }))
      .sort((a, b) => b.daysLate - a.daysLate);

    const unassigned = allTasks
      .filter(t => !t.assignee)
      .sort((a, b) => (a.dueDate || 'z').localeCompare(b.dueDate || 'z'));

    const upcoming = allTasks
      .filter(t => t.assignee)
      .sort((a, b) => (a.dueDate || 'z').localeCompare(b.dueDate || 'z'));

    console.log(`[Asana] Upcoming by person:`, upcoming.reduce((acc, t) => { acc[t.assignee] = (acc[t.assignee]||0)+1; return acc; }, {}));

    // Events — uzdevumi "Pasākum" sekcijā, sorted by due date
    const events = allTasks
      .filter(t => {
        const sec = (t.section || '').toLowerCase();
        return sec.includes('pasāk') || sec.includes('pasak');
      })
      .filter(t => t.dueDate && t.dueDate >= today)
      .sort((a, b) => (a.dueDate || 'z').localeCompare(b.dueDate || 'z'));

    console.log(`[Asana] ${allTasks.length} aktīvi, ${completedTasks.length} pabeigti, ${overdue.length} kavējas, ${events.length} pasākumi`);

    return {
      completed: completedTasks.slice(0, 15),
      overdue: overdue.slice(0, 15),
      unassigned: unassigned.slice(0, 15),
      upcoming: upcoming.slice(0, 30),
      events: events.slice(0, 10),
      totalActive: allTasks.length,
      totalCompleted: completedTasks.length,
      projectNames,
      monthStats: {
        lastMonthName, lastMonthCreated, lastMonthCompleted,
        thisMonthName, thisMonthCreated, thisMonthCompleted,
      },
    };
  } catch (e) { console.error('[Asana]', e); return null; }
}

export function mapProject(projectName) {
  const n = (projectName || '').toLowerCase();
  if (n.includes('visit') || n.includes('liepaj') || n.includes('vl')) return { co: 'VL', cc: '#64d2ff' };
  if (n.includes('drift') || n.includes('arena') || n.includes('da')) return { co: 'DA', cc: '#ff375f' };
  if (n.includes('mosph') || n.includes('mo')) return { co: 'MO', cc: '#bf5af2' };
  if (n.includes('wolf') || n.includes('gwm') || n.includes('motor')) return { co: 'GWM', cc: '#30d158' };
  if (n.includes('global drift')) return { co: 'GDA', cc: '#ff9f0a' };
  return { co: '??', cc: '#636366' };
}

export function shortName(fullName) {
  if (!fullName) return '—';
  // Ja ir e-pasts, ņemam vārdu pirms @
  let name = fullName;
  if (name.includes('@')) name = name.split('@')[0];
  // Ņemam pirmo vārdu
  const first = name.split(/[\s.]+/)[0];
  // Capitalize
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

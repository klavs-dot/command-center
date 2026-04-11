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
    // 1. Dabūjam workspace
    const workspaces = await asanaFetch('/workspaces', token);
    if (!workspaces?.length) throw new Error('Nav workspace');
    const workspaceId = workspaces[0].gid;

    // 2. Dabūjam visus projektus
    const projects = await asanaFetch(`/workspaces/${workspaceId}/projects?opt_fields=name,color,archived&limit=50`, token);
    if (!projects) throw new Error('Nav projektu');

    const allTasks = [];
    const completedTasks = [];
    const now = Date.now();
    const sevenDaysAgo = new Date(now - 7 * 86400000).toISOString();

    for (const project of projects.filter(p => !p.archived)) {
      // 3. Dabūjam aktīvos uzdevumus
      const tasks = await asanaFetch(
        `/projects/${project.gid}/tasks?opt_fields=name,completed,completed_at,assignee.name,due_on,start_on,memberships.section.name,notes&limit=100`,
        token
      );
      if (!tasks) continue;

      for (const t of tasks) {
        const section = t.memberships?.[0]?.section?.name || '';
        const task = {
          id: t.gid,
          name: t.name,
          completed: t.completed,
          completedAt: t.completed_at,
          assignee: t.assignee?.name || null,
          dueDate: t.due_on,
          section: section,
          project: project.name,
          notes: (t.notes || '').substring(0, 120),
        };

        if (t.completed && t.completed_at) {
          completedTasks.push(task);
        } else if (!t.completed) {
          allTasks.push(task);
        }
      }

      // 4. Dabūjam nesen pabeigtos (pēdējās 7 dienas)
      const recentCompleted = await asanaFetch(
        `/projects/${project.gid}/tasks?completed_since=${sevenDaysAgo}&opt_fields=name,completed,completed_at,assignee.name,due_on,memberships.section.name,notes&limit=50`,
        token
      );
      if (recentCompleted) {
        for (const t of recentCompleted) {
          if (t.completed && t.completed_at && !completedTasks.find(c => c.id === t.gid)) {
            completedTasks.push({
              id: t.gid,
              name: t.name,
              completed: true,
              completedAt: t.completed_at,
              assignee: t.assignee?.name || null,
              dueDate: t.due_on,
              section: t.memberships?.[0]?.section?.name || '',
              project: project.name,
              notes: (t.notes || '').substring(0, 120),
            });
          }
        }
      }
    }

    // Sortējam completed (jaunākie pirmie)
    completedTasks.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

    // Overdue: aktīvi uzdevumi ar pagājušu due_on
    const today = new Date().toISOString().split('T')[0];
    const overdue = allTasks
      .filter(t => t.dueDate && t.dueDate < today)
      .map(t => ({
        ...t,
        daysLate: Math.max(1, Math.ceil((now - new Date(t.dueDate).getTime()) / 86400000)),
      }))
      .sort((a, b) => b.daysLate - a.daysLate);

    // Unassigned: aktīvi bez assignee
    const unassigned = allTasks
      .filter(t => !t.assignee)
      .sort((a, b) => {
        if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
        if (a.dueDate) return -1;
        return 1;
      });

    // Upcoming: aktīvi ar assignee, nav overdue
    const upcoming = allTasks
      .filter(t => t.assignee && (!t.dueDate || t.dueDate >= today))
      .sort((a, b) => {
        if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
        if (a.dueDate) return -1;
        return 1;
      });

    // Grupējam pa sekcijām
    const sectionMap = {};
    for (const t of allTasks) {
      const s = t.section || 'Citi';
      if (!sectionMap[s]) sectionMap[s] = [];
      sectionMap[s].push(t);
    }

    console.log(`[Asana] ${allTasks.length} aktīvi, ${completedTasks.length} pabeigti, ${overdue.length} kavējas, ${unassigned.length} neuzņemti`);

    return {
      completed: completedTasks.slice(0, 15),
      overdue: overdue.slice(0, 15),
      unassigned: unassigned.slice(0, 15),
      upcoming: upcoming.slice(0, 15),
      sections: sectionMap,
      totalActive: allTasks.length,
      totalCompleted: completedTasks.length,
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
  const first = fullName.split(' ')[0];
  return first.length > 8 ? first.substring(0, 7) + '.' : first;
}

// lib/clickup-fetcher.js

export async function fetchClickUpData() {
  const token = process.env.CLICKUP_API_TOKEN;
  if (!token || token === 'pk_xxxxx') { console.log('[ClickUp] Nav konfigurēts'); return null; }

  const headers = { Authorization: token, 'Content-Type': 'application/json' };

  try {
    const teamsRes = await fetch('https://api.clickup.com/api/v2/team', { headers });
    if (!teamsRes.ok) throw new Error(`Teams: ${teamsRes.status}`);
    const teamId = (await teamsRes.json()).teams?.[0]?.id;
    if (!teamId) throw new Error('Nav team');

    const spacesRes = await fetch(`https://api.clickup.com/api/v2/team/${teamId}/space?archived=false`, { headers });
    const spacesData = await spacesRes.json();

    const allActive = [], allCompleted = [];

    for (const space of spacesData.spaces || []) {
      // Aktīvie
      const tRes = await fetch(
        `https://api.clickup.com/api/v2/team/${teamId}/task?space_ids[]=${space.id}&statuses[]=in%20progress&statuses[]=open&statuses[]=to%20do&include_closed=false&subtasks=true`,
        { headers }
      );
      if (tRes.ok) {
        for (const t of (await tRes.json()).tasks || []) {
          allActive.push({ id: t.id, name: t.name, status: t.status?.status,
            assignee: getInitials(t.assignees), dueDate: t.due_date ? new Date(parseInt(t.due_date)).toISOString() : null,
            space: space.name, list: t.list?.name || '', dateCreated: t.date_created });
        }
      }
      // Pabeigti
      const cRes = await fetch(
        `https://api.clickup.com/api/v2/team/${teamId}/task?space_ids[]=${space.id}&statuses[]=closed&statuses[]=complete&statuses[]=done&include_closed=true&order_by=date_closed&reverse=true&page=0`,
        { headers }
      );
      if (cRes.ok) {
        for (const t of ((await cRes.json()).tasks || []).slice(0, 20)) {
          allCompleted.push({ id: t.id, name: t.name, assignee: getInitials(t.assignees),
            space: space.name, list: t.list?.name || '', dateClosed: t.date_closed || t.date_updated });
        }
      }
    }

    allCompleted.sort((a, b) => (b.dateClosed || 0) - (a.dateClosed || 0));
    const now = Date.now();
    const overdue = allActive.filter(t => t.dueDate && new Date(t.dueDate).getTime() < now)
      .map(t => ({ ...t, daysLate: Math.max(1, Math.ceil((now - new Date(t.dueDate).getTime()) / 86400000)) }))
      .sort((a, b) => b.daysLate - a.daysLate);

    const unassigned = allActive.filter(t => !t.assignee)
      .map(t => ({ ...t, daysWaiting: Math.max(1, Math.ceil((now - parseInt(t.dateCreated)) / 86400000)) }))
      .sort((a, b) => b.daysWaiting - a.daysWaiting);

    console.log(`[ClickUp] ${allActive.length} aktīvi, ${allCompleted.length} pabeigti, ${overdue.length} kavējas`);
    return { completed: allCompleted.slice(0, 10), overdue: overdue.slice(0, 10), unassigned: unassigned.slice(0, 10) };
  } catch (e) { console.error('[ClickUp]', e); return null; }
}

function getInitials(assignees) {
  if (!assignees?.length) return null;
  const name = assignees[0].username || assignees[0].email || '';
  return name.substring(0, 2).toUpperCase();
}

export function mapCompany(spaceName) {
  const n = (spaceName||'').toLowerCase();
  if (n.includes('visit') || n.includes('liepaj') || n.includes('vl')) return { co: 'VL', cc: '#00e8fc' };
  if (n.includes('drift') || n.includes('arena') || n.includes('da')) return { co: 'DA', cc: '#ff2d78' };
  if (n.includes('mosph') || n.includes('mo')) return { co: 'MO', cc: '#a064ff' };
  if (n.includes('wolf') || n.includes('gwm') || n.includes('motor')) return { co: 'GWM', cc: '#00e8fc' };
  return { co: '??', cc: '#405080' };
}

export function mapPerson(initials) {
  const i = (initials||'').toUpperCase();
  if (i.includes('PA') || i.includes('PL')) return 'PA';
  if (i.includes('EL') || i.includes('EB')) return 'EL';
  if (i.includes('KL') || i.includes('KA') || i.includes('KĀ')) return 'KĀ';
  return i || '??';
}

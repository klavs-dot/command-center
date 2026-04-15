// app/page.js
import { getMockData } from '@/lib/mock-data';
import { formatRigaTime, formatRigaDate } from '@/lib/schedule';

export const dynamic = 'force-dynamic';

async function getDashboardData() {
  try {
    const url = process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}/api/dashboard`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}/api/dashboard`
        : 'http://localhost:3000/api/dashboard';
    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) return res.json();
  } catch (e) { console.log('API:', e.message); }
  return getMockData();
}

const C = {
  bg: '#0a0a0a', card: '#1c1c1e', border: 'rgba(255,255,255,0.06)',
  text: '#f5f5f7', text2: 'rgba(255,255,255,0.6)', text3: 'rgba(255,255,255,0.3)',
  blue: '#0a84ff', green: '#30d158', red: '#ff375f', orange: '#ff9f0a', purple: '#bf5af2', teal: '#64d2ff', yellow: '#ffd60a',
};

const PEOPLE = { 'Klāvs': '#0a84ff', 'Elizabete': '#ff9f0a', 'Paula': '#bf5af2', 'Intars': '#30d158' };

function daysUntilStr(d) { if(!d)return''; const x=Math.ceil((new Date(d)-new Date())/864e5); return x<0?`${Math.abs(x)}d kavē`:x===0?'šodien':x===1?'rīt':`${x}d`; }
function daysColor(d) { if(!d)return C.text3; const x=Math.ceil((new Date(d)-new Date())/864e5); return x<0?C.red:x===0?C.orange:x<=3?C.yellow:C.green; }

function matchPerson(p) {
  const low = (p||'').toLowerCase();
  for (const name of Object.keys(PEOPLE)) {
    const m = name.toLowerCase();
    if (low.startsWith(m) || low.includes(m)) return name;
  }
  return null;
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  const time = formatRigaTime();
  const dateStr = formatRigaDate();
  const isLive = data.source?.includes('live');
  const stats = data.stats || {};
  const ms = stats.monthStats || {};
  const projectName = (stats.projectNames || [])[0] || 'NNKBV Ofiss';

  const upcoming = data.upcomingTasks || [];
  const personTasks = {};
  for (const name of Object.keys(PEOPLE)) personTasks[name] = [];

  for (const t of upcoming) {
    const owner = matchPerson(t.person);
    if (owner) personTasks[owner].push(t);
    for (const sub of (t.subtasks || [])) {
      const subOwner = matchPerson(sub.assignee);
      if (subOwner && subOwner !== owner) {
        if (!personTasks[subOwner].find(x => x._parentId === t.task && x._subName === sub.name)) {
          personTasks[subOwner].push({ ...t, _isSubRef: true, _parentId: t.task, _subName: sub.name, _subDueDate: sub.dueDate, subtasks: [sub] });
        }
      }
    }
  }

  const sortedPeople = Object.entries(personTasks).sort((a, b) => b[1].length - a[1].length);

  return (
    <div style={{ width: '100%', minHeight: '100vh', fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif", background: C.bg, display: 'flex', flexDirection: 'column' }}>

      {/* ══ TOP BAR ══ */}
      <div className="dash-header" style={{ padding: '12px 35px', background: C.card, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div className="dash-header-left">
          <span id="clock" className="dash-clock" style={{ fontWeight: 700, color: C.text, letterSpacing: -1 }}>{time}</span>
          <span style={{ fontSize: 15, color: C.text3, fontWeight: 500 }}>{dateStr}</span>
          <span className="live-badge" style={{ fontSize: 12.5, color: isLive ? C.green : C.red, fontWeight: 600, background: isLive ? 'rgba(48,209,88,0.12)' : 'rgba(255,55,95,0.12)', padding: '2.5px 12.5px', borderRadius: 50, display: 'flex', alignItems: 'center', gap: 7.5 }}>
            <span className="live-dot" style={{ width: 10, height: 10, borderRadius: '50%', background: isLive ? C.green : C.red, display: 'inline-block' }} />
            {isLive ? 'LIVE' : 'MOCK'}
          </span>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.teal, background: 'rgba(100,210,255,0.1)', padding: '5px 20px', borderRadius: 6, border: '1px solid rgba(100,210,255,0.2)' }}>{projectName}</span>
        </div>
        <div className="dash-header-right">
          <div className="dash-stats">
            <span className="dash-stats-small" style={{ color: C.text2 }}>
              Pagājušajā mēnesī <span style={{ color: C.orange, fontWeight: 700 }}>{ms.lastMonthName || '—'}</span> tika izveidoti <span style={{ fontWeight: 700, color: C.text }}>{ms.lastMonthCreated || 0}</span> uzdevumi un <span style={{ fontWeight: 700, color: C.green }}>{ms.lastMonthCompleted || 0}</span> padarīti.
            </span>
            <span className="dash-stats-big" style={{ color: C.text, fontWeight: 600 }}>
              Šomēnes mums jau ir <span style={{ fontWeight: 800, color: C.blue }}>{ms.thisMonthCreated || 0}</span> uzdevumi un jau <span style={{ fontWeight: 800, color: C.green }}>{ms.thisMonthCompleted || 0}</span> esam izdarījuši.
            </span>
          </div>
          <button id="fs-btn" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: C.text2, fontSize: 12.5, fontWeight: 600, padding: '7.5px 20px', borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap' }}>⛶ Full Screen</button>
        </div>
      </div>

      {/* ══ 3 COLUMNS (responsive) ══ */}
      <div className="dash-grid">

        {/* COL 1: PASĀKUMI */}
        <div className="dash-col">
          <ColHeader t="Pasākumi" emoji="🎪" c={C.purple} count={(data.events || []).length} />
          {(data.events || []).length === 0 && <div style={{ fontSize: 12.5, color: C.text3 }}>Nav tuvāko pasākumu</div>}
          {(data.events || []).map((ev, i) => {
            const d = new Date(ev.dueDate);
            const days = ['Svētdiena','Pirmdiena','Otrdiena','Trešdiena','Ceturtdiena','Piektdiena','Sestdiena'];
            const months = ['janv.','febr.','marts','apr.','maijs','jūn.','jūl.','aug.','sept.','okt.','nov.','dec.'];
            const daysUntil = Math.ceil((d - new Date()) / 864e5);
            const urg = daysUntil <= 3 ? C.red : daysUntil <= 7 ? C.orange : daysUntil <= 14 ? C.yellow : C.green;
            const name = ev.task.replace(/^PASĀKUMS[\s-]*/i, '');
            return (
              <div key={i} style={{ background: C.card, borderRadius: 15, padding: '10px 12.5px', marginBottom: 7.5, borderLeft: `3px solid ${urg}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2.5 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: urg, textTransform: 'uppercase' }}>{days[d.getDay()]}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: urg, background: `${urg}20`, padding: '1px 7.5px', borderRadius: 25 }}>{daysUntil}d</span>
                </div>
                <div style={{ fontSize: 11, color: C.text3, marginBottom: 2.5 }}>{d.getDate()}. {months[d.getMonth()]}</div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: C.text, lineHeight: 1.3 }}>{name}</div>
                {ev.assignee && ev.assignee !== '—' && <div style={{ fontSize: 10, color: C.text3, marginTop: 2.5 }}>{ev.assignee}</div>}
              </div>
            );
          })}
        </div>

        {/* COL 2: UZŅEMTIE */}
        <div className="dash-col" style={{ borderLeft: `1px solid ${C.border}` }}>
          <ColHeader t="Uzņemtie" emoji="👥" c={C.blue} count={upcoming.length} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sortedPeople.map(([name, tasks]) => {
              const color = PEOPLE[name];
              return (
                <div key={name}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7.5, marginBottom: 5 }}>
                    <span style={{ width: 17.5, height: 17.5, borderRadius: '50%', background: `${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color, border: `1px solid ${color}40` }}>{name[0]}</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color }}>{name}</span>
                    <span style={{ fontSize: 11, color: C.text3 }}>{tasks.length === 0 ? 'nav uzdevumu' : tasks.length}</span>
                  </div>
                  {tasks.length === 0 && <div style={{ fontSize: 11, color: C.text3, paddingLeft: 25 }}>—</div>}
                  {tasks.map((t, i) => (
                    <div key={i}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, paddingLeft: 25, fontSize: 12.5, padding: '2.5px 0 2.5px 25px' }}>
                        <span style={{ color: daysColor(t.dueDate), fontSize: 10 }}>●</span>
                        <span style={{ color: t._isSubRef ? C.text3 : C.text, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontStyle: t._isSubRef ? 'italic' : 'normal' }}>{t.task}</span>
                        <Pill t={t.company} c={t.companyColor} />
                        <span style={{ color: daysColor(t.dueDate), fontSize: 11, fontWeight: 600, minWidth: 25, textAlign: 'right', flexShrink: 0 }}>{daysUntilStr(t.dueDate)}</span>
                      </div>
                      {(t.subtasks || []).filter(s => matchPerson(s.assignee) === name).map((s, si) => (
                        <div key={si} style={{ display: 'flex', alignItems: 'center', gap: 5, paddingLeft: 40, fontSize: 11, padding: '1px 0 1px 40px' }}>
                          <span style={{ color: C.text3, fontSize: 9 }}>↳</span>
                          <span style={{ color: C.text2, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</span>
                          {s.dueDate && <span style={{ color: daysColor(s.dueDate), fontSize: 10, fontWeight: 600, flexShrink: 0 }}>{daysUntilStr(s.dueDate)}</span>}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* COL 3: NEUZŅEMTIE + KAVĒJAS + PADARĪTIE */}
        <div className="dash-col-right" style={{ borderLeft: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column' }}>

          {/* NEUZŅEMTIE */}
          <ColHeader t="Neuzņemtie" emoji="⚠️" c={C.orange} count={(data.unassignedTasks || []).length} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2.5, marginBottom: 10 }}>
            {(data.unassignedTasks || []).slice(0, 8).map((task, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13.5, padding: '3.5px 0' }}>
                <span style={{ color: C.orange, fontWeight: 700, fontSize: 12.5, minWidth: 10 }}>?</span>
                <span style={{ color: C.text2, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.task}</span>
                <Pill t={task.company} c={task.companyColor} />
                <span style={{ color: daysColor(task.dueDate), fontSize: 11, fontWeight: 600, minWidth: 20, textAlign: 'right', flexShrink: 0 }}>{daysUntilStr(task.dueDate)}</span>
              </div>
            ))}
          </div>

          {/* KAVĒJAS */}
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, marginBottom: 10 }}>
            <ColHeader t="Kavējas" emoji="🔥" c={C.red} count={(data.overdueTasks || []).length} />
            {(data.overdueTasks || []).length === 0 && <div style={{ fontSize: 12.5, color: C.text3 }}>Nav kavētu uzdevumu 🎉</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {(data.overdueTasks || []).slice(0, 8).map((task, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13.5, padding: '3.5px 0' }}>
                  <span style={{ color: C.red, fontWeight: 700, fontSize: 12.5, minWidth: 10 }}>!</span>
                  <span style={{ color: task.daysLate >= 4 ? C.red : C.orange, minWidth: 30, fontWeight: 600, fontSize: 12.5 }}>{task.person || '—'}</span>
                  <span style={{ color: C.text, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.task}</span>
                  <Pill t={task.company} c={task.companyColor} />
                  <span style={{ color: C.red, fontSize: 11, fontWeight: 700, minWidth: 20, textAlign: 'right', flexShrink: 0 }}>-{task.daysLate}d</span>
                </div>
              ))}
            </div>
          </div>

          {/* PADARĪTIE */}
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
            <ColHeader t="Padarītie" emoji="✅" c={C.green} count={(data.completedTasks || []).length} />
            {(data.completedTasks || []).length === 0 && <div style={{ fontSize: 12.5, color: C.text3 }}>Nav pabeigtu uzdevumu</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {(data.completedTasks || []).slice(0, 35).map((task, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, padding: '2.5px 0' }}>
                  <span style={{ color: C.green, fontWeight: 600, minWidth: 10 }}>✓</span>
                  <span style={{ color: C.text3, minWidth: 30, fontWeight: 500, fontSize: 11 }}>{task.person || '—'}</span>
                  <span style={{ color: C.text3, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.task}</span>
                  <Pill t={task.company} c={task.companyColor} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ColHeader({ t, emoji, c, count }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7.5, marginBottom: 7.5 }}>
      <span style={{ fontSize: 15 }}>{emoji}</span>
      <span style={{ fontSize: 15, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: c || 'rgba(255,255,255,0.3)' }}>{t}</span>
      {count > 0 && <span style={{ fontSize: 11, background: `${c || '#666'}25`, color: c || '#999', padding: '1px 10px', borderRadius: 50, fontWeight: 700 }}>{count}</span>}
    </div>
  );
}

function Pill({ t, c }) {
  return <span style={{ fontSize: 11, padding: '1px 10px', borderRadius: 50, fontWeight: 600, background: `${c}18`, color: c, flexShrink: 0 }}>{t}</span>;
}

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

const S = 2.5;
const C = {
  bg: '#0a0a0a', card: '#1c1c1e', card2: '#2c2c2e', border: 'rgba(255,255,255,0.06)',
  text: '#f5f5f7', text2: 'rgba(255,255,255,0.6)', text3: 'rgba(255,255,255,0.3)',
  blue: '#0a84ff', green: '#30d158', red: '#ff375f', orange: '#ff9f0a', purple: '#bf5af2', teal: '#64d2ff', yellow: '#ffd60a',
};

const PEOPLE = {
  'Klāvs': '#0a84ff',
  'Elizabete': '#ff9f0a',
  'Paula': '#bf5af2',
  'Intars': '#30d158',
};

function daysUntilStr(dateStr) {
  if (!dateStr) return '';
  const d = Math.ceil((new Date(dateStr) - new Date()) / 86400000);
  if (d < 0) return `${Math.abs(d)}d kavē`;
  if (d === 0) return 'šodien';
  if (d === 1) return 'rīt';
  return `${d}d`;
}

function daysColor(dateStr) {
  if (!dateStr) return C.text3;
  const d = Math.ceil((new Date(dateStr) - new Date()) / 86400000);
  if (d < 0) return C.red;
  if (d === 0) return C.orange;
  if (d <= 3) return C.yellow;
  return C.green;
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  const time = formatRigaTime();
  const dateStr = formatRigaDate();
  const isLive = data.source?.includes('live');
  const stats = data.stats || {};
  const ms = stats.monthStats || {};
  const projectName = (stats.projectNames || [])[0] || 'NNKBV Ofiss';

  // Grupējam upcoming pa personām un kārtojam pēc daudzuma
  const upcoming = data.upcomingTasks || [];
  const personTasks = {};
  for (const name of Object.keys(PEOPLE)) personTasks[name] = [];

  function matchPerson(personName) {
    const p = (personName || '').toLowerCase();
    for (const name of Object.keys(PEOPLE)) {
      const match = name.toLowerCase().replace('.', '');
      if (p.startsWith(match) || p.includes(match)) return name;
    }
    return null;
  }

  // Nākamo 7 dienu filtrs
  const now = new Date();
  const in30days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const todayStr = now.toISOString().split('T')[0];

  for (const t of upcoming) {
    // Rādām tikai uzdevumus nākamajās 30 dienās vai bez datuma vai overdue
    const inRange = !t.dueDate || t.dueDate <= in30days;
    if (!inRange) continue;

    const owner = matchPerson(t.person);
    if (owner) {
      personTasks[owner].push(t);
    }
    // Subtaski kas pieder citām personām — pievienojam kā atsevišķu ierakstu
    for (const sub of (t.subtasks || [])) {
      const subOwner = matchPerson(sub.assignee);
      if (subOwner && subOwner !== owner) {
        // Pievienojam parent task ar šo vienu subtask pie citas personas
        if (!personTasks[subOwner].find(x => x._parentId === t.task && x._subName === sub.name)) {
          personTasks[subOwner].push({
            ...t,
            _isSubRef: true,
            _parentId: t.task,
            _subName: sub.name,
            _subDueDate: sub.dueDate,
            subtasks: [sub],
          });
        }
      }
    }
  }

  // Kārtojam pēc daudzuma (vairāk = augstāk)
  const sortedPeople = Object.entries(personTasks).sort((a, b) => b[1].length - a[1].length);

  return (
    <div style={{
      width: '100vw', height: '100vh',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif",
      background: C.bg, display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>

      {/* ══ TOP BAR ══ */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: `${5*S}px ${14*S}px`, background: C.card,
        borderBottom: `1px solid ${C.border}`, flexShrink: 0,
      }}>
        {/* Kreisā puse: pulkstenis + projekts */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8*S }}>
          <span id="clock" style={{ fontSize: 18*S, fontWeight: 700, color: C.text, letterSpacing: -1 }}>{time}</span>
          <span style={{ fontSize: 6*S, color: C.text3, fontWeight: 500 }}>{dateStr}</span>
          <span style={{
            fontSize: 5*S, color: isLive ? C.green : C.red, fontWeight: 600,
            background: isLive ? 'rgba(48,209,88,0.12)' : 'rgba(255,55,95,0.12)',
            padding: `${1*S}px ${5*S}px`, borderRadius: 20*S,
            display: 'flex', alignItems: 'center', gap: 3*S,
          }}>
            <span style={{ width: 4*S, height: 4*S, borderRadius: '50%', background: isLive ? C.green : C.red, display: 'inline-block' }} />
            {isLive ? 'LIVE' : 'MOCK'}
          </span>
          <span style={{
            fontSize: 6*S, fontWeight: 700, color: C.teal,
            background: 'rgba(100,210,255,0.1)', padding: `${2*S}px ${8*S}px`, borderRadius: 6*S,
            border: '1px solid rgba(100,210,255,0.2)',
          }}>
            {projectName}
          </span>
        </div>

        {/* Labā puse: mēneša stats + fullscreen */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6*S }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1*S }}>
            <span style={{ fontSize: 5*S, color: C.text2 }}>
              Pagājušajā mēnesī <span style={{ color: C.orange, fontWeight: 700 }}>{ms.lastMonthName || '—'}</span> tika izveidoti <span style={{ fontWeight: 700, color: C.text }}>{ms.lastMonthCreated || 0}</span> uzdevumi un <span style={{ fontWeight: 700, color: C.green }}>{ms.lastMonthCompleted || 0}</span> padarīti.
            </span>
            <span style={{ fontSize: 10*S, color: C.text, fontWeight: 600 }}>
              Šomēnes mums jau ir <span style={{ fontWeight: 800, color: C.blue }}>{ms.thisMonthCreated || 0}</span> uzdevumi un jau <span style={{ fontWeight: 800, color: C.green }}>{ms.thisMonthCompleted || 0}</span> esam izdarījuši.
            </span>
          </div>
          <button id="fs-btn" style={{
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
            color: C.text2, fontSize: 5*S, fontWeight: 600, padding: `${3*S}px ${8*S}px`,
            borderRadius: 6*S, cursor: 'pointer', whiteSpace: 'nowrap',
          }}>
            ⛶ Full Screen
          </button>
        </div>
      </div>

      {/* ══ 3 COLUMNS ══ */}
      <div style={{
        display: 'grid', gridTemplateColumns: '15% 60% 25%',
        flex: 1, overflow: 'hidden',
      }}>

        {/* ══ COL 1: PASĀKUMI ══ */}
        <div style={{ overflow: 'auto', padding: `${5*S}px ${5*S}px` }}>
          <ColHeader t="Pasākumi" emoji="🎪" c={C.purple} s={S} count={(data.events || []).length} />
          {(data.events || []).length === 0 && <div style={{ fontSize: 5*S, color: C.text3 }}>Nav tuvāko pasākumu</div>}
          {(data.events || []).map((ev, i) => {
            const d = new Date(ev.dueDate);
            const dayNames = ['Svētdiena', 'Pirmdiena', 'Otrdiena', 'Trešdiena', 'Ceturtdiena', 'Piektdiena', 'Sestdiena'];
            const monthNames = ['janv.', 'febr.', 'marts', 'apr.', 'maijs', 'jūn.', 'jūl.', 'aug.', 'sept.', 'okt.', 'nov.', 'dec.'];
            const dayName = dayNames[d.getDay()];
            const dateStr = `${d.getDate()}. ${monthNames[d.getMonth()]}`;
            const daysUntil = Math.ceil((d - new Date()) / 86400000);
            const urgency = daysUntil <= 3 ? C.red : daysUntil <= 7 ? C.orange : daysUntil <= 14 ? C.yellow : C.green;
            const name = ev.task.replace(/^PASĀKUMS[\s-]*/i, '').replace(/^PASĀKUMS/i, '');

            return (
              <div key={i} style={{
                background: C.card, borderRadius: 6*S, padding: `${4*S}px ${5*S}px`,
                marginBottom: 3*S, borderLeft: `3px solid ${urgency}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 1*S }}>
                  <span style={{ fontSize: 4.5*S, fontWeight: 700, color: urgency, textTransform: 'uppercase' }}>{dayName}</span>
                  <span style={{
                    fontSize: 4*S, fontWeight: 700, color: urgency,
                    background: `${urgency}20`, padding: `${0.5*S}px ${3*S}px`, borderRadius: 10*S,
                  }}>{daysUntil}d</span>
                </div>
                <div style={{ fontSize: 4.5*S, color: C.text3, marginBottom: 1*S }}>{dateStr}</div>
                <div style={{ fontSize: 5.5*S, fontWeight: 600, color: C.text, lineHeight: 1.3 }}>{name}</div>
                {ev.assignee && ev.assignee !== '—' && (
                  <div style={{ fontSize: 4*S, color: C.text3, marginTop: 1*S }}>{ev.assignee}</div>
                )}
              </div>
            );
          })}
        </div>

        {/* ══ COL 2: UZŅEMTIE — MATRICA PA PERSONĀM ══ */}
        <div style={{
          borderLeft: `1px solid ${C.border}`, padding: `${5*S}px ${5*S}px`,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <ColHeader t="Uzņemtie · 30 dienas" emoji="👥" c={C.blue} s={S} count={Object.values(personTasks).flat().length} />
          <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: `${4*S}px` }}>
            {sortedPeople.map(([name, tasks]) => {
              const color = PEOPLE[name];
              return (
                <div key={name}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3*S, marginBottom: 2*S }}>
                    <span style={{
                      width: 7*S, height: 7*S, borderRadius: '50%', background: `${color}25`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 4*S, fontWeight: 700, color: color, border: `1px solid ${color}40`,
                    }}>{name[0]}</span>
                    <span style={{ fontSize: 6*S, fontWeight: 700, color }}>{name}</span>
                    <span style={{ fontSize: 4.5*S, color: C.text3 }}>
                      {tasks.length === 0 ? 'nav uzdevumu' : `${tasks.length}`}
                    </span>
                  </div>
                  {tasks.length === 0 && <div style={{ fontSize: 4.5*S, color: C.text3, paddingLeft: 10*S }}>—</div>}
                  {tasks.map((t, i) => (
                    <div key={i}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 2*S,
                        paddingLeft: 10*S, fontSize: 5*S, padding: `${1*S}px 0 ${1*S}px ${10*S}px`,
                      }}>
                        <span style={{ color: daysColor(t.dueDate), fontSize: 4*S }}>●</span>
                        <span style={{ color: t._isSubRef ? C.text3 : C.text, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontStyle: t._isSubRef ? 'italic' : 'normal' }}>{t.task}</span>
                        <Pill t={t.company} c={t.companyColor} s={S} />
                        <span style={{ color: daysColor(t.dueDate), fontSize: 4.5*S, fontWeight: 600, minWidth: 10*S, textAlign: 'right', flexShrink: 0 }}>
                          {daysUntilStr(t.dueDate)}
                        </span>
                      </div>
                      {/* Subtaski */}
                      {(t.subtasks || []).filter(s => {
                        const subOwner = matchPerson(s.assignee);
                        return subOwner === name;
                      }).map((s, si) => (
                        <div key={si} style={{
                          display: 'flex', alignItems: 'center', gap: 2*S,
                          paddingLeft: 16*S, fontSize: 4.5*S, padding: `${0.5*S}px 0 ${0.5*S}px ${16*S}px`,
                        }}>
                          <span style={{ color: C.text3, fontSize: 3.5*S }}>↳</span>
                          <span style={{ color: C.text2, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</span>
                          {s.dueDate && <span style={{ color: daysColor(s.dueDate), fontSize: 4*S, fontWeight: 600, flexShrink: 0 }}>{daysUntilStr(s.dueDate)}</span>}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* ══ COL 3: NEUZŅEMTIE + KAVĒJAS + PADARĪTIE ══ */}
        <div style={{
          borderLeft: `1px solid ${C.border}`, padding: `${5*S}px ${8*S}px ${5*S}px ${5*S}px`,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>

          {/* NEUZŅEMTIE */}
          <ColHeader t="Neuzņemtie" emoji="⚠️" c={C.orange} s={S} count={(data.unassignedTasks || []).length} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${1*S}px`, marginBottom: 4*S }}>
            {(data.unassignedTasks || []).slice(0, 8).map((task, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 2*S, fontSize: 5.5*S, padding: `${1.5*S}px 0` }}>
                <span style={{ color: C.orange, fontWeight: 700, fontSize: 5*S, minWidth: 4*S }}>?</span>
                <span style={{ color: C.text2, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.task}</span>
                <Pill t={task.company} c={task.companyColor} s={S} />
                <span style={{ color: daysColor(task.dueDate), fontSize: 4.5*S, fontWeight: 600, minWidth: 8*S, textAlign: 'right', flexShrink: 0 }}>{daysUntilStr(task.dueDate)}</span>
              </div>
            ))}
          </div>

          {/* KAVĒJAS */}
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 4*S, marginBottom: 4*S }}>
            <ColHeader t="Kavējas" emoji="🔥" c={C.red} s={S} count={(data.overdueTasks || []).length} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: `${1*S}px` }}>
              {(data.overdueTasks || []).length === 0 && <div style={{ fontSize: 5*S, color: C.text3 }}>Nav kavētu uzdevumu 🎉</div>}
              {(data.overdueTasks || []).slice(0, 8).map((task, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 2*S, fontSize: 5.5*S, padding: `${1.5*S}px 0` }}>
                  <span style={{ color: C.red, fontWeight: 700, fontSize: 5*S, minWidth: 4*S }}>!</span>
                  <span style={{ color: task.daysLate >= 4 ? C.red : C.orange, minWidth: 12*S, fontWeight: 600, fontSize: 5*S }}>{task.person || '—'}</span>
                  <span style={{ color: C.text, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.task}</span>
                  <Pill t={task.company} c={task.companyColor} s={S} />
                  <span style={{ color: C.red, fontSize: 4.5*S, fontWeight: 700, minWidth: 8*S, textAlign: 'right', flexShrink: 0 }}>-{task.daysLate}d</span>
                </div>
              ))}
            </div>
          </div>

          {/* PADARĪTIE */}
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 4*S }}>
            <ColHeader t="Padarītie" emoji="✅" c={C.green} s={S} count={(data.completedTasks || []).length} />
            {(data.completedTasks || []).length === 0 && <div style={{ fontSize: 5*S, color: C.text3 }}>Nav pabeigtu uzdevumu</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: `${1*S}px` }}>
              {(data.completedTasks || []).slice(0, 35).map((task, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 2*S, fontSize: 5*S, padding: `${1*S}px 0` }}>
                  <span style={{ color: C.green, fontWeight: 600, minWidth: 4*S }}>✓</span>
                  <span style={{ color: C.text3, minWidth: 12*S, fontWeight: 500, fontSize: 4.5*S }}>{task.person || '—'}</span>
                  <span style={{ color: C.text3, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.task}</span>
                  <Pill t={task.company} c={task.companyColor} s={S} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ColHeader({ t, emoji, c, s, count }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3*s, marginBottom: 3*s }}>
      <span style={{ fontSize: 6*s }}>{emoji}</span>
      <span style={{ fontSize: 6*s, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: c || 'rgba(255,255,255,0.3)' }}>{t}</span>
      {count > 0 && (
        <span style={{
          fontSize: 4.5*s, background: `${c || '#666'}25`, color: c || '#999',
          padding: `${0.5*s}px ${4*s}px`, borderRadius: 20*s, fontWeight: 700,
        }}>{count}</span>
      )}
    </div>
  );
}

function Pill({ t, c, s }) {
  return <span style={{ fontSize: 4.5*s, padding: `${0.5*s}px ${4*s}px`, borderRadius: 20*s, fontWeight: 600, background: `${c}18`, color: c, flexShrink: 0 }}>{t}</span>;
}

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

function daysUntilStr(dateStr) {
  if (!dateStr) return '';
  const d = Math.ceil((new Date(dateStr) - new Date()) / 86400000);
  if (d < 0) return `${Math.abs(d)}d ago`;
  if (d === 0) return 'šodien';
  if (d === 1) return 'rīt';
  return `${d}d`;
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  const time = formatRigaTime();
  const dateStr = formatRigaDate();
  const isLive = data.source?.includes('live');
  const stats = data.stats || {};

  return (
    <div style={{
      width: '100vw', height: '100vh',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif",
      background: C.bg, display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>

      {/* ══ TOP BAR ══ */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: `${6*S}px ${14*S}px`, background: C.card,
        borderBottom: `1px solid ${C.border}`, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8*S }}>
          <span id="clock" style={{ fontSize: 18*S, fontWeight: 700, color: C.text, letterSpacing: -1 }}>{time}</span>
          <span style={{ fontSize: 6*S, color: C.text3, fontWeight: 500, letterSpacing: 0.5 }}>{dateStr}</span>
          <span style={{
            fontSize: 5*S, color: isLive ? C.green : C.red, fontWeight: 600,
            background: isLive ? 'rgba(48,209,88,0.12)' : 'rgba(255,55,95,0.12)',
            padding: `${1*S}px ${5*S}px`, borderRadius: 20*S,
            display: 'flex', alignItems: 'center', gap: 3*S,
          }}>
            <span style={{ width: 4*S, height: 4*S, borderRadius: '50%', background: isLive ? C.green : C.red, display: 'inline-block' }} />
            {isLive ? 'LIVE' : 'MOCK'}
          </span>
          {stats.totalActive > 0 && (
            <span style={{ fontSize: 5*S, color: C.text3, fontWeight: 500 }}>
              {stats.totalActive} aktīvi · {stats.totalCompleted || 0} pabeigti
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5*S }}>
          {(data.travel || []).map((t, i) => {
            const tc = t.days === 0 ? C.green : t.days <= 7 ? C.orange : C.text3;
            return (
              <div key={i} style={{
                background: `${tc}15`, padding: `${3*S}px ${8*S}px`, borderRadius: 20*S,
                display: 'flex', alignItems: 'center', gap: 4*S, border: `1px solid ${tc}30`,
              }}>
                <span style={{ width: 4*S, height: 4*S, borderRadius: '50%', background: tc, display: 'inline-block' }} />
                <span style={{ color: tc, fontSize: 6*S, fontWeight: 600 }}>{t.days}d — {t.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ══ 4 COLUMNS ══ */}
      <div style={{
        display: 'grid', gridTemplateColumns: '17% 28% 27% 28%',
        flex: 1, overflow: 'hidden',
      }}>

        {/* ══ COL 1: KALENDĀRS ══ */}
        <div style={{ overflow: 'hidden', padding: `${5*S}px ${5*S}px` }}>
          <ColHeader t="Kalendārs" emoji="📅" s={S} />
          {(data.calendar || []).map((day, di) => {
            const dc = di === 0 ? C.red : di === 1 ? C.orange : C.green;
            return (
              <div key={di} style={{ marginBottom: 5*S }}>
                <div style={{ fontSize: 6.5*S, fontWeight: 700, color: dc, marginBottom: 2*S }}>{day.day}</div>
                {(day.events || []).length === 0 && <div style={{ fontSize: 5*S, color: C.text3, paddingLeft: 4*S }}>Nav notikumu</div>}
                {(day.events || []).map((ev, ei) => {
                  const ec = ev.color === '#a064ff' ? C.purple : ev.color === '#ff2d78' ? C.red : ev.color === '#00ff88' ? C.green : ev.color === '#bf5af2' ? C.purple : ev.color === '#ff375f' ? C.red : ev.color === '#30d158' ? C.green : C.blue;
                  return (
                    <div key={ei} style={{
                      background: C.card, borderRadius: 6*S, padding: `${3*S}px ${5*S}px`,
                      marginBottom: 2*S, borderLeft: `2px solid ${ec}`,
                    }}>
                      <div style={{ fontSize: 6*S, fontWeight: 600, color: C.text }}>{ev.time} {ev.title}</div>
                      <div style={{ fontSize: 4.5*S, color: C.text3 }}>{ev.platform} · {ev.duration}</div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* ══ COL 2: PADARĪTIE ══ */}
        <div style={{
          borderLeft: `1px solid ${C.border}`, padding: `${5*S}px ${5*S}px`,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <ColHeader t="Padarītie" emoji="✅" c={C.green} s={S} count={(data.completedTasks || []).length} />
          {(data.completedTasks || []).length === 0 && <div style={{ fontSize: 5*S, color: C.text3 }}>Nav pabeigtu uzdevumu</div>}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: `${1*S}px`, overflow: 'auto' }}>
            {(data.completedTasks || []).slice(0, 15).map((task, i) => (
              <TaskRow key={i} icon="✓" iconColor={C.green} person={task.person} task={task.task}
                company={task.company} companyColor={task.companyColor} s={S} C={C}
                sub={task.notes} dimTask />
            ))}
          </div>
        </div>

        {/* ══ COL 3: NEUZŅEMTIE ══ */}
        <div style={{
          borderLeft: `1px solid ${C.border}`, padding: `${5*S}px ${5*S}px`,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <ColHeader t="Neuzņemtie" emoji="⚠️" c={C.orange} s={S} count={(data.unassignedTasks || []).length} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: `${1*S}px`, overflow: 'auto' }}>
            {(data.unassignedTasks || []).slice(0, 15).map((task, i) => (
              <TaskRow key={i} icon="?" iconColor={C.orange} person="—" task={task.task}
                company={task.company} companyColor={task.companyColor} s={S} C={C}
                right={daysUntilStr(task.dueDate)} rightColor={C.orange} />
            ))}
          </div>
        </div>

        {/* ══ COL 4: KAVĒJAS ══ */}
        <div style={{
          borderLeft: `1px solid ${C.border}`, padding: `${5*S}px ${8*S}px ${5*S}px ${5*S}px`,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <ColHeader t="Kavējas" emoji="🔥" c={C.red} s={S} count={(data.overdueTasks || []).length} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: `${1*S}px`, overflow: 'auto' }}>
            {(data.overdueTasks || []).slice(0, 15).map((task, i) => (
              <TaskRow key={i} icon="!" iconColor={C.red} person={task.person || '—'} task={task.task}
                company={task.company} companyColor={task.companyColor} s={S} C={C}
                right={`-${task.daysLate}d`} rightColor={C.red}
                personColor={task.daysLate >= 4 ? C.red : C.orange} />
            ))}
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

function TaskRow({ icon, iconColor, person, task, company, companyColor, s, C, right, rightColor, personColor, sub, dimTask }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2*s, fontSize: 5.5*s, padding: `${1.5*s}px 0`, minHeight: 7*s }}>
      <span style={{ color: iconColor, fontWeight: 700, minWidth: 4*s, fontSize: 5*s }}>{icon}</span>
      <span style={{ color: personColor || C.text3, minWidth: 13*s, fontWeight: 600, fontSize: 5*s }}>{person}</span>
      <span style={{ color: dimTask ? C.text2 : C.text, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 5.5*s }}>
        {task}
      </span>
      <Pill t={company} c={companyColor} s={s} />
      {right && <span style={{ color: rightColor || C.text3, fontSize: 4.5*s, flexShrink: 0, fontWeight: 700, minWidth: 8*s, textAlign: 'right' }}>{right}</span>}
    </div>
  );
}

function Pill({ t, c, s }) {
  return <span style={{ fontSize: 4.5*s, padding: `${0.5*s}px ${4*s}px`, borderRadius: 20*s, fontWeight: 600, background: `${c}18`, color: c, flexShrink: 0 }}>{t}</span>;
}

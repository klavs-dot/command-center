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
  } catch (e) {
    console.log('API nav pieejams:', e.message);
  }
  return getMockData();
}

const S = 2.5;

// Apple krāsas
const C = {
  bg: '#1c1c1e',
  card: '#2c2c2e',
  card2: '#3a3a3c',
  border: 'rgba(255,255,255,0.06)',
  text: '#ffffff',
  text2: 'rgba(255,255,255,0.6)',
  text3: 'rgba(255,255,255,0.35)',
  blue: '#0a84ff',
  green: '#30d158',
  red: '#ff375f',
  orange: '#ff9f0a',
  purple: '#bf5af2',
  teal: '#64d2ff',
};

// Uzņēmumu krāsas Apple stilā
const companyColors = {
  VL: C.blue,
  DA: C.red,
  MO: C.purple,
  GWM: C.teal,
};

export default async function DashboardPage() {
  const data = await getDashboardData();
  const time = formatRigaTime();
  const dateStr = formatRigaDate();

  const hasOverdue = (data.overdueTasks || []).length > 0;
  const hasUnassigned = (data.unassignedTasks || []).length > 0;

  return (
    <div style={{
      width: '100vw', height: '100vh',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif",
      background: C.bg, display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>

      {/* Pulsēšanas animācijas */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulseRed {
          0%, 100% { background: ${C.card}; }
          50% { background: rgba(255,55,95,0.08); }
        }
        @keyframes pulseOrange {
          0%, 100% { background: ${C.card}; }
          50% { background: rgba(255,159,10,0.08); }
        }
        .pulse-red { animation: pulseRed 3s ease-in-out infinite; border-radius: ${10*S}px; padding: ${3*S}px ${5*S}px; margin: 0 -${5*S}px; }
        .pulse-orange { animation: pulseOrange 3s ease-in-out infinite; border-radius: ${10*S}px; padding: ${3*S}px ${5*S}px; margin: 0 -${5*S}px; }
      `}} />

      {/* TOP BAR */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: `${8*S}px ${14*S}px`,
        background: C.card,
        borderBottom: `1px solid ${C.border}`,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10*S }}>
          <span style={{ fontSize: 20*S, fontWeight: 700, color: C.text, letterSpacing: -1 }}>{time}</span>
          <span style={{ fontSize: 7*S, color: C.text3, fontWeight: 500 }}>{dateStr}</span>
          <span style={{
            fontSize: 6*S, color: C.green, fontWeight: 600,
            background: 'rgba(48,209,88,0.15)',
            padding: `${1*S}px ${6*S}px`, borderRadius: 20*S,
          }}>{data.source?.includes('live') ? 'LIVE' : 'MOCK'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6*S }}>
          {(data.travel || []).map((t, i) => {
            const tc = t.days <= 7 ? C.orange : C.red;
            return (
              <div key={i} style={{
                background: `${tc}1F`, padding: `${4*S}px ${10*S}px`, borderRadius: 20*S,
                display: 'flex', alignItems: 'center', gap: 5*S,
              }}>
                <span style={{ width: 5*S, height: 5*S, borderRadius: '50%', background: tc, display: 'inline-block' }} />
                <span style={{ color: tc, fontSize: 7*S, fontWeight: 600 }}>{t.days}d — {t.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4 COLUMNS */}
      <div style={{
        display: 'grid', gridTemplateColumns: '14% 33% 30% 23%',
        flex: 1, overflow: 'hidden', padding: `${4*S}px`,  gap: `${4*S}px`,
      }}>

        {/* ═══ COL 1: KALENDĀRS ═══ */}
        <div style={{ overflow: 'hidden', padding: `${3*S}px` }}>
          <Sec t="Kalendārs" s={S} />
          {(data.calendar || []).map((day, di) => {
            const dayColor = di === 0 ? C.red : di === 1 ? C.orange : C.green;
            return (
              <div key={di} style={{ marginBottom: 6*S }}>
                <div style={{ fontSize: 7*S, fontWeight: 700, color: dayColor, marginBottom: 3*S }}>
                  {day.day}
                </div>
                {(day.events || []).length === 0 && (
                  <div style={{ fontSize: 5*S, color: C.text3, paddingLeft: 5*S }}>Nav notikumu</div>
                )}
                {(day.events || []).map((ev, ei) => {
                  const evColor = ev.color === '#a064ff' ? C.purple : ev.color === '#ff2d78' ? C.red : ev.color === '#00ff88' ? C.green : C.blue;
                  return (
                    <div key={ei} style={{
                      background: C.card, borderRadius: 8*S,
                      padding: `${4*S}px ${6*S}px`, marginBottom: 2*S,
                      borderLeft: `${3}px solid ${evColor}`,
                    }}>
                      <div style={{ fontSize: 7*S, fontWeight: 600, color: C.text }}>{ev.time} {ev.title}</div>
                      <div style={{ fontSize: 5*S, color: C.text3 }}>{ev.platform} · {ev.duration}</div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* ═══ COL 2: E-PASTI ═══ */}
        <div style={{
          borderLeft: `1px solid ${C.border}`, paddingLeft: `${5*S}px`,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3*S }}>
            <Sec t="Inbox · Jaunākie" s={S} noM />
            <span style={{
              background: C.red, color: '#fff', fontSize: 6*S,
              padding: `${1*S}px ${6*S}px`, borderRadius: 20*S, fontWeight: 700,
            }}>{(data.emailsRecent || []).length}</span>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', marginBottom: 4*S }}>
            {(data.emailsRecent || []).map((email, i) => {
              const accColor = email.accountColor === '#a064ff' ? C.purple : email.accountColor === '#ff2d78' ? C.red : C.teal;
              return (
                <div key={i} style={{
                  background: C.card, borderRadius: 8*S,
                  padding: `${4*S}px ${6*S}px`, marginBottom: 2*S,
                  borderLeft: email.urgent ? `3px solid ${C.orange}` : 'none',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 1*S }}>
                    <div style={{ fontSize: 7*S, fontWeight: 600, color: C.text, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {email.subject || '(bez temata)'}
                    </div>
                    <div style={{ display: 'flex', gap: 3*S, alignItems: 'center', flexShrink: 0, marginLeft: 4*S }}>
                      <span style={{ fontSize: 5*S, color: C.text3 }}>{email.date}</span>
                      <Pill t={email.account} c={accColor} s={S} />
                    </div>
                  </div>
                  <div style={{ fontSize: 5*S, color: C.text3, marginBottom: 1*S, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{email.summary}</div>
                  <div style={{ fontSize: 5*S, color: email.urgent ? C.orange : C.green, fontWeight: 500 }}>→ {email.suggestion}</div>
                </div>
              );
            })}
          </div>

          {/* Vecāki par 3d */}
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 4*S }}>
            <Sec t="Vecāki par 3d · Nelasīti" s={S} />
            {(data.emailsOld || []).length === 0 && (
              <div style={{ fontSize: 5*S, color: C.text3 }}>Nav vecu nelasītu e-pastu</div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2*S }}>
              {(data.emailsOld || []).map((email, i) => {
                const accColor = email.accountColor === '#a064ff' ? C.purple : email.accountColor === '#ff2d78' ? C.red : C.teal;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 3*S, fontSize: 6*S }}>
                    <Pill t={email.account} c={accColor} s={S} />
                    <span style={{ color: C.text2, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {email.subject}
                    </span>
                    <span style={{ color: email.urgent ? C.red : C.orange, flexShrink: 0, fontWeight: 600 }}>{email.daysOld}d</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ═══ COL 3: KAVĒJAS + NEUZŅEMTIE + PADARĪTIE ═══ */}
        <div style={{
          borderLeft: `1px solid ${C.border}`, paddingLeft: `${5*S}px`,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {/* Kavējas */}
          <Sec t="Kavējas · Overdue" s={S} c={hasOverdue ? C.red : undefined} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 4*S }}>
            {(data.overdueTasks || []).slice(0, 10).map((task, i) => {
              const cc = task.companyColor === '#ff2d78' ? C.red : task.companyColor === '#a064ff' ? C.purple : C.blue;
              return (
                <div key={i} className="pulse-red" style={{ display: 'flex', alignItems: 'center', gap: 3*S, fontSize: 6*S, padding: `${2*S}px 0` }}>
                  <span style={{ color: C.red, fontWeight: 700, minWidth: 5*S }}>!</span>
                  <span style={{ color: task.daysLate >= 4 ? C.red : C.orange, minWidth: 14*S, fontWeight: 600 }}>{task.person}</span>
                  <span style={{ color: C.text, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {task.task}
                  </span>
                  <Pill t={task.company} c={cc} s={S} />
                  <span style={{ color: C.red, fontSize: 5*S, flexShrink: 0, fontWeight: 700 }}>-{task.daysLate}d</span>
                </div>
              );
            })}
          </div>

          {/* Neuzņemtie */}
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 4*S, marginBottom: 4*S }}>
            <Sec t="Neuzņemtie · Unassigned" s={S} c={hasUnassigned ? C.orange : undefined} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {(data.unassignedTasks || []).slice(0, 10).map((task, i) => {
                const cc = task.companyColor === '#ff2d78' ? C.red : task.companyColor === '#a064ff' ? C.purple : C.blue;
                return (
                  <div key={i} className="pulse-orange" style={{ display: 'flex', alignItems: 'center', gap: 3*S, fontSize: 6*S, padding: `${2*S}px 0` }}>
                    <span style={{ color: C.orange, fontWeight: 700, minWidth: 5*S }}>?</span>
                    <span style={{ color: C.text3, minWidth: 14*S }}>—</span>
                    <span style={{ color: C.text2, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {task.task}
                    </span>
                    <Pill t={task.company} c={cc} s={S} />
                    <span style={{ color: C.orange, fontSize: 5*S, flexShrink: 0, fontWeight: 600 }}>{task.daysWaiting || '?'}d</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Padarītie */}
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 4*S }}>
            <Sec t="Pēdējie padarītie" s={S} c={C.green} />
            {(data.completedTasks || []).length === 0 && (
              <div style={{ fontSize: 5*S, color: C.text3 }}>Nav pabeigtu uzdevumu</div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {(data.completedTasks || []).slice(0, 10).map((task, i) => {
                const cc = task.companyColor === '#ff2d78' ? C.red : task.companyColor === '#a064ff' ? C.purple : C.blue;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 3*S, fontSize: 6*S, padding: `${2*S}px 0` }}>
                    <span style={{ color: C.green, fontWeight: 600, minWidth: 5*S }}>✓</span>
                    <span style={{ color: C.text3, minWidth: 14*S, fontWeight: 500 }}>{task.person}</span>
                    <span style={{ color: C.text2, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {task.task}
                    </span>
                    <Pill t={task.company} c={cc} s={S} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ═══ COL 4: STATS ═══ */}
        <div style={{
          borderLeft: `1px solid ${C.border}`, paddingLeft: `${5*S}px`,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <Sec t="Social · 30d pieaugums" s={S} />
          <div style={{ display: 'grid', gridTemplateColumns: `${38*S}px repeat(4,1fr)`, gap: 0, fontSize: 7*S, marginBottom: 5*S }}>
            <div />
            {(data.social?.headers || []).map((h, i) => (
              <div key={i} style={{ textAlign: 'center', color: C.text3, fontWeight: 600, padding: `${2*S}px 0` }}>{h}</div>
            ))}
            {(data.social?.rows || []).map((row, ri) => {
              const vals = row.values.map((v, vi) => {
                const oc = row.colors[vi];
                const nc = oc === '#00ff88' ? C.green : oc === '#ff4455' ? C.red : C.orange;
                return { v, c: nc };
              });
              return [
                <div key={`l${ri}`} style={{ color: C.text2, fontWeight: 600, padding: `${2*S}px 0`, borderTop: ri > 0 ? `1px solid ${C.border}` : 'none' }}>{row.label}</div>,
                ...vals.map((x, vi) => (
                  <div key={`v${ri}${vi}`} style={{ textAlign: 'center', color: x.c, fontWeight: 600, padding: `${2*S}px 0`, borderTop: ri > 0 ? `1px solid ${C.border}` : 'none' }}>{x.v}</div>
                )),
              ];
            }).flat()}
          </div>

          {/* Arēna */}
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 5*S, marginBottom: 5*S }}>
            <Sec t="Arēna · Rezervācijas" s={S} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2*S }}>
              <span style={{ fontSize: 7*S, color: C.text3 }}>Šomēnes</span>
              <span style={{ fontSize: 18*S, fontWeight: 700, color: C.text, letterSpacing: -1 }}>{data.arena?.thisMonth}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 7*S, marginBottom: 3*S }}>
              <span style={{ color: C.text3 }}>vs iepr.</span>
              <span style={{ color: C.green, fontWeight: 600 }}>+{data.arena?.change} (+{data.arena?.changePercent}%)</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3*S, marginBottom: 3*S }}>
              <MetBox l="Vid./dienā" v={data.arena?.avgPerDay} s={S} />
              <MetBox l="Weekend" v={`${data.arena?.weekendFill}%`} vc={C.green} s={S} />
            </div>
            <div style={{ display: 'flex', gap: 2*S, alignItems: 'flex-end', height: 22*S }}>
              {(data.arena?.weekBars || []).map((h, i) => (
                <div key={i} style={{
                  flex: 1, borderRadius: 3*S, height: `${h}%`,
                  background: h >= 90 ? C.blue : `rgba(10,132,255,${0.15 + h / 300})`,
                }} />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 5*S, color: C.text3, marginTop: 1*S }}>
              {['P', 'O', 'T', 'C', 'Pk', 'S', 'Sv'].map((d) => <span key={d}>{d}</span>)}
            </div>
          </div>

          {/* Analytics */}
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 5*S }}>
            <Sec t="Analytics · Live" s={S} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 3*S, marginBottom: 4*S }}>
              {(data.analytics?.live || []).map((a, i) => {
                const lc = i === 0 ? C.blue : i === 1 ? C.red : C.purple;
                return (
                  <div key={i} style={{
                    background: C.card, borderRadius: 8*S,
                    padding: `${3*S}px`, textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 5*S, color: C.text3 }}>{a.label}</div>
                    <div style={{ fontSize: 14*S, fontWeight: 700, color: lc }}>{a.value}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: 6*S, color: C.text3, marginBottom: 2*S }}>30d apmeklētāji</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2*S }}>
              {(data.analytics?.monthly || []).map((a, i) => {
                const mc = a.color === '#00ff88' ? C.green : C.red;
                return (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11*S, fontWeight: 700, color: C.text }}>{a.value}</div>
                    <div style={{ fontSize: 6*S, color: mc, fontWeight: 600 }}>{a.change}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══ KOMPONENTES ═══

function Sec({ t, s, noM, c }) {
  return (
    <div style={{
      fontSize: 6*s, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1,
      color: c || 'rgba(255,255,255,0.35)',
      marginBottom: noM ? 0 : 3*s,
    }}>{t}</div>
  );
}

function Pill({ t, c, s }) {
  return (
    <span style={{
      fontSize: 5*s, padding: `${1*s}px ${5*s}px`, borderRadius: 20*s, fontWeight: 600,
      background: `${c}20`, color: c,
    }}>{t}</span>
  );
}

function MetBox({ l, v, vc = '#ffffff', s }) {
  return (
    <div style={{
      background: '#2c2c2e', borderRadius: 8*s,
      padding: `${3*s}px`, textAlign: 'center',
    }}>
      <div style={{ fontSize: 5*s, color: 'rgba(255,255,255,0.35)' }}>{l}</div>
      <div style={{ fontSize: 12*s, fontWeight: 700, color: vc }}>{v}</div>
    </div>
  );
}

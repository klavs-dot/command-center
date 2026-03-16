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
  bg: '#1c1c1e', card: '#2c2c2e', border: 'rgba(255,255,255,0.06)',
  text: '#fff', text2: 'rgba(255,255,255,0.6)', text3: 'rgba(255,255,255,0.35)',
  blue: '#0a84ff', green: '#30d158', red: '#ff375f', orange: '#ff9f0a', purple: '#bf5af2', teal: '#64d2ff',
};

export default async function DashboardPage() {
  const data = await getDashboardData();
  const time = formatRigaTime();
  const dateStr = formatRigaDate();
  const isLive = data.source?.includes('live');
  const emails = data.emailsRecent || [];

  return (
    <div style={{
      width: '100vw', height: '100vh',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif",
      background: C.bg, display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>

      {/* ══ TOP BAR ══ */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: `${8*S}px ${14*S}px`, background: C.card,
        borderBottom: `1px solid ${C.border}`, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10*S }}>
          <span style={{ fontSize: 20*S, fontWeight: 700, color: C.text, letterSpacing: -1 }}>{time}</span>
          <span style={{ fontSize: 7*S, color: C.text3, fontWeight: 500 }}>{dateStr}</span>
          <span className="live-badge" style={{
            fontSize: 6*S, color: isLive ? C.green : C.red, fontWeight: 600,
            background: isLive ? 'rgba(48,209,88,0.15)' : 'rgba(255,55,95,0.15)',
            padding: `${1*S}px ${6*S}px`, borderRadius: 20*S,
            display: 'flex', alignItems: 'center', gap: 4*S,
          }}>
            <span className="live-dot" style={{ width: 5*S, height: 5*S, borderRadius: '50%', background: isLive ? C.green : C.red, display: 'inline-block' }} />
            {isLive ? 'LIVE' : 'MOCK'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6*S }}>
          {(data.travel || []).map((t, i) => {
            const tc = t.days <= 7 ? C.orange : C.red;
            return (
              <div key={i} className="travel-badge" style={{
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

      {/* ══ 4 COLUMNS ══ */}
      <div style={{
        display: 'grid', gridTemplateColumns: '15% 28% 24% 33%',
        flex: 1, overflow: 'hidden',
      }}>

        {/* ══ COL 1: KALENDĀRS ══ */}
        <div style={{ overflow: 'hidden', padding: `${5*S}px ${4*S}px` }}>
          <Sec t="Kalendārs" s={S} />
          {(data.calendar || []).map((day, di) => {
            const dc = di === 0 ? C.red : di === 1 ? C.orange : C.green;
            return (
              <div key={di} style={{ marginBottom: 6*S }}>
                <div style={{ fontSize: 7*S, fontWeight: 700, color: dc, marginBottom: 3*S }}>{day.day}</div>
                {(day.events || []).length === 0 && <div style={{ fontSize: 5*S, color: C.text3, paddingLeft: 5*S }}>Nav notikumu</div>}
                {(day.events || []).map((ev, ei) => {
                  const ec = ev.color === '#a064ff' ? C.purple : ev.color === '#ff2d78' ? C.red : ev.color === '#00ff88' ? C.green : C.blue;
                  return (
                    <div key={ei} className="cal-item" style={{
                      background: C.card, borderRadius: 8*S, padding: `${4*S}px ${6*S}px`,
                      marginBottom: 2*S, borderLeft: `3px solid ${ec}`, animationDelay: `${di*0.15+ei*0.1}s`,
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

        {/* ══ COL 2: JAUNĀKIE E-PASTI + CLAUDE ZEM KATRA ══ */}
        <div style={{
          borderLeft: `1px solid ${C.border}`, padding: `${5*S}px ${4*S}px ${5*S}px ${6*S}px`,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3*S }}>
            <Sec t="Inbox · Jaunākie" s={S} noM />
            <span className="count-badge" style={{
              background: C.red, color: '#fff', fontSize: 6*S,
              padding: `${1*S}px ${6*S}px`, borderRadius: 20*S, fontWeight: 700,
            }}>{emails.length}</span>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: `${2*S}px`, overflow: 'hidden' }}>
            {emails.slice(0, 10).map((email, i) => {
              const accColor = email.accountColor === '#a064ff' ? C.purple : email.accountColor === '#ff2d78' ? C.red : C.teal;
              return (
                <div key={i}>
                  {/* E-pasta kartīte */}
                  <div className="email-card" style={{
                    background: C.card, borderRadius: 8*S,
                    padding: `${3*S}px ${5*S}px`,
                    borderLeft: email.urgent ? `3px solid ${C.orange}` : 'none',
                    animationDelay: `${i * 0.06}s`,
                  }}>
                    <div style={{ fontSize: 4.5*S, color: C.text3, marginBottom: 0.5*S, fontWeight: 500 }}>{email.from || 'Nezināms'}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 6*S, fontWeight: 600, color: C.text, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {email.subject || '(bez temata)'}
                      </div>
                      <div style={{ display: 'flex', gap: 3*S, alignItems: 'center', flexShrink: 0, marginLeft: 3*S }}>
                        <span style={{ fontSize: 4.5*S, color: C.text3 }}>{email.date}</span>
                        <Pill t={email.account} c={accColor} s={S} />
                      </div>
                    </div>
                  </div>

                  {/* Claude burbulis — zem e-pasta, izplešas un sabīda pārējos */}
                  <div className={`expand-bubble-${i}`} style={{
                    background: 'rgba(48,209,88,0.15)',
                    border: '1px solid rgba(48,209,88,0.3)',
                    borderRadius: 8*S,
                    maxHeight: 0, opacity: 0, overflow: 'hidden',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3*S, marginBottom: 1*S }}>
                      <span style={{ fontSize: 4.5*S, color: C.green, fontWeight: 700 }}>Claude</span>
                      <span className="arrow-bounce" style={{ fontSize: 5*S, color: C.green }}>→</span>
                    </div>
                    <div style={{ fontSize: 5.5*S, color: C.text, fontWeight: 500, lineHeight: 1.35 }}>
                      {email.suggestion || 'Izlasi un izlemj'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ══ COL 3: VAKARDIENAS UN VECĀKI ══ */}
        <div style={{
          borderLeft: `1px solid ${C.border}`, padding: `${5*S}px ${4*S}px`,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <Sec t="Vakardienas un vecāki" s={S} />
          {(data.emailsOld || []).length === 0 && <div style={{ fontSize: 5*S, color: C.text3 }}>Nav vecu nelasītu</div>}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: `${2*S}px` }}>
            {(data.emailsOld || []).slice(0, 15).map((email, i) => {
              const accColor = email.accountColor === '#a064ff' ? C.purple : email.accountColor === '#ff2d78' ? C.red : C.teal;
              return (
                <div key={i} style={{
                  background: C.card, borderRadius: 8*S, padding: `${3*S}px ${5*S}px`,
                  borderLeft: email.urgent ? `3px solid ${C.red}` : 'none',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 6*S, fontWeight: 600, color: C.text, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {email.subject}
                    </div>
                    <div style={{ display: 'flex', gap: 3*S, alignItems: 'center', flexShrink: 0, marginLeft: 3*S }}>
                      <Pill t={email.account} c={accColor} s={S} />
                      <span style={{ color: email.urgent ? C.red : C.orange, fontWeight: 700, fontSize: 5*S }}>{email.daysOld}d</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ══ COL 4: CLICKUP ══ */}
        <div style={{
          borderLeft: `1px solid ${C.border}`, padding: `${5*S}px ${8*S}px ${5*S}px ${5*S}px`,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <Sec t="Kavējas · Overdue" s={S} c={(data.overdueTasks || []).length > 0 ? C.red : undefined} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 4*S }}>
            {(data.overdueTasks || []).slice(0, 10).map((task, i) => {
              const cc = task.companyColor === '#ff2d78' ? C.red : task.companyColor === '#a064ff' ? C.purple : C.blue;
              return (
                <div key={i} className="pulse-red" style={{ display: 'flex', alignItems: 'center', gap: 3*S, fontSize: 6*S, padding: `${2*S}px 0` }}>
                  <span style={{ color: C.red, fontWeight: 700, minWidth: 5*S }}>!</span>
                  <span style={{ color: task.daysLate >= 4 ? C.red : C.orange, minWidth: 14*S, fontWeight: 600 }}>{task.person}</span>
                  <span style={{ color: C.text, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.task}</span>
                  <Pill t={task.company} c={cc} s={S} />
                  <span style={{ color: C.red, fontSize: 5*S, flexShrink: 0, fontWeight: 700 }}>-{task.daysLate}d</span>
                </div>
              );
            })}
          </div>

          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 4*S, marginBottom: 4*S }}>
            <Sec t="Neuzņemtie · Unassigned" s={S} c={(data.unassignedTasks || []).length > 0 ? C.orange : undefined} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {(data.unassignedTasks || []).slice(0, 10).map((task, i) => {
                const cc = task.companyColor === '#ff2d78' ? C.red : task.companyColor === '#a064ff' ? C.purple : C.blue;
                return (
                  <div key={i} className="pulse-orange" style={{ display: 'flex', alignItems: 'center', gap: 3*S, fontSize: 6*S, padding: `${2*S}px 0` }}>
                    <span style={{ color: C.orange, fontWeight: 700, minWidth: 5*S }}>?</span>
                    <span style={{ color: C.text3, minWidth: 14*S }}>—</span>
                    <span style={{ color: C.text2, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.task}</span>
                    <Pill t={task.company} c={cc} s={S} />
                    <span style={{ color: C.orange, fontSize: 5*S, flexShrink: 0, fontWeight: 600 }}>{task.daysWaiting || '?'}d</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 4*S }}>
            <Sec t="Pēdējie padarītie" s={S} c={C.green} />
            {(data.completedTasks || []).length === 0 && <div style={{ fontSize: 5*S, color: C.text3 }}>Nav pabeigtu uzdevumu</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {(data.completedTasks || []).slice(0, 10).map((task, i) => {
                const cc = task.companyColor === '#ff2d78' ? C.red : task.companyColor === '#a064ff' ? C.purple : C.blue;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 3*S, fontSize: 6*S, padding: `${2*S}px 0` }}>
                    <span style={{ color: C.green, fontWeight: 600, minWidth: 5*S }}>✓</span>
                    <span style={{ color: C.text3, minWidth: 14*S, fontWeight: 500 }}>{task.person}</span>
                    <span style={{ color: C.text2, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.task}</span>
                    <Pill t={task.company} c={cc} s={S} />
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

function Sec({ t, s, noM, c }) {
  return <div style={{ fontSize: 6*s, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: c || 'rgba(255,255,255,0.35)', marginBottom: noM ? 0 : 3*s }}>{t}</div>;
}
function Pill({ t, c, s }) {
  return <span style={{ fontSize: 5*s, padding: `${1*s}px ${5*s}px`, borderRadius: 20*s, fontWeight: 600, background: `${c}20`, color: c }}>{t}</span>;
}

export function shouldCallClaude() {
  return true; // TESTS — pēc tam nomainīsim atpakaļ
}

export function formatRigaTime() {
  return new Date().toLocaleString('lv-LV', { timeZone: 'Europe/Riga', hour: '2-digit', minute: '2-digit', hour12: false });
}

export function formatRigaDate() {
  const days = ['Svētdiena', 'Pirmdiena', 'Otrdiena', 'Trešdiena', 'Ceturtdiena', 'Piektdiena', 'Sestdiena'];
  const r = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Riga' }));
  return `${days[r.getDay()]} // ${String(r.getDate()).padStart(2,'0')}.${String(r.getMonth()+1).padStart(2,'0')}.${r.getFullYear()}`;
}

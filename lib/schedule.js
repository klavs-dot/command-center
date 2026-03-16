export function shouldCallClaude() {
  const riga = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Riga' }));
  const day = riga.getDay(), hours = riga.getHours(), minutes = riga.getMinutes();
  const t = hours + minutes / 60;

  // Brīvdienas: 11:00 un 16:00
  if (day === 0 || day === 6) return (hours === 11 || hours === 16) && minutes < 15;

  // Darba dienas: ik stundu no 8:30 līdz 18:00
  if (t >= 8.5 && t <= 18) return minutes < 15;

  return false;
}

export function formatRigaTime() {
  return new Date().toLocaleString('lv-LV', { timeZone: 'Europe/Riga', hour: '2-digit', minute: '2-digit', hour12: false });
}

export function formatRigaDate() {
  const days = ['Svētdiena', 'Pirmdiena', 'Otrdiena', 'Trešdiena', 'Ceturtdiena', 'Piektdiena', 'Sestdiena'];
  const r = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Riga' }));
  return `${days[r.getDay()]} // ${String(r.getDate()).padStart(2,'0')}.${String(r.getMonth()+1).padStart(2,'0')}.${r.getFullYear()}`;
}

// lib/mock-data.js

export function getMockData() {
  return {
    lastUpdated: new Date().toISOString(),
    source: 'mock',

    calendar: [
      {
        day: 'Šodien',
        color: '#ff2d78',
        events: [
          { time: '10:00', title: 'Standup', platform: 'Meet', duration: '30m', color: '#00e8fc' },
          { time: '13:00', title: 'VL plānošana', platform: 'Zoom', duration: '1h', color: '#00ff88' },
          { time: '16:00', title: 'Drift investors', platform: 'Klātienē', duration: '2h', color: '#ff2d78' },
        ],
      },
      {
        day: 'Rīt',
        color: '#ffaa00',
        events: [
          { time: '09:00', title: 'Mosphera board', platform: 'Meet', duration: '1.5h', color: '#a064ff' },
          { time: '11:30', title: 'GWM fleet', platform: 'Zoom', duration: '45m', color: '#00e8fc' },
          { time: '14:00', title: 'Mārk. sync', platform: 'Zoom', duration: '45m', color: '#00ff88' },
        ],
      },
      {
        day: 'Parīt',
        color: '#00ff88',
        events: [
          { time: '10:00', title: 'VL content', platform: 'Meet', duration: '1h', color: '#00ff88' },
          { time: '14:00', title: 'Partnerības', platform: 'Klātienē', duration: '1h', color: '#ff2d78' },
        ],
      },
    ],

    // Visa diena notikumi = komandējumi
    travel: [
      { days: 7, label: 'RĪGA — ATA CENTRS', color: '#ffaa00' },
      { days: 14, label: 'LIEPĀJA — DRIFT ARENA', color: '#ff2d78' },
    ],

    // 7 jaunākie nelasītie
    emailsRecent: [
      {
        subject: 'Rīgas TIC — sadarbības piedāvājums',
        date: 'šod 09:14',
        account: 'GWM',
        accountColor: '#00e8fc',
        summary: 'Piedāvā kopīgu kampaņu autotūrismam, gatavi līdzfinansēt 50%',
        suggestion: 'Piedāvā tikšanos nākamnedēļ, sagatavo konceptu',
        urgent: false,
      },
      {
        subject: 'Sponsor X — logo izvietojums arēnā',
        date: 'šod 10:30',
        account: 'DRIFT',
        accountColor: '#ff2d78',
        summary: 'Interesē logo uz galvenās sienas, budžets 5-8K sezonai',
        suggestion: 'Nosūti sponsoru paketi ar 3 līmeņiem',
        urgent: false,
      },
      {
        subject: 'Drošības inspekcija — pārbaude 25.03',
        date: 'šod 08:42',
        account: 'DRIFT',
        accountColor: '#ff2d78',
        summary: 'Vajag evakuācijas plānu, ugunsdzēšanas aktus',
        suggestion: 'Steidzami! Deleģē Elizabetei',
        urgent: true,
      },
      {
        subject: 'Piegādātājs — jauns cenrādis 2026',
        date: 'vak 17:20',
        account: 'MOSPH',
        accountColor: '#a064ff',
        summary: 'Cenas +8% krēsli, +12% galdi, lielāks min. pasūtījums',
        suggestion: 'Salīdzini ar pašreizējām, prasi apjoma atlaidi',
        urgent: false,
      },
      {
        subject: 'Influencere Līvija — barter sadarbība',
        date: 'vak 14:05',
        account: 'MOSPH',
        accountColor: '#a064ff',
        summary: '25K sek. Instagram, piedāvā 3 reels par produktiem',
        suggestion: 'Pārbaudi ER (>3%), piedāvā 1 prod. + 200 EUR',
        urgent: false,
      },
      {
        subject: 'BMW Baltic — fleet līzinga piedāvājums',
        date: 'vak 11:30',
        account: 'GWM',
        accountColor: '#00e8fc',
        summary: 'Speciālas likmes Q2, piedāvā 5+ auto fleet',
        suggestion: 'Salīdzini ar esošo līzingu',
        urgent: false,
      },
      {
        subject: 'Booking.com — Q1 performance report',
        date: 'aizv 16:50',
        account: 'DRIFT',
        accountColor: '#ff2d78',
        summary: 'Rez. +18% YoY, top avoti: DE, LT, EE',
        suggestion: 'Pārsūti Paulai analīzei',
        urgent: false,
      },
    ],

    // 5 vecākie nelasītie (>3 dienas)
    emailsOld: [
      { subject: 'Liepājas pašvaldība — grants atskaite', account: 'GWM', accountColor: '#00e8fc', daysOld: 4, urgent: true },
      { subject: 'CFLA — ES fondu progresa atskaite 20.03', account: 'GWM', accountColor: '#00e8fc', daysOld: 4, urgent: true },
      { subject: 'DHL — sūtījuma kavēšanās kompensācija', account: 'MOSPH', accountColor: '#a064ff', daysOld: 5, urgent: false },
      { subject: 'Dizaina studija — jaunie vizuāļi v2', account: 'MOSPH', accountColor: '#a064ff', daysOld: 5, urgent: false },
      { subject: 'TrackDays.lv — sadarbības līgums', account: 'DRIFT', accountColor: '#ff2d78', daysOld: 6, urgent: false },
    ],

    // 10 kavējas (ilgākais pirmais)
    overdueTasks: [
      { person: 'EL', task: 'VL viesu māju sertifikācija', company: 'VL', companyColor: '#00e8fc', daysLate: 8 },
      { person: 'PA', task: 'DA sponsoru līgumu parakstīšana', company: 'DA', companyColor: '#ff2d78', daysLate: 6 },
      { person: 'EL', task: 'VL jaunā mājas lapa — teksti LV', company: 'VL', companyColor: '#00e8fc', daysLate: 5 },
      { person: 'EL', task: 'MO noliktavas pārskata iesniegšana', company: 'MO', companyColor: '#a064ff', daysLate: 4 },
      { person: 'PA', task: 'DA nedēļas sociālo mediju saturs', company: 'DA', companyColor: '#ff2d78', daysLate: 3 },
      { person: 'EL', task: 'VL booking foto atjaunošana', company: 'VL', companyColor: '#00e8fc', daysLate: 3 },
      { person: 'PA', task: 'MO jaunā produktu līnija — apraksti', company: 'MO', companyColor: '#a064ff', daysLate: 2 },
      { person: 'EL', task: 'DA evakuācijas plāna atjaunošana', company: 'DA', companyColor: '#ff2d78', daysLate: 2 },
      { person: 'PA', task: 'VL newsletter aprīļa sagatave', company: 'VL', companyColor: '#00e8fc', daysLate: 1 },
      { person: 'EL', task: 'MO cenrāža tulkojums EN', company: 'MO', companyColor: '#a064ff', daysLate: 1 },
    ],

    // 10 neuzņemtie (ilgākais pirmais)
    unassignedTasks: [
      { task: 'VL vasaras brošūras dizains', company: 'VL', companyColor: '#00e8fc', daysWaiting: 12 },
      { task: 'DA ventilācijas sistēmas serviss', company: 'DA', companyColor: '#ff2d78', daysWaiting: 10 },
      { task: 'GWM fleet apdrošināšanas atjaunošana', company: 'GWM', companyColor: '#00e8fc', daysWaiting: 9 },
      { task: 'MO jauno produktu foto sesija', company: 'MO', companyColor: '#a064ff', daysWaiting: 7 },
      { task: 'DA arēnas apkārtnes uzkopšana', company: 'DA', companyColor: '#ff2d78', daysWaiting: 6 },
      { task: 'VL sadarbības līgums ar Latvijas Radio', company: 'VL', companyColor: '#00e8fc', daysWaiting: 5 },
      { task: 'MO Instagram satura plāns aprīlim', company: 'MO', companyColor: '#a064ff', daysWaiting: 4 },
      { task: 'DA ugunsdzēsības pārbaudes organizēšana', company: 'DA', companyColor: '#ff2d78', daysWaiting: 3 },
      { task: 'VL Google Ads kampaņas optimizācija', company: 'VL', companyColor: '#00e8fc', daysWaiting: 2 },
      { task: 'MO piegādes apdrošināšanas polise', company: 'MO', companyColor: '#a064ff', daysWaiting: 1 },
    ],

    // 10 pēdējie padarītie (jaunākie pirmie)
    completedTasks: [
      { person: 'PA', task: 'VL sociālo mediju grafiks martam', company: 'VL', companyColor: '#00e8fc' },
      { person: 'EL', task: 'DA drošības protokola atjaunošana', company: 'DA', companyColor: '#ff2d78' },
      { person: 'PA', task: 'VL Booking.com profila atjaunošana', company: 'VL', companyColor: '#00e8fc' },
      { person: 'EL', task: 'DA ugunsdzēsības sistēmu pārbaude', company: 'DA', companyColor: '#ff2d78' },
      { person: 'PA', task: 'DA sponsoru saraksta izveide', company: 'DA', companyColor: '#ff2d78' },
      { person: 'EL', task: 'MO grāmatvedības dokumenti Q1', company: 'MO', companyColor: '#a064ff' },
      { person: 'PA', task: 'MO produktu foto apstrāde', company: 'MO', companyColor: '#a064ff' },
      { person: 'EL', task: 'DA personāla grafiks aprīlim', company: 'DA', companyColor: '#ff2d78' },
      { person: 'PA', task: 'VL newsletter marta izlaidums', company: 'VL', companyColor: '#00e8fc' },
      { person: 'EL', task: 'VL viesnīcu partnerību līgumi', company: 'VL', companyColor: '#00e8fc' },
    ],

    // 4. kolonna (pagaidām nemainīta)
    social: {
      headers: ['TT', 'FB', 'YT', 'LI'],
      rows: [
        { label: 'VL', values: ['+12', '+4', '-2', '+6'], colors: ['#00ff88', '#00ff88', '#ff4455', '#00ff88'] },
        { label: 'DA', values: ['+34', '+18', '+8', '+11'], colors: ['#00ff88', '#00ff88', '#00ff88', '#00ff88'] },
        { label: 'MO', values: ['+1', '+7', '-5', '+2'], colors: ['#ffaa00', '#00ff88', '#ff4455', '#ffaa00'] },
        { label: 'KĀ', values: ['+22', '+9', '+15', '+19'], colors: ['#00ff88', '#00ff88', '#00ff88', '#00ff88'] },
      ],
    },
    arena: {
      thisMonth: 187, change: 23, changePercent: 14,
      avgPerDay: 6.2, weekendFill: 94,
      weekBars: [60, 75, 45, 90, 100, 95, 70],
    },
    analytics: {
      live: [
        { label: 'VL', value: 47 },
        { label: 'DA', value: 23 },
        { label: 'MO', value: 12 },
      ],
      monthly: [
        { label: 'VL', value: '28.4K', change: '+11%', color: '#00ff88' },
        { label: 'DA', value: '9.2K', change: '+24%', color: '#00ff88' },
        { label: 'MO', value: '4.1K', change: '-3%', color: '#ff4455' },
      ],
    },
  };
}

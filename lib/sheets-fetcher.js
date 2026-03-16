// lib/sheets-fetcher.js
// Lasa Google Sheets datus — SocialBlade + Arēnas rezervācijas

export async function fetchSheetsData() {
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
  const socialSheetId = process.env.SHEET_ID_SOCIALBLADE;
  const arenaSheetId = process.env.SHEET_ID_RESERVATIONS;

  if (!apiKey || apiKey === 'xxxxx') {
    console.log('Sheets API key nav — mock dati');
    return null;
  }

  try {
    const results = {};

    // SocialBlade dati
    if (socialSheetId) {
      const socialRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${socialSheetId}/values/A1:Z50?key=${apiKey}`
      );
      if (socialRes.ok) {
        const socialData = await socialRes.json();
        results.social = parseSocialData(socialData.values);
      }
    }

    // Arēnas rezervācijas
    if (arenaSheetId) {
      const arenaRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${arenaSheetId}/values/A1:Z100?key=${apiKey}`
      );
      if (arenaRes.ok) {
        const arenaData = await arenaRes.json();
        results.arena = parseArenaData(arenaData.values);
      }
    }

    return results;
  } catch (error) {
    console.error('Sheets fetch kļūda:', error);
    return null;
  }
}

function parseSocialData(rows) {
  // TODO: Pielāgo pēc tavas Sheet struktūras
  // Pagaidām atgriež default formātu
  // Tava Sheet vajadzētu saturēt:
  // Kolonna A: Uzņēmums (VL, DA, MO, KĀ)
  // Kolonna B: TikTok %
  // Kolonna C: Facebook %
  // Kolonna D: YouTube %
  // Kolonna E: LinkedIn %
  return null;
}

function parseArenaData(rows) {
  // TODO: Pielāgo pēc tavas rezervāciju Sheet struktūras
  // Vajadzētu saturēt: datums, rezervāciju skaits
  return null;
}

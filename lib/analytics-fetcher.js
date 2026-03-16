// lib/analytics-fetcher.js
// Lasa Google Analytics 4 datus — live apmeklētāji + 30d statistika

export async function fetchAnalyticsData() {
  const credentialsJson = process.env.GA4_CREDENTIALS_JSON;
  const propertyVL = process.env.GA4_PROPERTY_ID_VL;
  const propertyDA = process.env.GA4_PROPERTY_ID_DA;
  const propertyMO = process.env.GA4_PROPERTY_ID_MO;

  if (!credentialsJson || credentialsJson.startsWith('{\"type')) {
    // Ja nav credentials, return null — izmantos mock
    if (!propertyVL) {
      console.log('GA4 nav konfigurēts — mock dati');
      return null;
    }
  }

  try {
    // TODO: Implementē GA4 Data API zvanus
    // Vajadzēs googleapis npm paketi:
    //
    // const { BetaAnalyticsDataClient } = require('@google-analytics/data');
    // const analyticsDataClient = new BetaAnalyticsDataClient({ credentials: JSON.parse(credentialsJson) });
    //
    // Live lietotāji:
    // const [realtimeResponse] = await analyticsDataClient.runRealtimeReport({
    //   property: `properties/${propertyVL}`,
    //   metrics: [{ name: 'activeUsers' }],
    // });
    //
    // 30d apmeklētāji:
    // const [response] = await analyticsDataClient.runReport({
    //   property: `properties/${propertyVL}`,
    //   dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
    //   metrics: [{ name: 'totalUsers' }],
    // });

    return null;
  } catch (error) {
    console.error('GA4 fetch kļūda:', error);
    return null;
  }
}

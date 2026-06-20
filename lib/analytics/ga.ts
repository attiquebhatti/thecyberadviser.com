import { BetaAnalyticsDataClient } from '@google-analytics/data';

// Reads GA4 service-account credentials. Two supported modes:
//   1. GA_KEY_FILE — absolute path to the service-account JSON (preferred locally;
//      keeps the secret in the file, never inlined).
//   2. GA_CLIENT_EMAIL + GA_PRIVATE_KEY — inline credentials (for hosts like
//      Hostinger where env vars are easier than shipping a key file).
function getClient(): { client: BetaAnalyticsDataClient; property: string } | null {
  const propertyId = process.env.GA_PROPERTY_ID;
  if (!propertyId) return null;

  const keyFile = process.env.GA_KEY_FILE;
  const clientEmail = process.env.GA_CLIENT_EMAIL;
  let privateKey = process.env.GA_PRIVATE_KEY;

  let client: BetaAnalyticsDataClient;
  if (keyFile) {
    client = new BetaAnalyticsDataClient({ keyFilename: keyFile });
  } else if (clientEmail && privateKey && !privateKey.includes('MIIE...')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
    client = new BetaAnalyticsDataClient({ credentials: { client_email: clientEmail, private_key: privateKey } });
  } else {
    return null;
  }
  return { client, property: `properties/${propertyId}` };
}

export function isGaConfigured(): boolean {
  if (!process.env.GA_PROPERTY_ID) return false;
  if (process.env.GA_KEY_FILE) return true;
  const pk = process.env.GA_PRIVATE_KEY || '';
  return !!(process.env.GA_CLIENT_EMAIL && pk && !pk.includes('MIIE...'));
}

export interface GaInsights {
  activeNow: number;
  totals: { activeUsers: number; newUsers: number; sessions: number; pageViews: number };
  trend: { date: string; users: number }[];
  topPages: { path: string; views: number }[];
  topCountries: { country: string; users: number }[];
  channels: { channel: string; sessions: number }[];
  rangeDays: number;
}

export async function getInsights(rangeDays = 28): Promise<GaInsights> {
  const ctx = getClient();
  if (!ctx) throw new Error('GA not configured');
  const { client, property } = ctx;

  // Realtime active users (last 30 min).
  const [realtime] = await client.runRealtimeReport({
    property, metrics: [{ name: 'activeUsers' }],
  });
  const activeNow = Number(realtime.rows?.[0]?.metricValues?.[0]?.value || 0);

  // Headline totals for the window.
  const [totalsRes] = await client.runReport({
    property,
    dateRanges: [{ startDate: `${rangeDays}daysAgo`, endDate: 'today' }],
    metrics: [
      { name: 'activeUsers' }, { name: 'newUsers' },
      { name: 'sessions' }, { name: 'screenPageViews' },
    ],
  });
  const tv = totalsRes.rows?.[0]?.metricValues || [];
  const totals = {
    activeUsers: Number(tv[0]?.value || 0),
    newUsers: Number(tv[1]?.value || 0),
    sessions: Number(tv[2]?.value || 0),
    pageViews: Number(tv[3]?.value || 0),
  };

  // Daily users trend.
  const [trendRes] = await client.runReport({
    property,
    dateRanges: [{ startDate: `${rangeDays}daysAgo`, endDate: 'today' }],
    dimensions: [{ name: 'date' }],
    metrics: [{ name: 'activeUsers' }],
    orderBys: [{ dimension: { dimensionName: 'date' } }],
  });
  const trend = (trendRes.rows || []).map((r) => {
    const d = r.dimensionValues?.[0]?.value || '';
    return {
      date: d.length === 8 ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}` : d,
      users: Number(r.metricValues?.[0]?.value || 0),
    };
  });

  // Top pages.
  const [pagesRes] = await client.runReport({
    property,
    dateRanges: [{ startDate: `${rangeDays}daysAgo`, endDate: 'today' }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [{ name: 'screenPageViews' }],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 10,
  });
  const topPages = (pagesRes.rows || []).map((r) => ({
    path: r.dimensionValues?.[0]?.value || '',
    views: Number(r.metricValues?.[0]?.value || 0),
  }));

  // Top countries.
  const [countriesRes] = await client.runReport({
    property,
    dateRanges: [{ startDate: `${rangeDays}daysAgo`, endDate: 'today' }],
    dimensions: [{ name: 'country' }],
    metrics: [{ name: 'activeUsers' }],
    orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
    limit: 8,
  });
  const topCountries = (countriesRes.rows || []).map((r) => ({
    country: r.dimensionValues?.[0]?.value || '',
    users: Number(r.metricValues?.[0]?.value || 0),
  }));

  // Acquisition channels.
  const [channelsRes] = await client.runReport({
    property,
    dateRanges: [{ startDate: `${rangeDays}daysAgo`, endDate: 'today' }],
    dimensions: [{ name: 'sessionDefaultChannelGroup' }],
    metrics: [{ name: 'sessions' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 8,
  });
  const channels = (channelsRes.rows || []).map((r) => ({
    channel: r.dimensionValues?.[0]?.value || '',
    sessions: Number(r.metricValues?.[0]?.value || 0),
  }));

  return { activeNow, totals, trend, topPages, topCountries, channels, rangeDays };
}

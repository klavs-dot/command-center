import { fetchGmailData } from '@/lib/gmail-fetcher';
import { analyzeEmails } from '@/lib/claude-fetcher';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET() {
  const results = {};

  // 1. Dabūjam e-pastus
  const gmail = await fetchGmailData();
  results.gmail = gmail ? `${gmail.total} e-pasti` : 'Nav';

  // 2. Sūtam Claude analīzei
  if (gmail?.recent?.length) {
    const ai = await analyzeEmails(gmail.recent);
    if (ai) {
      results.claude = `OK — ${ai.length} ieteikumi`;
      results.examples = ai.slice(0, 3).map(a => ({
        subject: a.subject,
        suggestion: a.suggestion,
        urgent: a.urgent,
      }));
    } else {
      results.claude = 'Claude neatbildēja';
    }
  } else {
    results.claude = 'Nav e-pastu ko analizēt';
  }

  results.keys = {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? 'Ir' : 'NAV',
    GOOGLE_REFRESH_TOKEN_1: process.env.GOOGLE_REFRESH_TOKEN_1 ? 'Ir' : 'NAV',
  };

  return Response.json(results);
}

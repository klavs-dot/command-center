// app/api/telegram/setup/route.js
// Atver šo linku vienu reizi lai piereģistrētu webhook

export const dynamic = 'force-dynamic';

export async function GET() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;

  if (!token || !baseUrl) {
    return Response.json({ error: 'Nav TELEGRAM_BOT_TOKEN vai VERCEL_URL' });
  }

  const webhookUrl = `https://${baseUrl}/api/telegram`;

  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: webhookUrl }),
  });

  const data = await res.json();

  return Response.json({
    status: data.ok ? 'Webhook iestatīts!' : 'Kļūda',
    webhook_url: webhookUrl,
    telegram_response: data,
  });
}

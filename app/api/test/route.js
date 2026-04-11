// app/api/test/route.js
export const dynamic = 'force-dynamic';

export async function GET() {
  const token = process.env.ASANA_ACCESS_TOKEN;
  const result = {
    tokenSet: !!token,
    tokenPrefix: token ? token.substring(0, 8) + '...' : 'NOT SET',
    envKeys: Object.keys(process.env).filter(k => k.includes('ASANA') || k.includes('GOOGLE') || k.includes('CLICKUP')),
  };

  if (token) {
    try {
      const res = await fetch('https://app.asana.com/api/1.0/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      result.asanaStatus = res.status;
      if (res.ok) {
        const data = await res.json();
        result.asanaUser = data.data?.name;
        result.asanaEmail = data.data?.email;
        result.workspaces = data.data?.workspaces?.map(w => w.name);
      } else {
        result.asanaError = await res.text();
      }
    } catch (e) {
      result.asanaError = e.message;
    }
  }

  return Response.json(result);
}

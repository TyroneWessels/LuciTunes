const jsonHeaders = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: jsonHeaders });
}

export function getBearerToken(request) {
  const authorization = request.headers.get('Authorization') || '';
  return authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
}

export async function getUser(request, env) {
  const token = getBearerToken(request);
  if (!token) return null;

  const response = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${token}`,
    },
  });

  return response.ok ? response.json() : null;
}

export async function supabaseRequest(env, path, options = {}) {
  const headers = new Headers(options.headers);
  headers.set('apikey', env.SUPABASE_SERVICE_ROLE_KEY);
  headers.set('Authorization', `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`);

  return fetch(`${env.SUPABASE_URL}${path}`, { ...options, headers });
}

export function serverError(error) {
  console.error(error);
  return json({ error: 'The request could not be completed.' }, 500);
}

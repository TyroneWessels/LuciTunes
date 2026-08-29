import { json, serverError } from '../_lib/supabase.js';

export async function onRequestPost({ request, env }) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) return json({ error: 'Email and password are required.' }, 400);

    const response = await fetch(`${env.SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();

    if (!response.ok) return json({ error: data.error_description || data.msg || 'Sign-in failed.' }, response.status);
    return json({ access_token: data.access_token, user: data.user });
  } catch (error) {
    return serverError(error);
  }
}

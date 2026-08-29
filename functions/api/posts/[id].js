import { getUser, json, serverError, supabaseRequest } from '../../_lib/supabase.js';

const publicFields = 'id,artist,title,genre,rating,note,reflection,spotify,image_url,featured,reviewer,created_at';

export async function onRequestGet({ env, params }) {
  try {
    const response = await supabaseRequest(env, `/rest/v1/public_posts?select=${encodeURIComponent(publicFields)}&id=eq.${encodeURIComponent(params.id)}`);
    const posts = await response.json();
    return posts.length ? json(posts[0]) : json({ error: 'Post not found.' }, 404);
  } catch (error) {
    return serverError(error);
  }
}

async function requireAuthor(request, env, id) {
  const user = await getUser(request, env);
  if (!user) return { error: json({ error: 'Please sign in first.' }, 401) };

  const response = await supabaseRequest(env, `/rest/v1/posts?select=id&id=eq.${encodeURIComponent(id)}&author_id=eq.${encodeURIComponent(user.id)}`);
  const posts = await response.json();
  return posts.length ? { user } : { error: json({ error: 'You cannot change this post.' }, 403) };
}

export async function onRequestPatch({ request, env, params }) {
  try {
    const authorization = await requireAuthor(request, env, params.id);
    if (authorization.error) return authorization.error;

    const post = await request.json();
    const response = await supabaseRequest(env, `/rest/v1/posts?id=eq.${encodeURIComponent(params.id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify(post),
    });
    const data = await response.json();
    return json(data, response.status);
  } catch (error) {
    return serverError(error);
  }
}

export async function onRequestDelete({ request, env, params }) {
  try {
    const authorization = await requireAuthor(request, env, params.id);
    if (authorization.error) return authorization.error;

    const response = await supabaseRequest(env, `/rest/v1/posts?id=eq.${encodeURIComponent(params.id)}`, { method: 'DELETE' });
    return response.ok ? new Response(null, { status: 204 }) : json({ error: 'The post could not be deleted.' }, response.status);
  } catch (error) {
    return serverError(error);
  }
}

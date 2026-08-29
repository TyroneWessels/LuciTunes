import { getUser, json, serverError, supabaseRequest } from '../_lib/supabase.js';

const publicFields = 'id,artist,title,genre,rating,note,reflection,spotify,image_url,featured,reviewer,created_at';

export async function onRequestGet({ request, env }) {
  try {
    const response = await supabaseRequest(env, `/rest/v1/public_posts?select=${encodeURIComponent(publicFields)}&order=created_at.desc`);
    const posts = await response.json();
    if (!response.ok) return json(posts, response.status);

    const user = await getUser(request, env);
    if (!user) return json(posts);

    const ownedResponse = await supabaseRequest(env, `/rest/v1/posts?select=id&author_id=eq.${encodeURIComponent(user.id)}`);
    const ownedPosts = await ownedResponse.json();
    const ownedIds = new Set(ownedPosts.map((post) => String(post.id)));
    return json(posts.map((post) => ({ ...post, can_edit: ownedIds.has(String(post.id)) })));
  } catch (error) {
    return serverError(error);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const user = await getUser(request, env);
    if (!user) return json({ error: 'Please sign in before publishing.' }, 401);

    const post = await request.json();
    const response = await supabaseRequest(env, '/rest/v1/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({ ...post, author_id: user.id }),
    });
    const data = await response.json();
    return json(data, response.status);
  } catch (error) {
    return serverError(error);
  }
}

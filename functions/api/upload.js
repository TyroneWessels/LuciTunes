import { getUser, json, serverError, supabaseRequest } from '../_lib/supabase.js';

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const maxFileSize = 5 * 1024 * 1024;

export async function onRequestPost({ request, env }) {
  try {
    const user = await getUser(request, env);
    if (!user) return json({ error: 'Please sign in before uploading.' }, 401);

    const form = await request.formData();
    const file = form.get('image');
    if (!(file instanceof File) || !allowedTypes.has(file.type) || file.size > maxFileSize) {
      return json({ error: 'Upload a JPG, PNG, or WebP image smaller than 5 MB.' }, 400);
    }

    const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
    const response = await supabaseRequest(env, `/storage/v1/object/post-images/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': file.type, 'x-upsert': 'false' },
      body: file.stream(),
    });
    if (!response.ok) return json({ error: 'The image could not be uploaded.' }, response.status);

    return json({ imageUrl: `${env.SUPABASE_URL}/storage/v1/object/public/post-images/${path}` }, 201);
  } catch (error) {
    return serverError(error);
  }
}

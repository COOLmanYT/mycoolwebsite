import { getSupabasePublic } from '../../lib/server/supabase.js';
import { sendJson, methodNotAllowed } from '../../lib/server/http.js';

export const config = { runtime: 'nodejs' };

/**
 * GET /api/supabase-blog/posts
 *
 * Returns all published blog posts ordered by created_at descending.
 * Responds with an array of post summaries (no markdown body).
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return methodNotAllowed(res, ['GET']);
  }

  try {
    const supabase = getSupabasePublic();
    const { data, error } = await supabase
      .from('blogs')
      .select('id, title, slug, warnings, created_at, updated_at, author_id')
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error fetching posts', error);
      return sendJson(res, 500, { error: 'Failed to fetch posts' });
    }

    sendJson(res, 200, { posts: data ?? [] });
  } catch (err) {
    console.error('Unexpected error in /api/supabase-blog/posts', err);
    sendJson(res, 500, { error: 'Internal server error' });
  }
}

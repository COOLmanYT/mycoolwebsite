import { getSupabasePublic } from '../../lib/server/supabase.js';
import { sendJson, methodNotAllowed } from '../../lib/server/http.js';
import { renderMarkdown } from '../../lib/server/markdown.js';

export const config = { runtime: 'nodejs' };

/**
 * GET /api/supabase-blog/post?slug=<slug>
 *
 * Returns a single published blog post with rendered HTML content.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return methodNotAllowed(res, ['GET']);
  }

  try {
    const url = new URL(req.url, 'http://localhost');
    const slug = (url.searchParams.get('slug') || '').trim();

    if (!slug) {
      return sendJson(res, 400, { error: 'slug query parameter is required' });
    }

    const supabase = getSupabasePublic();
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .single();

    if (error || !data) {
      return sendJson(res, 404, { error: 'Post not found' });
    }

    const contentHtml = await renderMarkdown(data.content_markdown);

    sendJson(res, 200, {
      post: {
        id: data.id,
        title: data.title,
        slug: data.slug,
        contentHtml,
        warnings: data.warnings ?? [],
        created_at: data.created_at,
        updated_at: data.updated_at,
        author_id: data.author_id,
      },
    });
  } catch (err) {
    console.error('Unexpected error in /api/supabase-blog/post', err);
    sendJson(res, 500, { error: 'Internal server error' });
  }
}

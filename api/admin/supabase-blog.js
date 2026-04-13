import { requireAllowlistedSession } from '../../lib/server/auth.js';
import { readJsonBody, sendJson, methodNotAllowed } from '../../lib/server/http.js';
import { getSupabaseAdmin } from '../../lib/server/supabase.js';

export const config = { runtime: 'nodejs' };

/**
 * Admin blog CRUD endpoint backed by Supabase.
 *
 * GET    /api/admin/supabase-blog?slug=<slug>   — fetch single post (all fields)
 * GET    /api/admin/supabase-blog               — list all posts (published + drafts)
 * POST   /api/admin/supabase-blog               — create post  { title, slug, content_markdown, warnings?, published? }
 * PUT    /api/admin/supabase-blog               — update post  { id, ...fields }
 * DELETE /api/admin/supabase-blog               — delete post  { id }
 */
export default async function handler(req, res) {
  const auth = await requireAllowlistedSession(req, res);
  if (!auth) return;

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  switch (req.method) {
    case 'GET':
      return handleGet(req, res);
    case 'POST':
      return handleCreate(req, res);
    case 'PUT':
      return handleUpdate(req, res);
    case 'DELETE':
      return handleDelete(req, res);
    default:
      return methodNotAllowed(res, ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']);
  }
}

async function handleGet(req, res) {
  try {
    const supabase = getSupabaseAdmin();
    const url = new URL(req.url, 'http://localhost');
    const slug = (url.searchParams.get('slug') || '').trim();

    if (slug) {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error || !data) {
        return sendJson(res, 404, { error: 'Post not found' });
      }

      return sendJson(res, 200, { post: data });
    }

    // List all posts
    const { data, error } = await supabase
      .from('blogs')
      .select('id, title, slug, warnings, published, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase list error', error);
      return sendJson(res, 500, { error: 'Failed to fetch posts' });
    }

    sendJson(res, 200, { posts: data ?? [] });
  } catch (err) {
    console.error('Admin blog GET failed', err);
    sendJson(res, 500, { error: 'Internal server error' });
  }
}

async function handleCreate(req, res) {
  try {
    const body = await readJsonBody(req);
    const { title, slug, content_markdown, warnings, published } = body;

    if (!title || !slug || !content_markdown) {
      return sendJson(res, 400, { error: 'title, slug, and content_markdown are required' });
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      return sendJson(res, 400, { error: 'Slug must use lowercase letters, numbers, and hyphens only' });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('blogs')
      .insert({
        title: String(title).trim(),
        slug: String(slug).trim(),
        content_markdown: String(content_markdown),
        warnings: Array.isArray(warnings) ? warnings : null,
        published: Boolean(published),
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error', error);
      if (error.code === '23505') {
        return sendJson(res, 409, { error: 'A post with that slug already exists' });
      }
      return sendJson(res, 500, { error: 'Failed to create post' });
    }

    sendJson(res, 201, { post: data });
  } catch (err) {
    console.error('Admin blog POST failed', err);
    sendJson(res, 500, { error: 'Internal server error' });
  }
}

async function handleUpdate(req, res) {
  try {
    const body = await readJsonBody(req);
    const { id, title, slug, content_markdown, warnings, published } = body;

    if (!id) {
      return sendJson(res, 400, { error: 'id is required' });
    }

    if (slug && !/^[a-z0-9-]+$/.test(slug)) {
      return sendJson(res, 400, { error: 'Slug must use lowercase letters, numbers, and hyphens only' });
    }

    const updates = {};
    if (title !== undefined) updates.title = String(title).trim();
    if (slug !== undefined) updates.slug = String(slug).trim();
    if (content_markdown !== undefined) updates.content_markdown = String(content_markdown);
    if (warnings !== undefined) updates.warnings = Array.isArray(warnings) ? warnings : null;
    if (published !== undefined) updates.published = Boolean(published);

    if (Object.keys(updates).length === 0) {
      return sendJson(res, 400, { error: 'No fields to update' });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('blogs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error', error);
      if (error.code === '23505') {
        return sendJson(res, 409, { error: 'A post with that slug already exists' });
      }
      return sendJson(res, 500, { error: 'Failed to update post' });
    }

    if (!data) {
      return sendJson(res, 404, { error: 'Post not found' });
    }

    sendJson(res, 200, { post: data });
  } catch (err) {
    console.error('Admin blog PUT failed', err);
    sendJson(res, 500, { error: 'Internal server error' });
  }
}

async function handleDelete(req, res) {
  try {
    const body = await readJsonBody(req);
    const { id } = body;

    if (!id) {
      return sendJson(res, 400, { error: 'id is required' });
    }

    const supabase = getSupabaseAdmin();
    const { error, count } = await supabase
      .from('blogs')
      .delete({ count: 'exact' })
      .eq('id', id);

    if (error) {
      console.error('Supabase delete error', error);
      return sendJson(res, 500, { error: 'Failed to delete post' });
    }

    if (count === 0) {
      return sendJson(res, 404, { error: 'Post not found' });
    }

    sendJson(res, 200, { deleted: true, id });
  } catch (err) {
    console.error('Admin blog DELETE failed', err);
    sendJson(res, 500, { error: 'Internal server error' });
  }
}

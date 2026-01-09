import { readJsonBody, sendJson, methodNotAllowed } from '../../lib/server/http.js';

const OWNER = process.env.GITHUB_OWNER || 'RandomInternetUser3000';
const REPO = process.env.GITHUB_REPO || 'mycoolwebsite';
const BRANCH = process.env.ALLOWLIST_BRANCH || 'main';
const FILE_PATH = 'content/webhooks.json';
const API_BASE = 'https://api.github.com';

export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method !== 'POST') {
    methodNotAllowed(res, ['POST', 'OPTIONS']);
    return;
  }

  try {
    const body = await readJsonBody(req);
    const message = (body.message || '').toString().trim();
    const embed = body.embed && typeof body.embed === 'object' ? body.embed : undefined;
    const ids = Array.isArray(body.ids) ? body.ids.map((v) => v.toString()) : [];
    if (!message) {
      throw Object.assign(new Error('Message is required'), { statusCode: 400 });
    }

    const configPayload = await fetchWebhooksConfig();
    const available = Array.isArray(configPayload.webhooks) ? configPayload.webhooks : [];
    const targets = ids.length ? available.filter((w) => ids.includes(String(w.id))) : available;
    const uniqueTargets = dedupeUrls(targets);

    if (!uniqueTargets.length) {
      throw Object.assign(new Error('No saved webhooks available. Add a webhook first.'), { statusCode: 400 });
    }

    const results = await Promise.all(
      uniqueTargets.map(async (hook) => {
        try {
          await sendWebhook(hook.url, message, embed);
          return { id: hook.id, url: hook.url, ok: true };
        } catch (error) {
          return { id: hook.id, url: hook.url, ok: false, error: error.message };
        }
      }),
    );

    const sent = results.filter((r) => r.ok).length;
    const failed = results.filter((r) => !r.ok);
    const status = failed.length === results.length ? 502 : 200;
    sendJson(res, status, { sent, failed });
  } catch (error) {
    const status = error.statusCode || 500;
    sendJson(res, status, { error: error.message || 'Failed to send webhook.' });
  }
}

function dedupeUrls(list) {
  const seen = new Set();
  const out = [];
  list.forEach((hook) => {
    const url = (hook.url || '').trim();
    if (!url || seen.has(url)) return;
    seen.add(url);
    out.push({ id: hook.id?.toString?.() || url, url, label: hook.label || 'Webhook' });
  });
  return out;
}

async function fetchWebhooksConfig() {
  const token = process.env.ALLOWLIST_GITHUB_TOKEN;
  const fs = await import('node:fs/promises');
  const pathMod = await import('node:path');
  if (!token) {
    // Read from local file if token not set (local dev)
    const abs = pathMod.default.join(process.cwd(), FILE_PATH);
    try {
      const raw = await fs.readFile(abs, 'utf8');
      return JSON.parse(raw);
    } catch (error) {
      if (error.code === 'ENOENT') return { webhooks: [] };
      throw error;
    }
  }

  const res = await fetch(`${API_BASE}/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(FILE_PATH)}?ref=${encodeURIComponent(BRANCH)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': `${OWNER}-${REPO}-admin-panel`,
      Accept: 'application/vnd.github+json',
    },
  });

  if (res.status === 404) {
    return { webhooks: [] };
  }

  if (!res.ok) {
    const err = new Error(`GitHub API error ${res.status}`);
    err.statusCode = res.status;
    throw err;
  }

  const payload = await res.json();
  const content = Buffer.from(payload.content, payload.encoding || 'base64').toString('utf8');
  return JSON.parse(content);
}

async function sendWebhook(url, message, embed) {
  const body = embed ? { content: message, embeds: [embed] } : { content: message };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    const err = new Error(`Webhook responded with ${res.status} ${errText}`.trim());
    err.statusCode = res.status;
    throw err;
  }
}

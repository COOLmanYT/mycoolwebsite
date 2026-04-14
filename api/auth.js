import {
  createStateToken,
  buildStateCookie,
  buildSessionCookie,
  clearSessionCookie,
  clearStateCookie,
  verifyStateCookie,
  requiredEnv,
} from '../lib/server/auth.js';
import { fetchAllowlistFromGithub } from '../lib/server/allowlist.js';

export const config = { runtime: 'nodejs' };

/**
 * Consolidated auth handler — dispatches based on URL path:
 *
 *   GET  /api/auth/login    → start GitHub OAuth flow
 *   GET  /api/auth/callback → complete GitHub OAuth flow
 *   POST /api/auth/logout   → clear session / state cookies
 */
export default async function handler(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname.replace(/\/$/, '');

  if (pathname.endsWith('/login')) {
    return handleLogin(req, res);
  }
  if (pathname.endsWith('/callback')) {
    return handleCallback(req, res);
  }
  if (pathname.endsWith('/logout')) {
    return handleLogout(req, res);
  }

  res.statusCode = 404;
  res.end('Not Found');
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

function deriveBaseUrl(req) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host || 'localhost:3000';
  return `${proto}://${host}`;
}

async function handleLogin(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET');
    res.end('Method Not Allowed');
    return;
  }

  const clientId = requiredEnv('GITHUB_CLIENT_ID');
  const baseUrl = process.env.SITE_BASE_URL || deriveBaseUrl(req);
  const callbackUrl = `${baseUrl.replace(/\/?$/, '')}/api/auth/callback`;
  const state = createStateToken();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    scope: 'read:user',
    state,
  });

  res.setHeader('Set-Cookie', buildStateCookie(state));
  res.statusCode = 302;
  res.setHeader('Location', `https://github.com/login/oauth/authorize?${params.toString()}`);
  res.end();
}

// ---------------------------------------------------------------------------
// Callback
// ---------------------------------------------------------------------------

function buildCallbackUrl(req) {
  const baseUrl = process.env.SITE_BASE_URL || deriveBaseUrl(req);
  return `${baseUrl.replace(/\/?$/, '')}/api/auth/callback`;
}

async function exchangeCodeForToken(code, redirectUri) {
  const clientId = requiredEnv('GITHUB_CLIENT_ID');
  const clientSecret = requiredEnv('GITHUB_CLIENT_SECRET');
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
  });
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });
  if (!response.ok) {
    throw new Error(`Token exchange failed (${response.status})`);
  }
  const payload = await response.json();
  if (!payload.access_token) {
    throw new Error('No access token returned');
  }
  return payload.access_token;
}

async function fetchGithubProfile(token) {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'mycoolwebsite-admin-panel',
      Accept: 'application/vnd.github+json',
    },
  });
  if (!response.ok) {
    throw new Error(`GitHub profile request failed (${response.status})`);
  }
  return response.json();
}

async function handleCallback(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET');
    res.end('Method Not Allowed');
    return;
  }

  const url = new URL(req.url, deriveBaseUrl(req));
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (!code || !state) {
    res.statusCode = 400;
    res.end('Missing OAuth parameters');
    return;
  }

  if (!verifyStateCookie(state, req.headers.cookie || req.headers.Cookie || '')) {
    res.statusCode = 400;
    res.end('Invalid OAuth state');
    return;
  }

  try {
    const token = await exchangeCodeForToken(code, buildCallbackUrl(req));
    const profile = await fetchGithubProfile(token);
    const allowlist = await fetchAllowlistFromGithub();
    const normalized = allowlist.users.map((user) => user.toLowerCase());

    if (!profile?.login || !normalized.includes(profile.login.toLowerCase())) {
      res.statusCode = 403;
      res.end('Your GitHub account is not on the allow list.');
      return;
    }

    const sessionCookie = buildSessionCookie(profile);
    res.setHeader('Set-Cookie', [clearStateCookie(), sessionCookie]);
    res.statusCode = 302;
    res.setHeader('Location', '/admin');
    res.end();
  } catch (error) {
    console.error('OAuth callback failed', error);
    res.statusCode = 500;
    res.end('Authentication failed. Check server logs.');
  }
}

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

async function handleLogout(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    res.end('Method Not Allowed');
    return;
  }

  res.setHeader('Set-Cookie', [clearSessionCookie(), clearStateCookie()]);
  res.statusCode = 204;
  res.end();
}

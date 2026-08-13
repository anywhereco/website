/* Heredita API client — talks to the Heredita game API (OAuth2 password
 * grant + bearer). The base URL and play URL are configurable via Astro env
 * so the site can be pointed at a local/debug server during development.
 *
 * Env (see .env.example):
 *   PUBLIC_HEREDITA_API            base API URL    (default https://app.heredita.net)
 *   PUBLIC_HEREDITA_PLAY_URL       game app URL    (default https://app.heredita.net/app/)
 *   PUBLIC_HEREDITA_CORS_ORIGINS   extra allowed <origin> entries, comma-separated
 *   PUBLIC_HEREDITA_ALLOW_ALL_CORS "true" to skip the origin gate (debug servers)
 */

const envApiBase = (import.meta.env.PUBLIC_HEREDITA_API as string | undefined)?.trim();
const envPlayUrl = (import.meta.env.PUBLIC_HEREDITA_PLAY_URL as string | undefined)?.trim();

export const BASE = envApiBase || 'https://app.heredita.net';
export const PLAY_URL = envPlayUrl || 'https://app.heredita.net/app/';

const ALLOW_ALL_CORS = (import.meta.env.PUBLIC_HEREDITA_ALLOW_ALL_CORS as string | undefined) === 'true';

const DEFAULT_ORIGINS = ['https://heredita.net', 'https://www.heredita.net', 'https://here-plum.vercel.app'];
const EXTRA_ORIGINS = (
  (import.meta.env.PUBLIC_HEREDITA_CORS_ORIGINS as string | undefined) || ''
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const ALLOWED_ORIGINS = [...DEFAULT_ORIGINS, ...EXTRA_ORIGINS];

export type ApiError =
  | 'network'
  | 'cors'
  | 'ratelimited'
  | 'unauthorized'
  | 'forbidden'
  | 'notfound'
  | 'validation'
  | 'taken'
  | 'invalid'
  | 'server'
  | 'unknown';

export type ApiResult<T = unknown> =
  | { ok: true } & T
  | { ok: false; error: ApiError; status: number; message: string; cause?: string };

export function isProdOrigin() {
  return ALLOW_ALL_CORS || ALLOWED_ORIGINS.includes(location.origin);
}
export function isLocalOrigin() {
  const h = location.hostname;
  return h === 'localhost' || h === '127.0.0.1' || h === '' || location.protocol === 'file:';
}
export function isCorsBlockedOrigin() {
  return !isProdOrigin();
}

function asForm(obj: Record<string, unknown>) {
  const fd = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v != null) fd.append(k, String(v));
  });
  return fd;
}

function friendlyMessage(code: ApiError) {
  switch (code) {
    case 'network':
      return 'Could not reach Heredita servers.';
    case 'cors':
      return 'Heredita API not reachable from this origin. Ask the game team to whitelist this domain in their CORS list.';
    case 'ratelimited':
      return 'Too many attempts — slow down a moment.';
    case 'unauthorized':
      return 'Wrong username or password.';
    case 'forbidden':
      return 'Your account is not allowed to do that.';
    case 'notfound':
      return 'No account with that name.';
    case 'taken':
      return 'That username is already taken.';
    case 'validation':
      return 'Some fields look wrong.';
    case 'server':
      return 'Heredita servers had a hiccup. Try again.';
    default:
      return 'Something went wrong.';
  }
}

async function errorFromResponse(res: Response): Promise<ApiResult> {
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    /* ignore */
  }
  const msg = body && (body.detail || body.message);
  const detailStr = Array.isArray(msg)
    ? msg.map((d: any) => d.msg || JSON.stringify(d)).join('; ')
    : typeof msg === 'string'
      ? msg
      : null;

  let code: ApiError = 'unknown';
  switch (res.status) {
    case 401:
      code = 'unauthorized';
      break;
    case 403:
      code = 'forbidden';
      break;
    case 404:
      code = 'notfound';
      break;
    case 409:
      code = 'taken';
      break;
    case 422:
      code = 'validation';
      break;
    case 429:
      code = 'ratelimited';
      break;
    default:
      code = res.status >= 500 ? 'server' : 'unknown';
  }
  return {
    ok: false,
    error: code,
    status: res.status,
    message: detailStr || friendlyMessage(code),
  };
}

function networkError(e: unknown): ApiResult {
  const cors = isCorsBlockedOrigin();
  const code: ApiError = cors ? 'cors' : 'network';
  return {
    ok: false,
    error: code,
    status: 0,
    message: friendlyMessage(code),
    cause: e instanceof Error ? e.message : String(e),
  };
}

async function fetchWithTimeout(url: string, init: RequestInit = {}, ms = 8000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    return await fetch(url, Object.assign({}, init, { signal: ctl.signal }));
  } finally {
    clearTimeout(t);
  }
}

/* ---- auth ---- */
export async function register(
  username: string,
  password: string,
  email?: string
): Promise<ApiResult<{ userId: number }>> {
  const qs = new URLSearchParams({ username, password });
  if (email) qs.set('email', email);
  let res: Response;
  try {
    res = await fetchWithTimeout(`${BASE}/auth/users/new`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: qs
    });
  } catch (e) {
    return networkError(e);
  }
  if (!res.ok) return errorFromResponse(res);
  const userId = await res.json();
  return { ok: true, userId };
}

export async function login(
  username: string,
  password: string
): Promise<ApiResult<{ token: string; tokenType?: string }>> {
  let res: Response;
  try {
    res = await fetchWithTimeout(`${BASE}/auth/token`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: asForm({ grant_type: 'password', username, password }),
    });
  } catch (e) {
    return networkError(e);
  }
  if (!res.ok) return errorFromResponse(res);
  const body = await res.json();
  if (!body || typeof body.access_token !== 'string') {
    return { ok: false, error: 'unknown', status: 200, message: 'Bad token response from server.' };
  }
  return { ok: true, token: body.access_token, tokenType: body.token_type || 'bearer' };
}

export async function verifyTokenId(
  username: string,
  token: string
): Promise<ApiResult<{ userId: number }>> {
  let res: Response;
  try {
    const qs = new URLSearchParams({ username, token });
    res = await fetchWithTimeout(`${BASE}/users/verify/id?${qs.toString()}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
  } catch (e) {
    return networkError(e);
  }
  if (!res.ok) return errorFromResponse(res);
  const id = await res.json();
  if (typeof id !== 'number' || id < 0) {
    return { ok: false, error: 'unauthorized', status: 200, message: 'Session expired.' };
  }
  return { ok: true, userId: id };
}

export async function getMe(
  token: string
): Promise<ApiResult<{ user: any }>> {
  let res: Response;
  try {
    res = await fetchWithTimeout(`${BASE}/users/me`, {
      method: 'GET',
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    });
  } catch (e) {
    return networkError(e);
  }
  if (!res.ok) return errorFromResponse(res);
  const user = await res.json();
  return { ok: true, user };
}

/* ---- friends ---- */
export async function getFriends(
  token: string
): Promise<ApiResult<{ friends: any[] }>> {
  let res: Response;
  try {
    res = await fetchWithTimeout(`${BASE}/users/friends/`, {
      method: 'GET',
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    });
  } catch (e) {
    return networkError(e);
  }
  if (!res.ok) return errorFromResponse(res);
  const data = await res.json();
  return { ok: true, friends: (data && data.friends) || [] };
}

export async function sendFriendRequest(
  token: string,
  username: string
): Promise<ApiResult> {
  let res: Response;
  try {
    res = await fetchWithTimeout(
      `${BASE}/users/friends/${encodeURIComponent(username)}`,
      {
        method: 'POST',
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      }
    );
  } catch (e) {
    return networkError(e);
  }
  if (!res.ok) return errorFromResponse(res);
  return { ok: true };
}

export async function removeFriend(
  token: string,
  username: string
): Promise<ApiResult> {
  let res: Response;
  try {
    res = await fetchWithTimeout(
      `${BASE}/users/friends/${encodeURIComponent(username)}`,
      {
        method: 'DELETE',
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      }
    );
  } catch (e) {
    return networkError(e);
  }
  if (!res.ok) return errorFromResponse(res);
  return { ok: true };
}

export async function acceptFriendRequest(
  token: string,
  username: string
): Promise<ApiResult> {
  let res: Response;
  try {
    res = await fetchWithTimeout(
      `${BASE}/users/friends/requests/${encodeURIComponent(username)}`,
      {
        method: 'POST',
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      }
    );
  } catch (e) {
    return networkError(e);
  }
  if (!res.ok) return errorFromResponse(res);
  return { ok: true };
}

export async function declineFriendRequest(
  token: string,
  username: string
): Promise<ApiResult> {
  let res: Response;
  try {
    res = await fetchWithTimeout(
      `${BASE}/users/friends/requests/${encodeURIComponent(username)}`,
      {
        method: 'DELETE',
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      }
    );
  } catch (e) {
    return networkError(e);
  }
  if (!res.ok) return errorFromResponse(res);
  return { ok: true };
}

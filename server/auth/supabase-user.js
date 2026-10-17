export async function getVerifiedUserId(req, { env = process.env, fetchImpl = globalThis.fetch, timeoutMs = 3500 } = {}) {
  const rawHeader = req?.headers?.authorization ?? req?.headers?.Authorization;
  const header = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
  const match = typeof header === 'string' ? /^Bearer\s+(.+)$/i.exec(header.trim()) : null;
  const token = match?.[1]?.trim();
  const projectUrl = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!projectUrl || !anonKey || !token || token.length > 8192 || /\s/.test(token)) return null;
  if (typeof fetchImpl !== 'function') return null;

  let endpoint;
  try {
    const base = new URL(projectUrl);
    if (base.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(base.hostname)) return null;
    endpoint = new URL('/auth/v1/user', base);
  } catch {
    return null;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(endpoint, {
      method: 'GET',
      headers: { apikey: anonKey, Authorization: `Bearer ${token}`, Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const user = await response.json();
    return typeof user?.id === 'string' && user.id.length > 0 && user.id.length <= 128 ? user.id : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

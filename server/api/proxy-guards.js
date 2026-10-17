const requestBuckets = new Map();

export function isSameOriginRequest(req) {
  const origin = req.headers?.origin;
  const forwardedHost = req.headers?.['x-forwarded-host'];
  const host = String(forwardedHost || req.headers?.host || '').split(',')[0].trim().toLowerCase();
  if (!origin || !host) return false;

  try {
    const parsed = new URL(origin);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.host.toLowerCase() === host;
  } catch {
    return false;
  }
}

function clientAddress(req) {
  const realIp = req.headers?.['x-real-ip'];
  const forwardedFor = req.headers?.['x-forwarded-for'];
  const address = realIp || (Array.isArray(forwardedFor) ? forwardedFor[0] : String(forwardedFor || '').split(',')[0]);
  return String(address || req.socket?.remoteAddress || 'unknown').trim() || 'unknown';
}

// Best-effort process-local throttling. Deployments with sustained public traffic
// should also enforce a shared limit at the platform edge or in a shared store.
export function allowRateLimit(req, route, limit, windowMs, now = Date.now()) {
  if (requestBuckets.size >= 5000) {
    for (const [key, bucket] of requestBuckets) {
      if (bucket.resetAt <= now) requestBuckets.delete(key);
    }
    if (requestBuckets.size >= 5000) return false;
  }

  const key = `${route}:${clientAddress(req)}`;
  let bucket = requestBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) bucket = { count: 0, resetAt: now + windowMs };
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  requestBuckets.set(key, bucket);
  return true;
}

'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getSupabaseBrowserClient } from '../lib/supabase-browser';

const ENABLED_KEY = 'edgex_history_enabled';
const ACTIVITY_KEY = 'edgex_v2_activity';

function domainFor(pathname: string) {
  if (pathname.startsWith('/sports')) return 'sports';
  if (pathname.startsWith('/markets')) return 'markets';
  if (pathname.startsWith('/assets/fx')) return 'forex';
  if (pathname.startsWith('/assets')) return 'crypto';
  if (pathname.startsWith('/saved')) return 'saved';
  return 'overview';
}
function labelFor(pathname: string) {
  if (pathname === '/') return 'Overview';
  return pathname.split('/').filter(Boolean).map(part => part.replace(/[-_]/g, ' ').replace(/\b\w/g, value => value.toUpperCase())).join(' / ').slice(0, 160);
}

export default function ActivityTracker() {
  const pathname = usePathname();
  const client = getSupabaseBrowserClient();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const syncPreference = () => setEnabled(window.localStorage.getItem(ENABLED_KEY) === 'true');
    syncPreference();
    window.addEventListener('storage', syncPreference);
    window.addEventListener('edgex:history-setting', syncPreference);
    return () => {
      window.removeEventListener('storage', syncPreference);
      window.removeEventListener('edgex:history-setting', syncPreference);
    };
  }, []);

  useEffect(() => {
    if (!enabled || !pathname || pathname === '/sign-in' || pathname === '/auth/callback') return;
    const route = pathname.slice(0, 300);
    const dedupeKey = `edgex_history_last:${route}`;
    const now = Date.now();
    const last = Number(window.sessionStorage.getItem(dedupeKey) || 0);
    if (now - last < 60_000) return;
    window.sessionStorage.setItem(dedupeKey, String(now));
    let active = true;

    void (async () => {
      const domain = domainFor(route);
      if (client) {
        try {
          const { data, error } = await client.auth.getUser();
          if (!active) return;
          if (!error && data.user) {
            await client.from('activity_history').insert({ domain, route });
            return;
          }
        } catch {
          if (!active) return;
        }
      }
      if (!active) return;
      try {
        const raw = JSON.parse(window.localStorage.getItem(ACTIVITY_KEY) || '[]');
        const current = Array.isArray(raw) ? raw : [];
        const item = { subject: labelFor(route), type: domain, path: route, timestamp: now };
        window.localStorage.setItem(ACTIVITY_KEY, JSON.stringify([item, ...current].slice(0, 100)));
      } catch { /* Browser storage may be disabled; history remains optional. */ }
    })().catch(() => {});

    return () => { active = false; };
  }, [client, enabled, pathname]);

  return null;
}

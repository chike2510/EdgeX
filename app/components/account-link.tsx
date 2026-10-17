'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '../lib/supabase-browser';

export default function AccountLink() {
  const client = getSupabaseBrowserClient();
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    if (!client) return;
    let mounted = true;
    client.auth.getUser().then(({ data }) => { if (mounted) setEmail(data.user?.email || null); });
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      if (mounted) setEmail(session?.user?.email || null);
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, [client]);
  return <Link className="account-link" href="/sign-in">{email ? 'Account' : 'Sign in'}</Link>;
}

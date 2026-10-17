'use client';

import { useEffect, useState } from 'react';
import type { EmailOtpType } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '../../lib/supabase-browser';

export default function AuthCallbackPage() {
  const [message, setMessage] = useState('Completing sign-in…');
  const client = getSupabaseBrowserClient();
  useEffect(() => {
    if (!client) { setMessage('Account sign-in is not configured for this app yet.'); return; }
    let mounted = true;
    void (async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      const tokenHash = url.searchParams.get('token_hash');
      const type = url.searchParams.get('type');
      let error: Error | null = null;
      if (code) {
        const result = await client.auth.exchangeCodeForSession(code);
        error = result.error;
      } else if (tokenHash && type) {
        const result = await client.auth.verifyOtp({ token_hash: tokenHash, type: type as EmailOtpType });
        error = result.error;
      } else {
        const result = await client.auth.getSession();
        error = result.error || (!result.data.session ? new Error('No sign-in session was returned.') : null);
      }
      if (error) { if (mounted) setMessage('The sign-in link is invalid or expired. Return to Sign in and request a new link.'); return; }
      window.location.replace('/saved');
    })().catch(() => { if (mounted) setMessage('Sign-in could not be completed. Return to Sign in and try again.'); });
    return () => { mounted = false; };
  }, [client]);
  return <section className="card"><span className="eyebrow">Authentication</span><h1>Account sign-in</h1><p className="lede" role="status">{message}</p></section>;
}

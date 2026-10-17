'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { getSupabaseBrowserClient, supabaseBrowserConfigured } from '../lib/supabase-browser';

export default function AuthPanel() {
  const client = getSupabaseBrowserClient();
  const configured = supabaseBrowserConfigured();
  const [email, setEmail] = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!client) return;
    let mounted = true;
    client.auth.getUser().then(({ data }) => { if (mounted) setUserEmail(data.user?.email || null); });
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      if (mounted) setUserEmail(session?.user?.email || null);
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, [client]);

  async function sendMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client || !email.trim()) return;
    setBusy(true); setMessage(''); setError('');
    const { error: authError } = await client.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (authError) setError('The sign-in link could not be sent. Check the configured auth provider and try again.');
    else setMessage('Check your email for a sign-in link. It will return to this EdgeX app.');
    setBusy(false);
  }

  async function signInWithGoogle() {
    if (!client) return;
    setBusy(true); setMessage(''); setError('');
    const { error: authError } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (authError) { setError('Google sign-in is not configured for this Supabase project.'); setBusy(false); }
  }

  async function signOut() {
    if (!client) return;
    setBusy(true); setError('');
    const { error: authError } = await client.auth.signOut();
    if (authError) setError('Sign-out could not be completed.');
    setBusy(false);
  }

  return <section className="card auth-panel">
    <div className="card-top"><div><span className="eyebrow">Account</span><h2>{userEmail ? 'Signed in' : 'Sign in to EdgeX'}</h2></div><span className="chip">Supabase Auth</span></div>
    {!configured ? <div className="notice">Account authentication is not configured yet. Supabase project setup is pending; no local-only value is presented as a verified account.</div> : userEmail ? <>
      <p>Signed in as <strong>{userEmail}</strong>. Saved research will use the account’s row-level-security-protected records.</p>
      <div className="actions"><button className="button" type="button" onClick={signOut} disabled={busy}>{busy ? 'Working…' : 'Sign out'}</button><Link className="button" href="/saved">View saved research</Link></div>
    </> : <>
      <p>Use an email magic link or the project’s configured Google sign-in provider.</p>
      <form className="research-form" onSubmit={sendMagicLink}>
        <div className="form-grid"><label>Email address<input type="email" required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" /></label></div>
        <div className="actions"><button className="button" type="submit" disabled={busy || !email.trim()}>{busy ? 'Sending…' : 'Send magic link'}</button><button className="button" type="button" onClick={signInWithGoogle} disabled={busy}>{busy ? 'Working…' : 'Continue with Google'}</button></div>
      </form>
    </>}
    {message ? <p role="status" className="auth-message">{message}</p> : null}
    {error ? <p role="alert" className="review-error">{error}</p> : null}
  </section>;
}

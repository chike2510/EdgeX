'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '../lib/supabase-browser';

type Domain = 'sports' | 'markets' | 'crypto' | 'forex';
type SavedItem = { id: string; domain?: Domain; subject?: string; title?: string; summary?: string; evidence?: unknown; analysis?: unknown; created_at?: string; timestamp?: string | number; verdict?: string; _localIndex?: number };
type WatchItem = { id: string; domain: Domain; symbol: string; label: string; created_at: string };
type NoteItem = { id: string; domain: Domain; subject: string; body: string; created_at: string };
type HistoryItem = { id: string; domain: string; route: string; viewed_at: string };
type LocalHistory = { id: string; subject: string; type: string; path?: string; timestamp?: string | number; _localIndex: number };

const STORAGE_KEY = 'edgex_v2_saved_analysis';
const FAVORITES_KEY = 'edgex_v2_favorites';
const HISTORY_KEY = 'edgex_v2_activity';
const HISTORY_ENABLED_KEY = 'edgex_history_enabled';
const domains: Domain[] = ['sports', 'markets', 'crypto', 'forex'];

function readBrowserArray(key: string): unknown[] {
  try { const value = JSON.parse(window.localStorage.getItem(key) || '[]'); return Array.isArray(value) ? value : []; }
  catch { return []; }
}
function localItems(): SavedItem[] {
  return readBrowserArray(STORAGE_KEY).map((value, index) => {
    const item = value && typeof value === 'object' ? value as Record<string, unknown> : {};
    return { ...item, id: String(item.id || `local-${index}`), _localIndex: index } as SavedItem;
  });
}
function localHistory(): LocalHistory[] {
  return readBrowserArray(HISTORY_KEY).map((value, index) => {
    const item = value && typeof value === 'object' ? value as Record<string, unknown> : {};
    return { id: `local-history-${index}`, subject: String(item.subject || 'Viewed EdgeX page'), type: String(item.type || 'research'), path: typeof item.path === 'string' ? item.path : undefined, timestamp: typeof item.timestamp === 'string' || typeof item.timestamp === 'number' ? item.timestamp : undefined, _localIndex: index };
  });
}
function localFavorites(): string[] {
  return readBrowserArray(FAVORITES_KEY).map(value => String(value)).filter(Boolean).slice(0, 100);
}
function savedDate(item: { created_at?: string; timestamp?: string | number; viewed_at?: string }) {
  const value = item.viewed_at || item.created_at || item.timestamp;
  return value && Number.isFinite(new Date(value).getTime()) ? new Date(value).toLocaleString() : 'Time unavailable';
}

export default function SavedClient() {
  const client = getSupabaseBrowserClient();
  const [authReady, setAuthReady] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [mode, setMode] = useState<'loading' | 'account' | 'local'>('loading');
  const [items, setItems] = useState<SavedItem[]>([]);
  const [watchlists, setWatchlists] = useState<WatchItem[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [localActivity, setLocalActivity] = useState<LocalHistory[]>([]);
  const [legacyFavorites, setLegacyFavorites] = useState<string[]>([]);
  const [historyEnabled, setHistoryEnabled] = useState(false);
  const [accountError, setAccountError] = useState('');
  const [domain, setDomain] = useState<Domain>('markets');
  const [symbol, setSymbol] = useState('');
  const [label, setLabel] = useState('');
  const [noteSubject, setNoteSubject] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setHistoryEnabled(window.localStorage.getItem(HISTORY_ENABLED_KEY) === 'true');
    setLocalActivity(localHistory());
    setLegacyFavorites(localFavorites());
  }, []);

  useEffect(() => {
    if (!client) { setAuthReady(true); return; }
    let mounted = true;
    void client.auth.getUser().then(({ data, error }) => {
      if (!mounted) return;
      setUserEmail(data.user?.email || null);
      if (error) setAccountError('The account session could not be verified. Browser-saved research remains available.');
      setAuthReady(true);
    }).catch(() => {
      if (!mounted) return;
      setAccountError('The account session could not be verified. Browser-saved research remains available.');
      setAuthReady(true);
    });
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      if (mounted) setUserEmail(session?.user?.email || null);
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, [client]);

  useEffect(() => {
    if (!authReady) return;
    if (!client || !userEmail) {
      setMode('local'); setItems(localItems()); setWatchlists([]); setNotes([]); setHistory([]);
      return;
    }
    let mounted = true;
    setMode('loading'); setAccountError('');
    void Promise.all([
      client.from('saved_analyses').select('id,domain,subject,title,summary,evidence,analysis,created_at').order('created_at', { ascending: false }),
      client.from('watchlists').select('id,domain,symbol,label,created_at').order('created_at', { ascending: false }),
      client.from('notes').select('id,domain,subject,body,created_at').order('updated_at', { ascending: false }),
      client.from('activity_history').select('id,domain,route,viewed_at').order('viewed_at', { ascending: false }).limit(50),
    ]).then(([savedResult, watchResult, noteResult, historyResult]) => {
      if (!mounted) return;
      setItems((savedResult.data || []) as SavedItem[]);
      setWatchlists((watchResult.data || []) as WatchItem[]);
      setNotes((noteResult.data || []) as NoteItem[]);
      setHistory((historyResult.data || []) as HistoryItem[]);
      if (savedResult.error || watchResult.error || noteResult.error || historyResult.error) setAccountError('One or more account tables are not ready. Apply the checked-in Supabase migration before relying on cloud storage.');
      setMode('account');
    }).catch(() => {
      if (!mounted) return;
      setAccountError('Account data could not be loaded. The app did not switch to a local account simulation.');
      setItems([]); setWatchlists([]); setNotes([]); setHistory([]); setMode('account');
    });
    return () => { mounted = false; };
  }, [client, authReady, userEmail]);

  function updateHistoryPreference(enabled: boolean) {
    setHistoryEnabled(enabled);
    window.localStorage.setItem(HISTORY_ENABLED_KEY, enabled ? 'true' : 'false');
    window.dispatchEvent(new Event('edgex:history-setting'));
  }
  function clearBrowserHistory() {
    window.localStorage.setItem(HISTORY_KEY, '[]');
    setLocalActivity([]);
  }

  async function refreshWatchlists() {
    if (!client) return;
    const { data, error } = await client.from('watchlists').select('id,domain,symbol,label,created_at').order('created_at', { ascending: false });
    if (error) setAccountError('The watchlist could not be refreshed.'); else setWatchlists((data || []) as WatchItem[]);
  }
  async function refreshNotes() {
    if (!client) return;
    const { data, error } = await client.from('notes').select('id,domain,subject,body,created_at').order('updated_at', { ascending: false });
    if (error) setAccountError('Notes could not be refreshed.'); else setNotes((data || []) as NoteItem[]);
  }
  async function refreshHistory() {
    if (!client) return;
    const { data, error } = await client.from('activity_history').select('id,domain,route,viewed_at').order('viewed_at', { ascending: false }).limit(50);
    if (error) setAccountError('Account history could not be refreshed.'); else setHistory((data || []) as HistoryItem[]);
  }

  async function addWatchlist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client || mode !== 'account' || !symbol.trim()) return;
    setBusy(true); setAccountError('');
    try {
      const { error } = await client.from('watchlists').insert({ domain, symbol: symbol.trim().toUpperCase(), label: label.trim() });
      if (error) setAccountError('The watchlist item was not saved. Confirm the Supabase migration is applied.');
      else { setSymbol(''); setLabel(''); await refreshWatchlists(); }
    } catch { setAccountError('The watchlist item could not be saved.'); }
    finally { setBusy(false); }
  }
  async function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client || mode !== 'account' || !noteSubject.trim() || !noteBody.trim()) return;
    setBusy(true); setAccountError('');
    try {
      const { error } = await client.from('notes').insert({ domain, subject: noteSubject.trim(), body: noteBody.trim() });
      if (error) setAccountError('The note was not saved. Confirm the Supabase migration is applied.');
      else { setNoteSubject(''); setNoteBody(''); await refreshNotes(); }
    } catch { setAccountError('The note could not be saved.'); }
    finally { setBusy(false); }
  }

  async function removeRecord(table: 'saved_analyses' | 'watchlists' | 'notes' | 'activity_history', id: string) {
    if (mode === 'local' && table === 'saved_analyses') {
      const item = items.find(saved => saved.id === id);
      if (item?._localIndex == null) return;
      const original = readBrowserArray(STORAGE_KEY);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(original.filter((_entry, index) => index !== item._localIndex)));
      setItems(localItems());
      return;
    }
    if (!client || mode !== 'account') return;
    setBusy(true); setAccountError('');
    try {
      const { error } = await client.from(table).delete().eq('id', id);
      if (error) setAccountError('The account item could not be removed.');
      else if (table === 'saved_analyses') setItems(current => current.filter(item => item.id !== id));
      else if (table === 'watchlists') setWatchlists(current => current.filter(item => item.id !== id));
      else if (table === 'notes') setNotes(current => current.filter(item => item.id !== id));
      else setHistory(current => current.filter(item => item.id !== id));
    } catch { setAccountError('The account item could not be removed.'); }
    finally { setBusy(false); }
  }

  if (mode === 'loading') return <div className="empty" aria-live="polite">Loading account and saved research…</div>;
  return <>
    {mode === 'account' ? <div className="notice">Account records are protected by Supabase row-level security. Signed in as {userEmail}. History recording is opt-in and stores the app path only—never query strings or search text.</div> : <div className="notice">Showing saved research and history from this browser only. <Link href="/sign-in">Sign in</Link> to use account-backed Saved Analysis, favorites/watchlists, notes, and history; local items are not automatically uploaded.</div>}
    {accountError ? <p className="review-error" role="status">{accountError}</p> : null}

    <section className="card profile-card"><div className="card-top"><div><span className="eyebrow">Profile</span><h2>{userEmail ? 'Your EdgeX account' : 'Guest workspace'}</h2></div><span className="chip">{mode === 'account' ? 'Verified session' : 'Browser only'}</span></div><p>{userEmail ? `Signed in as ${userEmail}.` : 'No local-only login is used. Your account is not verified until Supabase Auth is configured.'}</p><div className="actions"><Link className="button" href="/sign-in">{userEmail ? 'Manage account' : 'Sign in'}</Link></div></section>

    <section className="card history-settings"><div><span className="eyebrow">Privacy control</span><h2>History recording</h2><p>When enabled, EdgeX saves the section and page path you open. It does not save query strings, search terms, or form contents. Signed-in history is account-protected; guest history stays in this browser.</p></div><label className="history-toggle"><input type="checkbox" checked={historyEnabled} onChange={event => updateHistoryPreference(event.target.checked)} /> Record page history</label></section>

    <section className="section-head"><div><span className="eyebrow">Research records</span><h2>Saved analysis</h2></div><p>{items.length} item{items.length === 1 ? '' : 's'}</p></section>
    {items.length ? <div className="grid">{items.map((item, index) => <article className="card" key={item.id || index}>
      <div className="card-top"><span className="chip">{item.domain || item.verdict || 'Saved research'}</span><span className="chip">{mode === 'account' ? 'Account' : 'This browser'}</span></div>
      <h3>{item.subject || item.title || 'Research item'}</h3><p>{item.summary || 'No summary was stored with this item.'}</p><small>{savedDate(item)}</small>
      <div className="actions"><button className="button" type="button" disabled={busy} onClick={() => void removeRecord('saved_analyses', item.id)}>Remove</button></div>
    </article>)}</div> : <div className="empty">No saved research is present{mode === 'account' ? ' in this account' : ' in this browser'}.</div>}

    <section className="section-head"><div><span className="eyebrow">History</span><h2>Recently opened pages</h2></div><p>{mode === 'account' ? history.length : localActivity.length} item{(mode === 'account' ? history.length : localActivity.length) === 1 ? '' : 's'}</p></section>
    {mode === 'account' ? history.length ? <div className="list">{history.map(item => <div className="list-row" key={item.id}><div><strong>{item.domain}</strong><small>{item.route} · {savedDate({ viewed_at: item.viewed_at })}</small></div><button className="button" type="button" disabled={busy} onClick={() => void removeRecord('activity_history', item.id)}>Remove</button></div>)}</div> : <div className="empty">No account history yet. Turn on History recording and open a section.</div> : localActivity.length ? <><div className="list">{localActivity.map(item => <div className="list-row" key={item.id}><div><strong>{item.subject}</strong><small>{item.type}{item.path ? ` · ${item.path}` : ''} · {savedDate({ timestamp: item.timestamp })}</small></div></div>)}</div><div className="actions"><button className="button" type="button" onClick={clearBrowserHistory}>Clear browser history</button></div></> : <div className="empty">No browser history yet. Turn on History recording and open a section.</div>}

    {mode === 'local' && legacyFavorites.length ? <section className="card"><div className="section-head"><div><span className="eyebrow">Favorites</span><h2>Legacy browser favorites</h2></div><p>{legacyFavorites.length} item{legacyFavorites.length === 1 ? '' : 's'}</p></div><div className="notice">These older favorite IDs have no saved section/type metadata. They remain in this browser and are not uploaded automatically.</div><div className="list">{legacyFavorites.map(item => <div className="list-row" key={item}><strong>{item}</strong><small>Legacy favorite ID</small></div>)}</div></section> : null}

    {mode === 'account' ? <>
      <section className="section-head"><div><span className="eyebrow">Favorites &amp; account data</span><h2>Watchlists</h2></div><p>{watchlists.length} item{watchlists.length === 1 ? '' : 's'}</p></section>
      <form className="research-form card" onSubmit={addWatchlist}><div className="form-grid"><label>Section<select value={domain} onChange={event => setDomain(event.target.value as Domain)}>{domains.map(item => <option key={item} value={item}>{item}</option>)}</select></label><label>Symbol or provider ID<input required maxLength={80} value={symbol} onChange={event => setSymbol(event.target.value)} /></label><label>Label (optional)<input maxLength={160} value={label} onChange={event => setLabel(event.target.value)} /></label></div><div className="actions"><button className="button" type="submit" disabled={busy || !symbol.trim()}>{busy ? 'Saving…' : 'Add to watchlist'}</button></div></form>
      {watchlists.length ? <div className="list">{watchlists.map(item => <div className="list-row" key={item.id}><div><strong>{item.label || item.symbol}</strong><small>{item.domain} · {item.symbol}</small></div><button className="button" type="button" disabled={busy} onClick={() => void removeRecord('watchlists', item.id)}>Remove</button></div>)}</div> : <div className="empty">No account watchlist items yet.</div>}

      <section className="section-head"><div><span className="eyebrow">Account data</span><h2>Notes</h2></div><p>{notes.length} note{notes.length === 1 ? '' : 's'}</p></section>
      <form className="research-form card" onSubmit={addNote}><div className="form-grid"><label>Section<select value={domain} onChange={event => setDomain(event.target.value as Domain)}>{domains.map(item => <option key={item} value={item}>{item}</option>)}</select></label><label>Subject<input required maxLength={160} value={noteSubject} onChange={event => setNoteSubject(event.target.value)} /></label><label>Note<textarea required maxLength={5000} rows={4} value={noteBody} onChange={event => setNoteBody(event.target.value)} /></label></div><div className="actions"><button className="button" type="submit" disabled={busy || !noteSubject.trim() || !noteBody.trim()}>{busy ? 'Saving…' : 'Save note'}</button></div></form>
      {notes.length ? <div className="grid">{notes.map(item => <article className="card" key={item.id}><div className="card-top"><span className="chip">{item.domain}</span><span className="chip">{savedDate({ created_at: item.created_at })}</span></div><h3>{item.subject}</h3><p>{item.body}</p><button className="button" type="button" disabled={busy} onClick={() => void removeRecord('notes', item.id)}>Remove</button></article>)}</div> : <div className="empty">No account notes yet.</div>}
    </> : <div className="empty">Favorites/watchlists and notes are account-backed features. Sign in after the EdgeX Supabase project and migration are configured.</div>}
  </>;
}

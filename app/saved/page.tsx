import type { Metadata } from 'next';
import AuthPanel from '../components/auth-panel';
import SavedClient from '../components/saved-client';

export const metadata: Metadata = { title: 'Saved' };

export default function SavedPage() {
  return <>
    <header><span className="eyebrow">Your research</span><h1>Saved</h1><p className="lede">Saved analyses, account watchlists, and private notes. Cloud records are available only after EdgeX authentication and RLS migration are configured.</p></header>
    <AuthPanel />
    <SavedClient />
  </>;
}

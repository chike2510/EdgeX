import type { Metadata } from 'next';
import AuthPanel from '../components/auth-panel';

export const metadata: Metadata = { title: 'Sign in' };

export default function SignInPage() {
  return <>
    <header><span className="eyebrow">Account access</span><h1>Sign in</h1><p className="lede">Authentication uses Supabase sessions. Account features remain unavailable until the EdgeX project is configured.</p></header>
    <AuthPanel />
  </>;
}

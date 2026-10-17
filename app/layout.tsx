import type { Metadata } from 'next';
import Link from 'next/link';
import AccountLink from './components/account-link';
import ActivityTracker from './components/activity-tracker';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'EdgeX — Research context', template: '%s · EdgeX' },
  description: 'Provider-backed sports and market context, with clear evidence and data limitations.',
};

const navigation = [
  { href: '/', label: 'Overview' },
  { href: '/sports', label: 'Sports' },
  { href: '/markets', label: 'Markets' },
  { href: '/saved', label: 'Saved' },
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <header className="topbar">
            <Link className="brand" href="/" aria-label="EdgeX Overview">
              <span className="brand-mark" aria-hidden="true">EX</span>
              <span><span className="brand-name">EDGEX</span><span className="brand-note">RESEARCH CONTEXT</span></span>
            </Link>
            <nav className="primary-nav" aria-label="Primary navigation">
              {navigation.map(item => <Link key={item.href} href={item.href}>{item.label}</Link>)}
            </nav>
            <AccountLink />
          </header>
          <main className="app-main">{children}</main>
        </div>
        <ActivityTracker />
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Section paused' };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ParkedPage({ searchParams }: Props) {
  const params = await searchParams;
  const sectionValue = params.section;
  const section = Array.isArray(sectionValue) ? sectionValue[0] : sectionValue || 'This section';
  return <>
    <header><span className="eyebrow">Scope in progress</span><h1>{section} is paused</h1><p className="lede">This section is being held back until its provider coverage and evidence standards are ready.</p></header>
    <div className="notice">The core product is focused on provider-backed Sports and Markets research. This paused page shows no generated claims or placeholder data.</div>
    <div className="actions"><Link className="button" href="/">Overview</Link><Link className="button" href="/sports">Sports</Link><Link className="button" href="/markets">Markets</Link></div>
  </>;
}

const HELIUS_API = 'https://api.helius.xyz/v0/addresses';
const CACHE_TTL_MS = 30_000;
const cache = new Map();

function finite(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isSolanaAddress(value) {
  return typeof value === 'string' && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value.trim());
}

function fromLamports(value) {
  const lamports = finite(value);
  return lamports === null ? null : lamports / 1_000_000_000;
}

export function normalizeSolanaActivity(transaction, walletAddress) {
  const tokenTransfers = Array.isArray(transaction?.tokenTransfers) ? transaction.tokenTransfers : [];
  const nativeTransfers = Array.isArray(transaction?.nativeTransfers) ? transaction.nativeTransfers : [];
  const wallet = String(walletAddress || '');
  const incoming = tokenTransfers.filter(transfer => transfer?.toUserAccount === wallet);
  const outgoing = tokenTransfers.filter(transfer => transfer?.fromUserAccount === wallet);
  const swap = transaction?.events?.swap || null;
  const timestamp = finite(transaction?.timestamp);
  return {
    signature: transaction?.signature || null,
    timestamp: timestamp ? new Date(timestamp * 1000).toISOString() : null,
    type: transaction?.type || (swap ? 'SWAP' : 'TRANSACTION'),
    source: transaction?.source || null,
    description: transaction?.description || null,
    feeSol: fromLamports(transaction?.fee),
    isSwap: Boolean(swap),
    incomingTransfers: incoming.length,
    outgoingTransfers: outgoing.length,
    tokenMints: [...new Set(tokenTransfers.map(transfer => transfer?.mint).filter(Boolean))].slice(0, 8),
    nativeTransferCount: nativeTransfers.length,
  };
}

export function summarizeSolanaActivity(transactions, walletAddress) {
  const activity = transactions.map(transaction => normalizeSolanaActivity(transaction, walletAddress));
  const timestamps = activity.map(item => item.timestamp).filter(Boolean).sort();
  const fees = activity.map(item => item.feeSol).filter(value => value !== null);
  return {
    transactions: activity.length,
    swaps: activity.filter(item => item.isSwap).length,
    tokenTransfers: activity.reduce((sum, item) => sum + item.incomingTransfers + item.outgoingTransfers, 0),
    firstObservedAt: timestamps[0] || null,
    lastObservedAt: timestamps.at(-1) || null,
    networkFeesSol: fees.length ? Number(fees.reduce((sum, value) => sum + value, 0).toFixed(9)) : null,
    uniqueTokenMints: [...new Set(activity.flatMap(item => item.tokenMints))].length,
  };
}

async function heliusHistory(address, limit) {
  const key = `${address}:${limit}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.data;
  const url = new URL(`${HELIUS_API}/${encodeURIComponent(address)}/transactions`);
  url.searchParams.set('api-key', process.env.HELIUS_API_KEY);
  url.searchParams.set('limit', String(limit));
  const response = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'EdgeX/2.0' } });
  const raw = await response.text();
  let body = null;
  try { body = raw ? JSON.parse(raw) : null; } catch { throw new Error('Wallet history provider returned invalid JSON'); }
  if (!response.ok) throw new Error(`Wallet history provider returned ${response.status}`);
  const data = Array.isArray(body) ? body : [];
  cache.set(key, { at: Date.now(), data });
  return data;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const address = String(req.query?.address || '').trim();
  if (!isSolanaAddress(address)) return res.status(400).json({ error: 'Enter a valid public Solana address.', dataQuality: 'invalid_address' });
  if (!process.env.HELIUS_API_KEY) {
    return res.status(503).json({
      error: 'Wallet tracking is not configured yet.',
      dataQuality: 'configuration_required',
      requirement: 'Add HELIUS_API_KEY to the Vercel environment. EdgeX never requests private keys or wallet-signing permissions.'
    });
  }

  try {
    const limit = Math.min(Math.max(Number(req.query?.limit) || 50, 1), 100);
    const transactions = await heliusHistory(address, limit);
    const activity = transactions.map(transaction => normalizeSolanaActivity(transaction, address));
    return res.status(200).json({
      chain: 'solana',
      address,
      dataQuality: 'PARTIAL',
      fetchedAt: new Date().toISOString(),
      summary: summarizeSolanaActivity(transactions, address),
      transactions: activity,
      pnl: {
        status: 'NOT_COMPUTED',
        reason: 'Transaction activity is available, but realized or unrealized PnL requires complete cost basis and timestamped historical token pricing. EdgeX will not estimate it from incomplete data.'
      },
      methodology: {
        scope: 'Public Solana address activity only. No private keys, wallet connection, signing, trading, copy trading, or transaction execution.',
        cache: 'Address history is cached server-side for 30 seconds.'
      }
    });
  } catch (error) {
    console.error('[EdgeX wallet tracker] provider failure', error?.message || error);
    const message = String(error?.message || 'Wallet history unavailable');
    const status = /returned 429/.test(message) ? 429 : 502;
    return res.status(status).json({ error: 'Wallet history unavailable', dataQuality: 'unavailable', detail: message });
  }
}

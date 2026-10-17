// Public foreign-exchange proxy backed by Frankfurter/ECB reference rates.
// Rates are provider values; change is left unavailable when no comparison snapshot exists.
import { recordProviderHealth } from './edgex-data.js';

const FRANKFURTER = 'https://api.frankfurter.app/latest';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const query = req.query || {};
  const symbols = typeof query.symbols === 'string' && query.symbols.trim()
    ? query.symbols.split(',').map(value => value.trim().toUpperCase()).filter(Boolean).slice(0, 50)
    : ['EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'NGN', 'NZD', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'TRY', 'ZAR', 'HKD', 'SGD', 'KRW', 'MXN', 'BRL', 'INR'];
  const base = String(query.base || 'USD').toUpperCase();
  const params = new URLSearchParams({ from: base, to: symbols.join(',') });
  const signal = AbortSignal.timeout(8_000);
  const startedAt = Date.now();

  try {
    const upstream = await fetch(`${FRANKFURTER}?${params}`, { headers: { Accept: 'application/json', 'User-Agent': 'EdgeX/2.0' }, signal });
    const body = await upstream.json();
    if (!upstream.ok) {
      recordProviderHealth('frankfurter-ecb', { status: 'unavailable', latencyMs: Date.now() - startedAt });
      return res.status(502).json({ error: 'Forex provider unavailable', dataQuality: 'unavailable' });
    }
    const rates = { ...(body?.rates || {}) };
    let provider = 'frankfurter-ecb';
    let previousRates = {};
    const comparisonSymbols = symbols.filter(currency => currency !== 'NGN' && currency !== base);
    const historicalParams = new URLSearchParams({ from: base, to: comparisonSymbols.join(',') });
    const currentDate = body?.date || new Date().toISOString().slice(0, 10);
    const currentDay = new Date(`${currentDate}T00:00:00Z`);
    const previousDay = new Date(currentDay);
    const weekday = previousDay.getUTCDay();
    previousDay.setUTCDate(previousDay.getUTCDate() - (weekday === 1 ? 3 : weekday === 0 ? 2 : 1));
    const historicalDate = previousDay.toISOString().slice(0, 10);
    try {
      const historical = await fetch(`https://api.frankfurter.app/${historicalDate}?${historicalParams}`, { headers: { Accept: 'application/json', 'User-Agent': 'EdgeX/2.0' }, signal });
      const historicalBody = await historical.json();
      if (historical.ok && historicalBody?.rates) previousRates = historicalBody.rates;
    } catch (historicalError) {
      console.warn('[EdgeX forex] historical comparison unavailable', historicalError?.message || historicalError);
    }
    const percentChange = (currency, current) => {
      const previous = Number(previousRates[currency]);
      return Number.isFinite(previous) && previous !== 0 ? Number((((Number(current) - previous) / previous) * 100).toFixed(4)) : null;
    };
    if (symbols.includes('NGN') && rates.NGN == null) {
      try {
        const fallback = await fetch('https://open.er-api.com/v6/latest/USD', { headers: { Accept: 'application/json', 'User-Agent': 'EdgeX/2.0' }, signal });
        const fallbackBody = await fallback.json();
        if (fallback.ok && Number.isFinite(Number(fallbackBody?.rates?.NGN))) {
          rates.NGN = Number(fallbackBody.rates.NGN);
          provider = 'frankfurter-ecb+exchange-rate-fallback';
        }
      } catch (fallbackError) {
        console.warn('[EdgeX forex] NGN fallback unavailable', fallbackError?.message || fallbackError);
      }
    }
    const pairs = symbols.filter(currency => rates[currency] != null).map(currency => ({
      symbol: `${body.base || 'USD'}/${currency}`,
      price: Number.isFinite(Number(rates[currency])) ? Number(rates[currency]) : null,
      change: percentChange(currency, rates[currency]),
      trend: null,
      date: body.date || null
    }));
    if (Object.keys(previousRates).length) provider += '+historical-change';
    let history = null;
    const requestedCurrency = String(query.currency || '').toUpperCase();
    if (query.history === '1' || query.history === 'true') {
      if (!requestedCurrency || requestedCurrency === base || requestedCurrency === 'NGN') {
        history = { currency: requestedCurrency || null, status: 'UNAVAILABLE', reason: requestedCurrency === 'NGN' ? 'The configured reference source does not publish a comparable NGN time series.' : 'A single supported currency is required.' };
      } else {
        const historyEnd = currentDate;
        const historyStartDay = new Date(`${historyEnd}T00:00:00Z`);
        historyStartDay.setUTCDate(historyStartDay.getUTCDate() - 240);
        const historyStart = historyStartDay.toISOString().slice(0, 10);
        try {
          const seriesResponse = await fetch(`https://api.frankfurter.app/${historyStart}..${historyEnd}?${new URLSearchParams({ from: base, to: requestedCurrency })}`, { headers: { Accept: 'application/json', 'User-Agent': 'EdgeX/2.0' }, signal });
          const seriesBody = await seriesResponse.json();
          const points = Object.entries(seriesBody?.rates || {}).map(([date, values]) => ({ date, close: Number(values?.[requestedCurrency]) })).filter(point => Number.isFinite(point.close));
          history = points.length >= 20 ? { currency: requestedCurrency, status: 'SUPPORTED', points, startDate: seriesBody.start_date || historyStart, endDate: seriesBody.end_date || historyEnd } : { currency: requestedCurrency, status: 'INSUFFICIENT_DATA', points, reason: 'The reference source returned fewer than 20 daily observations.' };
        } catch (historyError) {
          history = { currency: requestedCurrency, status: 'UNAVAILABLE', reason: 'Historical series request failed.' };
        }
      }
    }
    recordProviderHealth(provider, { status: pairs.length ? (Object.keys(previousRates).length ? 'available' : 'partial') : 'partial', latencyMs: Date.now() - startedAt });
    return res.status(200).json({ pairs, provider, fetchedAt: new Date().toISOString(), date: body.date || null, comparisonDate: Object.keys(previousRates).length ? 'previous-available-reference' : null, history });
  } catch (error) {
    recordProviderHealth('frankfurter-ecb', { status: 'unavailable', latencyMs: Date.now() - startedAt });
    console.error('[EdgeX forex proxy] provider failure', error?.message || error);
    return res.status(502).json({ error: 'Forex provider unavailable', pairs: [], dataQuality: 'unavailable' });
  }
}

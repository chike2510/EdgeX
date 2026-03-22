// api/sports.js — Server-side proxy for AllSportsAPI
// Runs on Vercel — no CORS issues, key never exposed to browser

const https = require('https');

const API_KEY = '8fea7d5de9a5e7147788af09cf1718a7260fc575a55415df87fae477e897f670';
const FB_BASE = 'https://apiv2.allsportsapi.com/football/';
const BB_BASE = 'https://apiv2.allsportsapi.com/basketball/';

function todayStr(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const { type } = req.query;

  try {
    switch (type) {

      case 'football-live': {
        // Try live first
        const live = await get(FB_BASE, { met: 'Livescore' });
        if (live.success === 1 && live.result?.length > 0) {
          return res.json({ success: true, source: 'live', data: live.result });
        }
        // No live matches — fall through to today
        const today = await get(FB_BASE, { met: 'Fixtures', from: todayStr(0), to: todayStr(0) });
        if (today.success === 1 && today.result?.length > 0) {
          return res.json({ success: true, source: 'today', data: today.result });
        }
        // Nothing today — try tomorrow
        const tomorrow = await get(FB_BASE, { met: 'Fixtures', from: todayStr(1), to: todayStr(2) });
        if (tomorrow.success === 1 && tomorrow.result?.length > 0) {
          return res.json({ success: true, source: 'upcoming', data: tomorrow.result });
        }
        return res.json({ success: false, error: 'No matches found' });
      }

      case 'football-fixtures': {
        const data = await get(FB_BASE, {
          met: 'Fixtures',
          from: todayStr(0),
          to:   todayStr(5),
        });
        if (data.success === 1 && data.result?.length > 0) {
          return res.json({ success: true, data: data.result });
        }
        return res.json({ success: false, error: 'No fixtures found' });
      }

      case 'football-odds': {
        const data = await get(FB_BASE, { met: 'OddsLive' });
        if (data.success === 1 && data.result?.length > 0) {
          return res.json({ success: true, data: data.result });
        }
        return res.json({ success: false, error: 'No odds available' });
      }

      case 'football-lineups': {
        const { id } = req.query;
        if (!id) return res.json({ success: false, error: 'Missing match id' });
        const data = await get(FB_BASE, { met: 'Lineups', matchId: id });
        return res.json({ success: data.success === 1, data: data.result || [] });
      }

      case 'football-events': {
        const { id } = req.query;
        if (!id) return res.json({ success: false, error: 'Missing match id' });
        const data = await get(FB_BASE, { met: 'Events', matchId: id });
        return res.json({ success: data.success === 1, data: data.result || [] });
      }

      case 'football-stats': {
        const { id } = req.query;
        if (!id) return res.json({ success: false, error: 'Missing match id' });
        const data = await get(FB_BASE, { met: 'Statistics', matchId: id });
        return res.json({ success: data.success === 1, data: data.result || [] });
      }

      case 'basketball-live': {
        const live = await get(BB_BASE, { met: 'Livescore' });
        if (live.success === 1 && live.result?.length > 0) {
          return res.json({ success: true, source: 'live', data: live.result });
        }
        const today = await get(BB_BASE, { met: 'Fixtures', from: todayStr(0), to: todayStr(0) });
        if (today.success === 1 && today.result?.length > 0) {
          return res.json({ success: true, source: 'today', data: today.result });
        }
        const upcoming = await get(BB_BASE, { met: 'Fixtures', from: todayStr(1), to: todayStr(3) });
        if (upcoming.success === 1 && upcoming.result?.length > 0) {
          return res.json({ success: true, source: 'upcoming', data: upcoming.result });
        }
        return res.json({ success: false, error: 'No games found' });
      }

      case 'basketball-fixtures': {
        const data = await get(BB_BASE, {
          met:  'Fixtures',
          from: todayStr(0),
          to:   todayStr(5),
        });
        if (data.success === 1 && data.result?.length > 0) {
          return res.json({ success: true, data: data.result });
        }
        return res.json({ success: false, error: 'No fixtures found' });
      }

      default:
        return res.status(400).json({ success: false, error: `Unknown type: ${type}` });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ── HTTP helper ───────────────────────────────────────────────────────────────
function get(base, params = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(base);
    url.searchParams.set('APIkey', API_KEY);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    https.get(url.toString(), { headers: { 'Accept': 'application/json' } }, r => {
      let body = '';
      r.on('data', c => { body += c; });
      r.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(new Error('Invalid JSON from AllSportsAPI')); }
      });
    }).on('error', reject);
  });
    }
                           

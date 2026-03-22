// api/sports.js — Server-side proxy for AllSportsAPI
// Filters to major leagues only + smart fallback chain

const https = require('https');

const API_KEY = '8fea7d5de9a5e7147788af09cf1718a7260fc575a55415df87fae477e897f670';
const FB_BASE  = 'https://apiv2.allsportsapi.com/football/';
const BB_BASE  = 'https://apiv2.allsportsapi.com/basketball/';

// ── Major football league IDs on AllSportsAPI ─────────────────────────────────
// These are the only leagues we want to show
const MAJOR_LEAGUE_IDS = [
  148,  // English Premier League
  175,  // UEFA Champions League
  302,  // La Liga
  175,  // Bundesliga (check below)
  207,  // Serie A
  168,  // Ligue 1
  176,  // UEFA Europa League
  244,  // FA Cup
  247,  // Carabao Cup
  373,  // La Liga 2
  196,  // Bundesliga 2
  // Adding more to be safe
];

// League name keywords — filter by name as backup
const MAJOR_LEAGUE_KEYWORDS = [
  'premier league',
  'champions league',
  'la liga',
  'bundesliga',
  'serie a',
  'ligue 1',
  'europa league',
  'fa cup',
  'carabao',
  'eredivisie',
  'primeira liga',
  'scottish premiership',
  'super lig',
  'russian premier',
  'saudi pro',
  'mls',
  'brasileirao',
  'copa',
  'world cup',
  'euros',
  'nations league',
  'afcon',
  'conference league',
];

// Basketball league keywords
const MAJOR_BB_KEYWORDS = [
  'nba',
  'euroleague',
  'eurocup',
  'acb',
  'bbl',
  'lnb',
  'aba',
  'basketball champions',
];

function isMajorFootballLeague(leagueName) {
  if (!leagueName) return false;
  const n = leagueName.toLowerCase();
  return MAJOR_LEAGUE_KEYWORDS.some(kw => n.includes(kw));
}

function isMajorBasketballLeague(leagueName) {
  if (!leagueName) return false;
  const n = leagueName.toLowerCase();
  return MAJOR_BB_KEYWORDS.some(kw => n.includes(kw));
}

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
        // Try live scores
        const live = await apiGet(FB_BASE, { met: 'Livescore' });
        if (live.success === 1 && live.result?.length > 0) {
          const filtered = live.result.filter(m => isMajorFootballLeague(m.league_name));
          if (filtered.length > 0) {
            return res.json({ success: true, source: 'live', data: filtered });
          }
        }

        // No major league live games — try today
        const today = await apiGet(FB_BASE, {
          met:  'Fixtures',
          from: todayStr(0),
          to:   todayStr(0),
        });
        if (today.success === 1 && today.result?.length > 0) {
          const filtered = today.result.filter(m => isMajorFootballLeague(m.league_name));
          if (filtered.length > 0) {
            return res.json({ success: true, source: 'today', data: filtered });
          }
        }

        // Try next 4 days
        for (let i = 1; i <= 4; i++) {
          const upcoming = await apiGet(FB_BASE, {
            met:  'Fixtures',
            from: todayStr(i),
            to:   todayStr(i),
          });
          if (upcoming.success === 1 && upcoming.result?.length > 0) {
            const filtered = upcoming.result.filter(m => isMajorFootballLeague(m.league_name));
            if (filtered.length > 0) {
              return res.json({ success: true, source: 'upcoming', data: filtered });
            }
          }
        }

        return res.json({ success: false, error: 'No major league matches found' });
      }

      case 'football-fixtures': {
        // Fetch next 7 days, filter to major leagues
        const all = [];
        for (let i = 0; i <= 6; i++) {
          try {
            const day = await apiGet(FB_BASE, {
              met:  'Fixtures',
              from: todayStr(i),
              to:   todayStr(i),
            });
            if (day.success === 1 && day.result?.length > 0) {
              const filtered = day.result.filter(m => isMajorFootballLeague(m.league_name));
              all.push(...filtered);
            }
          } catch {}
        }
        if (all.length > 0) {
          return res.json({ success: true, data: all.slice(0, 50) });
        }
        return res.json({ success: false, error: 'No fixtures found' });
      }

      case 'football-odds': {
        const data = await apiGet(FB_BASE, { met: 'OddsLive' });
        if (data.success === 1 && data.result?.length > 0) {
          return res.json({ success: true, data: data.result });
        }
        return res.json({ success: false, error: 'No odds' });
      }

      case 'football-lineups': {
        const { id } = req.query;
        if (!id) return res.json({ success: false, error: 'Missing id' });
        const data = await apiGet(FB_BASE, { met: 'Lineups', matchId: id });
        return res.json({ success: data.success === 1, data: data.result || [] });
      }

      case 'football-events': {
        const { id } = req.query;
        if (!id) return res.json({ success: false, error: 'Missing id' });
        const data = await apiGet(FB_BASE, { met: 'Events', matchId: id });
        return res.json({ success: data.success === 1, data: data.result || [] });
      }

      case 'football-stats': {
        const { id } = req.query;
        if (!id) return res.json({ success: false, error: 'Missing id' });
        const data = await apiGet(FB_BASE, { met: 'Statistics', matchId: id });
        return res.json({ success: data.success === 1, data: data.result || [] });
      }

      case 'basketball-live': {
        const live = await apiGet(BB_BASE, { met: 'Livescore' });
        if (live.success === 1 && live.result?.length > 0) {
          const filtered = live.result.filter(g => isMajorBasketballLeague(g.league_name));
          if (filtered.length > 0) {
            return res.json({ success: true, source: 'live', data: filtered });
          }
        }

        const today = await apiGet(BB_BASE, {
          met:  'Fixtures',
          from: todayStr(0),
          to:   todayStr(0),
        });
        if (today.success === 1 && today.result?.length > 0) {
          const filtered = today.result.filter(g => isMajorBasketballLeague(g.league_name));
          if (filtered.length > 0) {
            return res.json({ success: true, source: 'today', data: filtered });
          }
        }

        // Try next 3 days
        for (let i = 1; i <= 3; i++) {
          const upcoming = await apiGet(BB_BASE, {
            met:  'Fixtures',
            from: todayStr(i),
            to:   todayStr(i),
          });
          if (upcoming.success === 1 && upcoming.result?.length > 0) {
            const filtered = upcoming.result.filter(g => isMajorBasketballLeague(g.league_name));
            if (filtered.length > 0) {
              return res.json({ success: true, source: 'upcoming', data: filtered });
            }
          }
        }

        return res.json({ success: false, error: 'No major basketball games found' });
      }

      case 'basketball-fixtures': {
        const all = [];
        for (let i = 0; i <= 5; i++) {
          try {
            const day = await apiGet(BB_BASE, {
              met:  'Fixtures',
              from: todayStr(i),
              to:   todayStr(i),
            });
            if (day.success === 1 && day.result?.length > 0) {
              const filtered = day.result.filter(g => isMajorBasketballLeague(g.league_name));
              all.push(...filtered);
            }
          } catch {}
        }
        if (all.length > 0) return res.json({ success: true, data: all.slice(0, 30) });
        return res.json({ success: false, error: 'No fixtures found' });
      }

      default:
        return res.status(400).json({ success: false, error: `Unknown type: ${type}` });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

function apiGet(base, params = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(base);
    url.searchParams.set('APIkey', API_KEY);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    https.get(url.toString(), { headers: { Accept: 'application/json' } }, r => {
      let body = '';
      r.on('data', c => { body += c; });
      r.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch { reject(new Error('Invalid JSON')); }
      });
    }).on('error', reject);
  });
}

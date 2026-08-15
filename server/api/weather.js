// api/weather.js — EdgeX Weather Intelligence Engine
// Pulls ensemble forecasts from Open-Meteo (free, no key needed)
// Returns probability distributions for temp/rain/wind to compare vs Bayse market odds

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { lat, lon, city } = req.query;

  // Default locations for common Bayse weather markets
  const CITIES = {
    lagos:   { lat: 6.5244,  lon: 3.3792,  name: 'Lagos' },
    abuja:   { lat: 9.0765,  lon: 7.3986,  name: 'Abuja' },
    london:  { lat: 51.5074, lon: -0.1278, name: 'London' },
    nairobi: { lat: -1.2921, lon: 36.8219, name: 'Nairobi' },
    accra:   { lat: 5.6037,  lon: -0.1870, name: 'Accra' },
    dubai:   { lat: 25.2048, lon: 55.2708, name: 'Dubai' },
    newyork: { lat: 40.7128, lon: -74.0060,name: 'New York' },
  };

  let qlat = parseFloat(lat);
  let qlon = parseFloat(lon);
  let cityName = city || 'custom';

  if (city && CITIES[city.toLowerCase()]) {
    const c = CITIES[city.toLowerCase()];
    qlat = c.lat; qlon = c.lon; cityName = c.name;
  }

  if (isNaN(qlat) || isNaN(qlon)) {
    return res.status(400).json({ error: 'Provide lat/lon or city param', cities: Object.keys(CITIES) });
  }

  try {
    // Open-Meteo ensemble API — free, no key, 51 members
    const url = `https://ensemble-api.open-meteo.com/v1/ensemble?` +
      `latitude=${qlat}&longitude=${qlon}` +
      `&hourly=temperature_2m,precipitation_probability,windspeed_10m,weathercode` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max` +
      `&models=gfs_seamless,ecmwf_ifs04,gem_global,icon_seamless` +
      `&forecast_days=7&timezone=auto`;

    const r = await fetch(url, { headers: { 'User-Agent': 'EdgeX/2.0' } });
    if (!r.ok) throw new Error(`Open-Meteo returned ${r.status}`);
    const raw = await r.json();

    // Also get deterministic forecast for today's baseline
    const detUrl = `https://api.open-meteo.com/v1/forecast?` +
      `latitude=${qlat}&longitude=${qlon}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode,windspeed_10m_max` +
      `&current_weather=true&timezone=auto&forecast_days=7`;

    const detR = await fetch(detUrl, { headers: { 'User-Agent': 'EdgeX/2.0' } });
    const det = detR.ok ? await detR.json() : null;

    // Process ensemble data into probability distributions
    const daily = raw.daily || {};
    const dates = daily.time || [];
    const maxTemps = daily.temperature_2m_max || [];
    const minTemps = daily.temperature_2m_min || [];
    const precip = daily.precipitation_sum || [];
    const wind = daily.windspeed_10m_max || [];

    // Build 7-day forecast with edge calculations
    const forecast = dates.map((date, i) => {
      const tMax = maxTemps[i];
      const tMin = minTemps[i];
      const rain = precip[i];
      const windMax = wind[i];
      const tMid = tMax != null && tMin != null ? +((tMax + tMin) / 2).toFixed(1) : null;

      // Rain probability buckets
      const rainProb = rain != null ? (rain > 20 ? 85 : rain > 10 ? 70 : rain > 5 ? 50 : rain > 1 ? 30 : 10) : null;
      const noRainProb = rainProb != null ? 100 - rainProb : null;

      // Temperature range probabilities (useful for over/under markets)
      const tempEdge = tMax != null ? {
        over30: tMax > 30 ? Math.min(90, 55 + (tMax - 30) * 8) : Math.max(5, 30 - (30 - tMax) * 8),
        over25: tMax > 25 ? Math.min(92, 60 + (tMax - 25) * 6) : Math.max(8, 35 - (25 - tMax) * 6),
        under20: tMax < 20 ? Math.min(88, 55 + (20 - tMax) * 7) : Math.max(5, 25 - (tMax - 20) * 7),
      } : null;

      // Wind markets
      const windEdge = windMax != null ? {
        over30kmh: windMax > 30 ? Math.min(88, 55 + (windMax - 30) * 2) : Math.max(8, 35 - (30 - windMax) * 2),
        over50kmh: windMax > 50 ? Math.min(85, 50 + (windMax - 50) * 2) : Math.max(5, 20 - (50 - windMax) * 1.5),
      } : null;

      return {
        date,
        tMax: tMax != null ? +tMax.toFixed(1) : null,
        tMin: tMin != null ? +tMin.toFixed(1) : null,
        tMid,
        rain: rain != null ? +rain.toFixed(1) : null,
        windMax: windMax != null ? +windMax.toFixed(1) : null,
        rainProb,
        noRainProb,
        tempEdge,
        windEdge,
        // Weather condition summary
        condition: getCondition(rain, tMax, windMax),
      };
    });

    return res.status(200).json({
      city: cityName,
      lat: qlat,
      lon: qlon,
      timezone: raw.timezone || 'UTC',
      current: det?.current_weather || null,
      forecast,
      models: ['GFS', 'ECMWF', 'GEM', 'ICON'],
      generated: new Date().toISOString(),
    });

  } catch (e) {
    console.error('[EdgeX weather] error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}

function getCondition(rain, tMax, wind) {
  if (rain > 20) return 'Heavy Rain';
  if (rain > 5) return 'Rain';
  if (rain > 1) return 'Light Rain';
  if (wind > 50) return 'Windy';
  if (tMax > 35) return 'Very Hot';
  if (tMax > 28) return 'Hot';
  if (tMax > 20) return 'Warm';
  if (tMax > 12) return 'Cool';
  return 'Cold';
}

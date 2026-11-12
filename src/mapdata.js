import { colorValue } from './metrics.js';
import { N_MONTHS } from './config.js';
import { fmt } from './fmt.js';

// The map always shows actual emissions per hectare.
const METRIC = 'actual';
const TITLE = 'Actual emission';

export function attachValues(fc, mode, t) {
  return {
    ...fc,
    features: fc.features.map((f) => ({
      type: 'Feature',
      geometry: f.geometry,
      properties: {
        id: f.properties.id,
        name: f.properties.name,
        district: f.properties.district,
        approx: f.properties.approx === true,
        _v: colorValue(f.properties, mode, t, METRIC),
      },
    })),
  };
}

export function computeDomain(fc, mode) {
  let min = Infinity;
  let max = -Infinity;
  for (const f of fc.features) {
    for (let t = 0; t < N_MONTHS; t++) {
      const v = colorValue(f.properties, mode, t, METRIC);
      if (v === null) continue;
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  return min === Infinity ? [0, 1] : [min, max];
}

export function legendSpec(domain) {
  return { title: TITLE, unit: 'tCO2e/ha', min: domain[0], max: domain[1] };
}

// Legend and popup values use the shared formatter.
export const formatValue = fmt;

// Popup lines for one village: the actual emission per hectare only.
export function popupLines(props, mode, t) {
  return [`${TITLE}: ${fmt(colorValue(props, mode, t, METRIC))} tCO2e/ha`];
}

// Point feature per polygon (centre of the largest ring's bounding box), keeping the original properties.
export function centroidsOf(fc) {
  const features = [];
  for (const f of fc.features) {
    const g = f.geometry;
    if (!g) continue;
    const rings = g.type === 'Polygon' ? [g.coordinates[0]] : g.type === 'MultiPolygon' ? g.coordinates.map((p) => p[0]) : [];
    let best = null;
    let bestSize = -1;
    for (const ring of rings) {
      let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
      for (const [x, y] of ring) { if (x < w) w = x; if (x > e) e = x; if (y < s) s = y; if (y > n) n = y; }
      const size = (e - w) * (n - s);
      if (size > bestSize) { bestSize = size; best = [(w + e) / 2, (s + n) / 2]; }
    }
    if (best) features.push({ type: 'Feature', properties: f.properties, geometry: { type: 'Point', coordinates: best } });
  }
  return { type: 'FeatureCollection', features };
}

// [[minLng,minLat],[maxLng,maxLat]] over all coordinates, or null when empty.
export function boundsOf(...fcs) {
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
  const walk = (c) => {
    if (typeof c[0] === 'number') {
      if (c[0] < w) w = c[0]; if (c[0] > e) e = c[0];
      if (c[1] < s) s = c[1]; if (c[1] > n) n = c[1];
    } else c.forEach(walk);
  };
  fcs.forEach((fc) => fc.features.forEach((f) => f.geometry && walk(f.geometry.coordinates)));
  return w === Infinity ? null : [[w, s], [e, n]];
}

const HASH_WHITELIST = {
  mode: ['month', 'cumulative'],
  tab: ['dash', 'factors', 'data'],
  scenario: ['actual', 'baseline'],
};

// Returns a state patch containing only validated values.
// A bare tab name ('#data') is accepted as the tab.
export function parseHash(hash) {
  const patch = {};
  const raw = String(hash).replace(/^#/, '');
  if (HASH_WHITELIST.tab.includes(raw)) return { tab: raw };
  const params = new URLSearchParams(raw);
  for (const [k, allowed] of Object.entries(HASH_WHITELIST)) {
    const v = params.get(k);
    if (v !== null && allowed.includes(v)) patch[k] = v;
  }
  const t = params.get('t');
  if (t !== null && /^\d{1,2}$/.test(t) && Number(t) < N_MONTHS) patch.t = Number(t);
  return patch;
}

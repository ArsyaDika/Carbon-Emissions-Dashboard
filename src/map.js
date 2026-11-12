import { FILL_OPACITY, THEME } from './config.js';
import { displayName } from './names.js';
import { attachValues, computeDomain, legendSpec, popupLines, boundsOf, centroidsOf, formatValue } from './mapdata.js';

const SRC = 'villages';
const PT = 'villages-pt';
const HIT = 6; // click tolerance in px, only while villages are drawn as dots (zoom < DOT_ZOOM)
const DOT_ZOOM = 11;
const SEL_MAX_ZOOM = 13;
const NARROW = '(max-width:700px)';
const SAT_ATTRIB = 'Imagery © Esri, Maxar, Earthstar Geographics';
const OUTLINE = 'rgba(232,243,234,.8)';
const NONNULL = ['!=', ['get', '_v'], null];

function styleFor() {
  return {
    version: 8,
    sources: {
      sat: {
        type: 'raster',
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
        tileSize: 256,
        maxzoom: 19,
        attribution: SAT_ATTRIB,
      },
    },
    layers: [{ id: 'sat', type: 'raster', source: 'sat', paint: { 'raster-brightness-max': 0.6, 'raster-saturation': -0.25 } }],
  };
}

function fillColor(domain) {
  const [lo, hi] = domain;
  const top = hi > lo ? hi : lo + 1e-6;
  const mid = lo + (top - lo) / 2;
  const [c0, c1, c2] = THEME.ramp;
  return ['interpolate', ['linear'], ['get', '_v'], lo, c0, mid, c1, top, c2];
}

function el(tag, props = {}, ...kids) {
  const n = document.createElement(tag);
  Object.assign(n, props);
  kids.forEach((k) => n.append(k));
  return n;
}

const escapeHtml = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// The outline follows the has-data filter: a selected polygon with no value in this period is not drawn.
function selFilter(s) {
  return ['all', NONNULL, ['==', ['get', 'id'], s.selection ? s.selection.id : '']];
}

export function createMap(container, store, data) {
  const villages = data.villages;
  const centroids = centroidsOf(villages);
  const byId = new Map(villages.features.map((f) => [f.properties.id, f]));
  const centreOf = new Map(centroids.features.map((f) => [f.properties.id, f.geometry.coordinates]));
  const hasApprox = villages.features.some((f) => f.properties.approx === true);
  const domains = new Map();
  const domainFor = (mode) => {
    if (!domains.has(mode)) domains.set(mode, computeDomain(villages, mode));
    return domains.get(mode);
  };

  const bounds = boundsOf(villages);
  const map = new maplibregl.Map({
    container,
    style: styleFor(),
    bounds: bounds || undefined,
    fitBoundsOptions: { padding: 40, animate: false },
    attributionControl: false,
  });
  const customAttribution = Array.isArray(data.meta?.attribution) ? data.meta.attribution.map(escapeHtml) : [];
  map.addControl(new maplibregl.AttributionControl({ compact: true, customAttribution }));

  const legendEl = document.getElementById('legend');
  const btnOverview = document.getElementById('btn-overview');
  let styleReady = false;
  let popup = null;
  let shown = {}; // last painted state, for cheap diffing
  let fitted = false;

  const snapshot = (s) => ({ t: s.t, mode: s.mode, selection: s.selection });

  function fitPadding() {
    const m = container.getBoundingClientRect();
    const hud = document.querySelector('.hud')?.getBoundingClientRect();
    const ctl = document.getElementById('controls')?.getBoundingClientRect();
    let top = hud ? hud.bottom - m.top + 10 : 20;
    let bottom = ctl ? m.bottom - ctl.top + 10 : 20;
    const cap = m.height * 0.7;
    if (top + bottom > cap) { const k = cap / (top + bottom); top *= k; bottom *= k; }
    return { top, bottom, left: 20, right: 20 };
  }

  function fit(animate) {
    if (bounds) map.fitBounds(bounds, { padding: fitPadding(), animate, duration: 600, maxZoom: 15 });
  }

  function addDataLayers() {
    const s = store.get();
    const outline = OUTLINE;
    const color = fillColor(domainFor(s.mode));
    map.addSource(SRC, { type: 'geojson', data: attachValues(villages, s.mode, s.t) });
    map.addLayer({ id: 'fill', type: 'fill', source: SRC, filter: NONNULL, paint: { 'fill-color': color, 'fill-opacity': FILL_OPACITY } });
    map.addSource(PT, { type: 'geojson', data: attachValues(centroids, s.mode, s.t) });
    map.addLayer({
      id: 'dot', type: 'circle', source: PT, filter: NONNULL,
      paint: {
        'circle-color': color,
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, 4, 9, 4, 11, 0],
        'circle-opacity': ['interpolate', ['linear'], ['zoom'], 9, 0.95, 11, 0],
        'circle-stroke-color': outline,
        'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 9, 1, 11, 0],
        'circle-stroke-opacity': ['interpolate', ['linear'], ['zoom'], 9, 1, 11, 0],
      },
    });
    map.addLayer({
      id: 'line', type: 'line', source: SRC,
      filter: ['all', NONNULL, ['!=', ['get', 'approx'], true]],
      paint: { 'line-color': outline, 'line-width': ['interpolate', ['linear'], ['zoom'], 6, 2.2, 9, 1.4, 12, 0.8] },
    });
    map.addLayer({
      id: 'approx', type: 'line', source: SRC,
      filter: ['all', NONNULL, ['==', ['get', 'approx'], true]],
      paint: { 'line-color': outline, 'line-width': 1, 'line-dasharray': [2, 2] },
    });
    map.addLayer({ id: 'sel', type: 'line', source: SRC, filter: selFilter(s), paint: { 'line-color': '#ffffff', 'line-width': 3 } });
    shown = snapshot(s);
  }

  function renderLegend(s) {
    if (!legendEl) return;
    const spec = legendSpec(domainFor(s.mode));
    const ramp = el('div', { className: 'ramp' });
    ramp.style.background = `linear-gradient(90deg,${THEME.ramp.join(',')})`;
    const range = el('div', { textContent: `${formatValue(spec.min)} – ${formatValue(spec.max)} ${spec.unit}` });
    const kids = [el('div', { textContent: spec.title }), ramp, range];
    if (hasApprox) {
      const sw = el('span');
      sw.style.cssText = 'display:inline-block;width:18px;height:0;border-top:2px dashed #e8f3ea;margin-right:6px;vertical-align:middle';
      kids.push(el('div', {}, sw, el('span', { textContent: 'approximate boundary' })));
    }
    legendEl.replaceChildren(...kids);
  }

  function popupContent(s) {
    const f = s.selection && byId.get(s.selection.id);
    if (!f) return null;
    const p = f.properties;
    const box = el('div');
    box.style.cssText = 'color:#0d1510;font-size:12px;line-height:1.35';
    box.append(el('strong', { textContent: displayName(p.name) }));
    if (p.approx === true) box.append(el('div', { textContent: 'approximate boundary' }));
    for (const line of popupLines(p, s.mode, s.t, domainFor(s.mode)[1])) box.append(el('div', { textContent: line }));
    return box;
  }

  // Popup sits at the selected feature's centre, whatever selected it (map click, top-10 bar, ...).
  function syncPopup(s) {
    const content = popupContent(s);
    const centre = s.selection && centreOf.get(s.selection.id);
    if (!content || !centre) {
      if (popup) { popup.remove(); popup = null; }
      return;
    }
    if (!popup) popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, maxWidth: '240px' }).setLngLat(centre).addTo(map);
    else popup.setLngLat(centre);
    popup.setDOMContent(content);
  }

  function fitSelection(s) {
    const f = s.selection && byId.get(s.selection.id);
    const b = f && boundsOf({ features: [f] });
    if (b) map.fitBounds(b, { padding: fitPadding(), maxZoom: SEL_MAX_ZOOM, duration: 600 });
  }

  function repaint(s) {
    if (!styleReady) return;
    const prev = shown;
    if (s.mode !== prev.mode || s.t !== prev.t) {
      map.getSource(SRC).setData(attachValues(villages, s.mode, s.t));
      map.getSource(PT).setData(attachValues(centroids, s.mode, s.t));
    }
    if (s.mode !== prev.mode) {
      const color = fillColor(domainFor(s.mode));
      map.setPaintProperty('fill', 'fill-color', color);
      map.setPaintProperty('dot', 'circle-color', color);
      renderLegend(s);
    }
    if (s.selection !== prev.selection) map.setFilter('sel', selFilter(s));
    const newSelection = s.selection && s.selection.id !== prev.selection?.id;
    shown = snapshot(s);
    syncPopup(s);
    if (newSelection) fitSelection(s);
    if (btnOverview) btnOverview.hidden = !s.selection;
  }

  map.on('style.load', () => {
    styleReady = true;
    addDataLayers();
    const s = store.get();
    renderLegend(s);
    syncPopup(s);
    if (btnOverview) btnOverview.hidden = !s.selection;
    if (!fitted) { fitted = true; fit(false); }
  });
  map.on('error', (e) => { console.warn('map:', e && e.error && e.error.message ? e.error.message : 'error'); });

  // Phone: MapLibre opens the compact attribution on load, covering the map. Collapse it; the (i) button still shows it.
  function collapseAttribution() {
    if (!window.matchMedia(NARROW).matches) return;
    const a = container.querySelector('.maplibregl-ctrl-attrib');
    if (!a) return;
    a.classList.remove('maplibregl-compact-show');
    a.removeAttribute('open');
  }
  map.once('load', collapseAttribution);
  map.once('idle', collapseAttribution);

  // Nearest candidate (by screen distance to its centre) among the given hits; null when none.
  function nearest(hits, point) {
    let best = null;
    let bestD = Infinity;
    for (const f of hits) {
      const id = f.properties.id;
      const c = centreOf.get(id);
      if (!c) continue;
      const p = map.project(c);
      const d = (p.x - point.x) ** 2 + (p.y - point.y) ** 2;
      if (d < bestD) { bestD = d; best = id; }
    }
    return best;
  }

  map.on('click', (e) => {
    const s = store.get();
    if (!map.getLayer('fill')) return;
    // A polygon directly under the pointer wins; the +-HIT px box only applies while villages are dots.
    let hits = map.queryRenderedFeatures(e.point, { layers: ['fill'] });
    if (!hits.length && map.getZoom() < DOT_ZOOM) {
      const { x, y } = e.point;
      hits = map.queryRenderedFeatures([[x - HIT, y - HIT], [x + HIT, y + HIT]], { layers: ['fill', 'dot'] });
    }
    const id = nearest(hits, e.point);
    if (id !== null) store.set({ selection: { id } });
    else if (s.selection) store.set({ selection: null });
  });
  for (const id of ['fill', 'dot']) {
    map.on('mouseenter', id, () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', id, () => { map.getCanvas().style.cursor = ''; });
  }

  const onOverview = () => { store.set({ selection: null }); fit(true); };
  btnOverview?.addEventListener('click', onOverview);

  const unsub = store.subscribe((s) => {
    repaint(s);
  });

  return {
    map,
    destroy() {
      unsub();
      btnOverview?.removeEventListener('click', onOverview);
      if (popup) popup.remove();
      map.remove();
    },
  };
}

import { labelFor, N_MONTHS } from './config.js';

import { DEFS, CUMULATIVE } from './copy.js';
import { renderExample } from './cumulative.js';

function node(tag, text, cls) {
  const n = document.createElement(tag);
  if (text !== undefined) n.textContent = text;
  if (cls) n.className = cls;
  return n;
}

function section(title, ...kids) {
  const s = node('div', undefined, 'panel');
  s.append(node('h4', title), ...kids);
  return s;
}

export function coveredRange(meta) {
  const n = meta && Number.isInteger(meta.months) ? Math.max(1, Math.min(meta.months, N_MONTHS)) : N_MONTHS;
  return `${labelFor(0)} – ${labelFor(n - 1)}`;
}

export function renderDataTab(el, meta, opts = {}) {
  el.replaceChildren();
  el.append(section('Covered data range', node('div', coveredRange(meta), 'dval')));

  const dl = node('dl', undefined, 'defs');
  for (const [k, v] of DEFS) dl.append(node('dt', k), node('dd', v));
  el.append(section('Metric definitions', dl));

  const cum = node('div', undefined, 'panel');
  const bullets = node('ul', undefined, 'attr');
  CUMULATIVE.bullets.forEach((b) => bullets.append(node('li', b)));
  const ex = node('div', undefined, 'example');
  ex.id = 'cum-example';
  cum.append(node('h4', CUMULATIVE.title), node('p', CUMULATIVE.intro, 'fnote'), bullets, ex);
  el.append(cum);
  if (opts.getExample) {
    const paint = () => renderExample(ex, opts.getExample());
    paint();
    if (opts.subscribe) opts.subscribe(paint);
  }

  if (opts.hasApprox) {
    el.append(section('Data note', node('p', 'Some area boundaries are approximate.', 'fnote')));
  }

  const ul = node('ul', undefined, 'attr');
  for (const t of attributionItems(meta)) ul.append(node('li', t));
  el.append(section('Attribution', ul));
}

// Boundary-data credits come only from the data file (meta.attribution); the basemap and libraries are fixed.
export function attributionItems(meta) {
  const attrib = meta && Array.isArray(meta.attribution) ? meta.attribution.filter((a) => typeof a === 'string') : [];
  return ['Basemap: Esri World Imagery (dimmed satellite)', ...attrib, 'Map rendering: MapLibre GL JS', 'Charts: Chart.js'];
}

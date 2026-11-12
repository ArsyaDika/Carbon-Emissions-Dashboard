// KPI strip rendering. Every number goes through the shared formatter in fmt.js.
import { fmt, fmtInt, fmtPct } from './fmt.js';

// "1,234.50 t · 38.80%"; either part may be missing, both missing gives a single dash.
export function fmtReduction(t, pct) {
  const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
  if (!isNum(t) && !isNum(pct)) return '–';
  return `${fmt(t)} t · ${fmtPct(pct)}`;
}

export function kpiTexts(k) {
  return {
    'kpi-farmers': fmtInt(k.farmers),
    'kpi-baseline': fmt(k.baselinePerHa),
    'kpi-emission': fmt(k.emissionPerHa),
    'kpi-yield': fmt(k.avgYield),
    'kpi-area': fmt(k.totalArea),
    'kpi-harvest': fmt(k.totalHarvestT),
    'kpi-totalemission': fmt(k.totalEmissionT),
    'kpi-reduction': fmtReduction(k.reductionT, k.reductionPct),
  };
}

// el: the .kpis container (or any ancestor holding the kpi-* ids). Uses textContent only.
export function renderKpis(el, kpis) {
  for (const [id, text] of Object.entries(kpiTexts(kpis))) {
    const node = el.querySelector(`#${id}`);
    if (node) node.textContent = text;
  }
}

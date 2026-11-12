import { FACTOR_PRE, FACTOR_N2O, FACTOR_WATER, FACTOR_FERT_TYPE } from './config.js';
import { FACTORS_FOOTNOTE } from './copy.js';
import { fmtFixed, fmtPct, sharedDecimals, DASH } from './fmt.js';

export const FOOTNOTE = FACTORS_FOOTNOTE;
export const HINT = 'Select a village on the map';
export { DASH };

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const OTHER = { actual: 'baseline', baseline: 'actual' };
const cap = (w) => w[0].toUpperCase() + w.slice(1);

function lookup(selection, factors) {
  if (!selection || !factors) return null;
  const table = factors.villages;
  const rec = table && Object.prototype.hasOwnProperty.call(table, selection.id) ? table[selection.id] : null;
  return rec || null;
}

const num = (rec, key) => (rec && isNum(rec[key]) ? rec[key] : null);

// Baseline relative to actual, from the values AS DISPLAYED (rounded to the shared decimals), so the
// text never contradicts the numbers: "+25% vs actual" when both are > 0, otherwise the absolute
// difference ("+0.0013 t/ha vs actual").
function delta(actual, baseline, d, unit) {
  const a = Number(actual.toFixed(d));
  const b = Number(baseline.toFixed(d));
  if (a === b) return null;
  if (a > 0 && b > 0) {
    const r = b / a - 1;
    return `${r > 0 ? '+' : ''}${fmtPct(r)} vs actual`;
  }
  const diff = b - a;
  return `${diff > 0 ? '+' : '-'}${fmtFixed(Math.abs(diff), d)} ${unit} vs actual`;
}

// A village-specific row from its actual and baseline values, both formatted with the same number
// of decimals (`decimals`, or enough for the smaller non-zero value). It differs only when both exist
// and their displayed values differ; a missing value shows a dash.
function computedRow(label, actual, baseline, sc, unit, decimals) {
  const d = sharedDecimals([actual, baseline], decimals);
  const [fa, fb] = [actual, baseline].map((v) => fmtFixed(v, d));
  const differs = actual !== null && baseline !== null && fa !== fb;
  return {
    label,
    value: sc === 'actual' ? fa : fb,
    computed: true,
    differs,
    other: differs ? { scenario: OTHER[sc], value: sc === 'actual' ? fb : fa } : null,
    delta: differs ? delta(actual, baseline, d, unit) : null,
  };
}

// Pure: rows grouped for rendering. A row has the shown value, and (when the other scenario differs) that value as `other`.
export function factorRows(selection, factors, scenario = 'actual') {
  const sc = scenario === 'baseline' ? 'baseline' : 'actual';
  const other = OTHER[sc];
  const rec = lookup(selection, factors);
  const stat = ([label, actual, baseline]) => {
    const shown = sc === 'actual' ? actual : baseline;
    const alt = sc === 'actual' ? baseline : actual;
    const differs = actual !== baseline;
    return { label, value: shown, computed: false, differs, other: differs ? { scenario: other, value: alt } : null };
  };
  return {
    scenario: sc,
    pre: FACTOR_PRE.map(stat),
    // Order: Direct N2O, Water regime in season, Organic, Nitrogen, Fertilizer type.
    within: [
      stat(FACTOR_N2O),
      stat(FACTOR_WATER),
      computedRow('Organic fertilizer (t/ha/season)', num(rec, 'organic_t_ha'), num(rec, 'organic_baseline_t_ha'), sc, 't/ha'),
      computedRow('Nitrogen fertilizer (kg N/ha/season)', num(rec, 'n_kg_ha'), num(rec, 'n_baseline_kg_ha'), sc, 'kg N/ha', 2),
      stat(FACTOR_FERT_TYPE),
    ],
    hasSelection: !!selection,
  };
}

function node(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

function group(title, rows, scenario) {
  const g = node('div', 'panel fgroup');
  g.append(node('h4', '', title));
  for (const r of rows) {
    const row = node('div', `frow ${r.computed ? 'computed' : 'static'}${r.differs ? ' differs' : ''}`);
    const main = node('div', 'fmain');
    const label = node('span', 'fl', r.label);
    if (r.differs) label.append(node('em', 'fbadge', `differs from ${OTHER[scenario]}`));
    main.append(label, node('span', 'fv', r.computed ? r.value : `[ ${r.value} ]`));
    row.append(main);
    if (r.other) {
      const parts = [`${cap(r.other.scenario)}: ${r.other.value}`];
      if (r.delta && scenario === 'baseline') parts.splice(0, 1, `${cap(r.other.scenario)}: ${r.other.value}`, r.delta);
      else if (r.delta) parts[0] += ` (${r.delta})`;
      row.append(node('div', 'falt', parts.join(' · ')));
    }
    g.append(row);
  }
  return g;
}

export function renderFactors(el, selection, factors, name, scenario = 'actual') {
  const rows = factorRows(selection, factors, scenario);
  el.replaceChildren();
  el.append(node('div', 'fhead', rows.hasSelection && name ? name : 'No village selected'));
  if (!rows.hasSelection) el.append(node('div', 'fhint', HINT));
  el.append(group('Pre-season management', rows.pre, rows.scenario));
  el.append(group('Within-season management', rows.within, rows.scenario));
  el.append(node('p', 'fnote', FOOTNOTE));
}

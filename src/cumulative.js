// Live worked example for Cumulative mode. Numbers come from metrics.js so they equal the KPI cards.
import { sumRange, scopeKpis, baselineTonnes } from './metrics.js';
import { labelFor } from './config.js';
import { fmt, fmtInt, fmtPct } from './fmt.js';

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const MAX_ROWS = 8;

export function cumulativeExample(data, scope, t) {
  const s = scope.series;
  const rows = [];
  for (let i = 0; i <= t; i++) {
    const a = isNum(s.a?.[i]) ? s.a[i] : null;
    const ea = isNum(s.ea?.[i]) ? s.ea[i] / 1000 : null;
    if (a !== null || ea !== null) rows.push({ t: i, label: labelFor(i), area: a, emissions: ea });
  }
  const k = scopeKpis(s, 'cumulative', t);
  const baseline = baselineTonnes(s, 'cumulative', t);
  return {
    name: scope.sel ? scope.name : 'All areas',
    range: `${labelFor(0)} – ${labelFor(t)}`,
    rows,
    area: sumRange(s.a, [0, t]),
    emissions: k.totalEmissionT,
    perHa: k.emissionPerHa,
    harvest: k.totalHarvestT,
    yield: k.avgYield,
    baseline,
    // Actual over the same months as the baseline, so "baseline - actual = reduction" always reconciles.
    pairedActual: isNum(baseline) && isNum(k.reductionT) ? baseline - k.reductionT : null,
    reduction: k.reductionT,
    reductionPct: k.reductionPct,
    farmers: k.farmers,
  };
}

// Rows shown in the table: all when <= 8, else first 4, a gap marker (null), last 4.
export function tableRows(rows) {
  if (rows.length <= MAX_ROWS) return rows;
  return [...rows.slice(0, 4), null, ...rows.slice(-4)];
}

export function exampleLines(ex) {
  const pct = isNum(ex.reductionPct) ? ` (${fmtPct(ex.reductionPct)})` : '';
  const lines = [
    `Total land area = sum of areas = ${fmt(ex.area)} ha`,
    `Actual emission per hectare = ${fmt(ex.emissions)} ÷ ${fmt(ex.area)} = ${fmt(ex.perHa)} tCO2e/ha`,
    `Total emissions = land area × actual emission per hectare = ${fmt(ex.area)} × ${fmt(ex.perHa)} = ${fmt(ex.emissions)} tCO2e`,
    `Harvest = ${fmt(ex.harvest)} t → Yield = ${fmt(ex.harvest)} ÷ ${fmt(ex.area)} = ${fmt(ex.yield)} t/ha`,
    `Reduction = baseline ${fmt(ex.baseline)} − actual ${fmt(ex.pairedActual)} = ${fmt(ex.reduction)} tCO2e${pct}`,
    `Farmers (distinct) = ${fmtInt(ex.farmers)}`,
  ];
  if (isNum(ex.pairedActual) && isNum(ex.emissions) && Math.abs(ex.pairedActual - ex.emissions) > 1e-6) {
    lines.push('Note: the reduction compares only months that have both actual and baseline values, so its actual figure differs from total emissions.');
  }
  return lines;
}

function node(tag, text, cls) {
  const n = document.createElement(tag);
  if (text !== undefined) n.textContent = text;
  if (cls) n.className = cls;
  return n;
}

export function renderExample(el, ex) {
  el.replaceChildren();
  el.append(node('h5', `${ex.name} · ${ex.range}`));
  const table = node('table', undefined, 'extable');
  const head = node('tr');
  ['Month', 'Area (ha)', 'Emissions (tCO2e)'].forEach((h) => head.append(node('th', h)));
  table.append(head);
  for (const r of tableRows(ex.rows)) {
    const tr = node('tr');
    if (r === null) {
      const td = node('td', '…');
      td.colSpan = 3;
      tr.append(td);
    } else {
      tr.append(node('td', r.label), node('td', fmt(r.area)), node('td', fmt(r.emissions)));
    }
    table.append(tr);
  }
  if (!ex.rows.length) {
    const tr = node('tr');
    const td = node('td', 'No data in this range');
    td.colSpan = 3;
    tr.append(td);
    table.append(tr);
  }
  el.append(table);
  const ul = node('ul', undefined, 'exlines');
  exampleLines(ex).forEach((l) => ul.append(node('li', l)));
  el.append(ul);
}

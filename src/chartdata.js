// Pure data preparation for the chart dock (no DOM, no Chart.js).
import { rangeFor, colorValue } from './metrics.js';
import { N_MONTHS } from './config.js';
import { displayName } from './names.js';

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

function monthly(series, mode, t, valueAt) {
  const range = rangeFor(mode, t);
  const values = [];
  for (let i = 0; i < N_MONTHS; i++) values.push(valueAt(series, i));
  return { values, range, inRange: values.map((_, i) => i >= range[0] && i <= range[1]) };
}

// Actual emissions per month, tCO2e (null when the month has no data).
export function trendSeries(series, mode, t) {
  return monthly(series, mode, t, (s, i) => (isNum(s.ea?.[i]) ? s.ea[i] / 1000 : null));
}

// Baseline minus actual per month, tCO2e; only months where both are present.
export function reductionSeries(series, mode, t) {
  return monthly(series, mode, t, (s, i) => (isNum(s.eb?.[i]) && isNum(s.ea?.[i]) ? (s.eb[i] - s.ea[i]) / 1000 : null));
}

// Villages ranked by actual emission per ha over the range; null values are skipped.
export function topVillages(features, mode, t, n = 10) {
  const rows = [];
  for (const f of features) {
    const v = colorValue(f.properties, mode, t, 'actual');
    if (v !== null) rows.push({ id: f.properties.id, name: displayName(f.properties.name), sub: displayName(f.properties.subdistrict), value: v });
  }
  rows.sort((a, b) => b.value - a.value || (a.id < b.id ? -1 : 1));
  return rows.slice(0, n);
}

// Decimals needed so adjacent axis ticks stay distinct (step 0.1 -> 1, 0.05 -> 2, >= 1 -> 0).
export function axisDecimals(ticks) {
  const vals = (ticks || []).map((t) => (typeof t === 'number' ? t : t?.value)).filter((v) => Number.isFinite(v));
  let step = Infinity;
  for (let i = 1; i < vals.length; i++) step = Math.min(step, Math.abs(vals[i] - vals[i - 1]));
  if (vals.length === 1) step = Math.abs(vals[0]) || Infinity; // lone tick: keep its significant digit
  if (!Number.isFinite(step) || step === 0 || step >= 1) return 0;
  return Math.min(4, Math.ceil(-Math.log10(step) - 1e-9));
}

// a / b in kg/kg; null when either side is missing or the denominator is zero (a gap, never 0).
const kgRatio = (num, den) => (isNum(num) && isNum(den) && den !== 0 ? num / den : null);

// Emission intensity per month, kg CO2e per kg grain: monthly emission kg / monthly harvest kg (no summing across months).
// Null where emission or harvest is missing or harvest is zero. diff = actual - baseline, only when both exist.
export function intensitySeries(series, mode, t) {
  const actual = [], baseline = [], diff = [];
  for (let i = 0; i < N_MONTHS; i++) {
    const a = kgRatio(series.ea?.[i], series.q?.[i]);
    const b = kgRatio(series.eb?.[i], series.q?.[i]);
    actual.push(a);
    baseline.push(b);
    diff.push(a !== null && b !== null ? a - b : null);
  }
  const range = rangeFor(mode, t);
  return { actual, baseline, diff, range, inRange: actual.map((_, i) => i >= range[0] && i <= range[1]) };
}

// Monthly reduction bars (tCO2e, paired months only, as reductionSeries) plus the running total since Apr 2024.
// Months without a paired value add nothing: the bar is null and the line carries the previous total forward.
// The line stays null before the first paired month (nothing accumulated yet; never drawn as 0).
// cumulative[23] equals scopeKpis(series, 'cumulative', 23).reductionT.
export function reductionRunning(series, mode, t) {
  const bars = reductionSeries(series, mode, t);
  const cumulative = [];
  let run = 0, started = false;
  for (const v of bars.values) {
    if (isNum(v)) { run += v; started = true; }
    cumulative.push(started ? run : null);
  }
  return { bars: bars.values, cumulative, range: bars.range, inRange: bars.inRange, selected: t };
}

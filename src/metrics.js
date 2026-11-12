const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

export function rangeFor(mode, t) {
  return mode === 'cumulative' ? [0, t] : [t, t];
}

export function sumRange(arr, [s, e]) {
  let sum = 0;
  let any = false;
  for (let i = s; i <= e; i++) {
    const v = arr ? arr[i] : null;
    if (isNum(v)) { sum += v; any = true; }
  }
  return any ? sum : null;
}

// a / b, or null when either side is missing or the denominator is zero.
function ratio(a, b) {
  if (!isNum(a) || !isNum(b) || b === 0) return null;
  const r = a / b;
  return Number.isFinite(r) ? r : null;
}

// Sums (eb - ea), eb and area only over months where eb and ea (and a, for area) are present.
function pairedSums(series, [s, e]) {
  let red = 0, base = 0, area = 0, anyArea = false, any = false;
  for (let i = s; i <= e; i++) {
    const eb = series.eb?.[i], ea = series.ea?.[i];
    if (isNum(eb) && isNum(ea)) {
      red += eb - ea; base += eb; any = true;
      if (isNum(series.a?.[i])) { area += series.a[i]; anyArea = true; }
    }
  }
  return any ? { red, base, area: anyArea ? area : null } : null;
}

const div1000 = (v) => (isNum(v) ? v / 1000 : null);

export function scopeKpis(series, mode, t) {
  const r = rangeFor(mode, t);
  const area = sumRange(series.a, r);
  const harvest = sumRange(series.q, r);
  const ea = sumRange(series.ea, r);
  const farmersRaw = (mode === 'cumulative' ? series.fc : series.f)?.[t];
  const paired = pairedSums(series, r);
  const reductionT = paired ? paired.red / 1000 : null;
  // Assumption: the ETL keeps a, q, ea null together, so these literal ratios are consistent.
  return {
    farmers: isNum(farmersRaw) ? farmersRaw : null,
    emissionPerHa: ratio(div1000(ea), area),
    avgYield: ratio(div1000(harvest), area),
    totalArea: area,
    totalHarvestT: div1000(harvest),
    totalEmissionT: div1000(ea),
    reductionT,
    reductionPct: paired ? ratio(reductionT, paired.base / 1000) : null,
    // Baseline per hectare uses the same paired months (and their area) as the reduction, so the cards agree.
    baselinePerHa: paired ? ratio(paired.base / 1000, paired.area) : null,
  };
}

// Baseline emissions (tCO2e) over the months where baseline and actual are both present (same set as reduction).
export function baselineTonnes(series, mode, t) {
  const p = pairedSums(series, rangeFor(mode, t));
  return p ? p.base / 1000 : null;
}

export function colorValue(series, mode, t, metric) {
  const r = rangeFor(mode, t);
  const area = sumRange(series.a, r);
  let num;
  if (metric === 'actual') num = sumRange(series.ea, r);
  else if (metric === 'baseline') num = sumRange(series.eb, r);
  else if (metric === 'reduction') {
    const p = pairedSums(series, r);
    return p ? ratio(div1000(p.red), p.area) : null;
  }
  else throw new RangeError(`unknown metric: ${metric}`);
  return ratio(div1000(num), area);
}

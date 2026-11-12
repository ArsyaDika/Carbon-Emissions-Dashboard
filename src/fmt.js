// The one number formatter for every displayed figure. Pure.
// Round to 2 decimals; whole numbers have no decimals ("4"), others exactly two ("4.50"); thousands separators.
// A positive value that would round to 0 stays readable: up to 4 decimals ("0.0034"), else "<0.01".
export const DASH = '–';
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

export function fmt(v) {
  if (!isNum(v)) return DASH;
  const r = Number(v.toFixed(2)) + 0; // "+ 0" turns -0 into 0
  if (r === 0 && v > 0) {
    const r4 = Number(v.toFixed(4));
    return r4 > 0 ? String(r4) : '<0.01';
  }
  const d = Number.isInteger(r) ? 0 : 2;
  return r.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}

// Integer counts (farmers, villages).
export function fmtInt(v) {
  return isNum(v) ? Math.round(v).toLocaleString('en-US', { maximumFractionDigits: 0 }) : DASH;
}

// Decimals that show v with 2 significant digits, within [min, max] (0.0015 -> 4, 0.0115 -> 3, 0.44 -> 2).
export function sigDecimals(v, min = 2, max = 4) {
  if (!isNum(v) || v <= 0) return min;
  return Math.min(max, Math.max(min, 1 - Math.floor(Math.log10(v))));
}

// One number of decimals for values shown side by side: `decimals` if given, else enough for the
// smallest positive value (sigDecimals); 0 when every value is whole at that precision.
export function sharedDecimals(values, decimals) {
  const nums = values.filter(isNum);
  let d = decimals;
  if (d === undefined) {
    const pos = nums.filter((v) => v > 0);
    d = pos.length ? Math.max(...pos.map((v) => sigDecimals(v))) : 2;
  }
  return nums.every((v) => Number.isInteger(Number(v.toFixed(d)))) ? 0 : d;
}

// Fixed decimals with thousands separators; exact zero stays "0"; a positive value below the
// precision shows "<0.0001"-style instead of 0.
export function fmtFixed(v, d) {
  if (!isNum(v)) return DASH;
  const r = Number(v.toFixed(d)) + 0;
  if (r === 0) return v > 0 ? `<${(10 ** -d).toFixed(d)}` : '0';
  return r.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}

// Values shown together, all with the same number of decimals.
export function fmtSame(values, decimals) {
  const d = sharedDecimals(values, decimals);
  return values.map((v) => fmtFixed(v, d));
}

// A ratio (0.388) shown as a percentage with the same rule: "38.80%", "25%".
export function fmtPct(ratio) {
  return isNum(ratio) ? `${fmt(ratio * 100)}%` : DASH;
}

export const N_MONTHS = 24;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function labelFor(t) {
  if (!Number.isInteger(t) || t < 0 || t >= N_MONTHS) throw new RangeError(`month index out of range: ${t}`);
  const m = (t + 3) % 12;
  const y = 2024 + Math.floor((t + 3) / 12);
  return `${MONTHS[m]} ${y}`;
}

// Slider label: one month, or the cumulative range ending at the selected month.
export function periodLabel(mode, t) {
  const p = mode === 'cumulative'
    ? { prefix: 'Cumulative:', value: `${labelFor(0)} – ${labelFor(t)}` }
    : { prefix: 'Month:', value: labelFor(t) };
  return { ...p, text: `${p.prefix} ${p.value}` };
}

export const FILL_OPACITY = 0.38;

export const THEME = {
  bg: '#0d1510',
  surface: '#142019',
  line: '#27402f',
  accent: '#a3e635',
  ramp: ['#365314', '#a3e635', '#fb923c'],
};

export const TAGLINE = 'See the paddies behind the numbers.';

// Static management-practice rows: [label, actual value, baseline value].
export const FACTOR_PRE = [
  ['Tractor type', '<20 cm', '<20 cm'],
  ['Water regime before crop season', 'flooded <30 days', 'flooded <30 days'],
  ['Duration of straw incorporation', 'short ≤ 30 days', 'short ≤ 30 days'],
  ['Weight of stubble left on the field', 'average 20 cm', 'average 30 cm'],
];
export const FACTOR_N2O = ['Direct N2O emission factor', 'continuous flooding', 'continuous flooding'];
export const FACTOR_WATER = ['Water regime within crop season', 'irrigated – multiple drainage periods', 'irrigated – continuous flooded'];
export const FACTOR_FERT_TYPE = ['Fertilizer type', 'NPK + urea', 'NPK + urea'];

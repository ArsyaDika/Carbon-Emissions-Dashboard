// Display-only safety formatter for place names: "SUMBERAGUNG-BANTUL" -> "Sumberagung-Bantul". Pure.
export function displayName(name) {
  if (typeof name !== 'string') return '';
  return name.trim().replace(/[^\s-]+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

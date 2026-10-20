// Shared numeric formatting. Display-only: never alters the underlying values.
// Integers print as-is, other numbers are rounded to `precision` decimals with
// trailing zeros trimmed, and very small non-zero values switch to exponent form
// so they never display as a misleading "0".
export function fmt(v, precision = 4) {
  if (v === null || v === undefined) return 'N/A';
  if (typeof v !== 'number') return String(v);
  if (!Number.isFinite(v)) return String(v);
  if (Number.isInteger(v)) return String(v);
  if (Math.abs(v) < Math.pow(10, -precision)) return v.toExponential(2);
  return String(Number(v.toFixed(precision)));
}

// "[a, b, c]" style vector string (no brackets).
export function fmtVec(arr, precision = 4) {
  if (!Array.isArray(arr)) return 'N/A';
  return arr.map((x) => fmt(x, precision)).join(', ');
}

// Pure consistency-check helpers. They only compare values the backend returned against
// values recomputed from other backend-returned data; they never alter what is displayed.

export const nearlyEqual = (a, b, tol = 1e-8) =>
  typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));

export const shapeOf = (m) => (Array.isArray(m) ? [m.length, Array.isArray(m[0]) ? m[0].length : null] : null);

export function zeroPad(img, pad) {
  if (!pad || pad <= 0) return img;
  const h = img.length;
  const w = img[0].length;
  const out = Array.from({ length: h + 2 * pad }, () => Array(w + 2 * pad).fill(0));
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) out[r + pad][c + pad] = img[r][c];
  return out;
}

// Cross-correlation (no kernel flip), the convention used by CNN layers.
export function crossCorrelate(padded, kernel, stride) {
  const kh = kernel.length;
  const kw = kernel[0].length;
  const out = [];
  for (let r = 0; r + kh <= padded.length; r += stride) {
    const row = [];
    for (let c = 0; c + kw <= padded[0].length; c += stride) {
      let s = 0;
      for (let i = 0; i < kh; i++) for (let j = 0; j < kw; j++) s += padded[r + i][c + j] * kernel[i][j];
      row.push(s);
    }
    out.push(row);
  }
  return out;
}

// Compare two 2D arrays. Returns { ok, sameShape, maxDiff, cells }.
export function compareMatrices(a, b, tol = 1e-8) {
  if (!Array.isArray(a) || !Array.isArray(b)) return { ok: false, sameShape: false, maxDiff: null, cells: 0 };
  const sa = shapeOf(a);
  const sb = shapeOf(b);
  if (sa[0] !== sb[0] || sa[1] !== sb[1]) return { ok: false, sameShape: false, maxDiff: null, cells: 0, shapeA: sa, shapeB: sb };
  let maxDiff = 0;
  let ok = true;
  for (let r = 0; r < a.length; r++)
    for (let c = 0; c < a[r].length; c++) {
      const d = Math.abs(a[r][c] - b[r][c]);
      if (!(d <= tol * Math.max(1, Math.abs(a[r][c]), Math.abs(b[r][c])))) ok = false;
      if (d > maxDiff || Number.isNaN(d)) maxDiff = d;
    }
  return { ok, sameShape: true, maxDiff, cells: a.length * a[0].length };
}

export function compareVectors(a, b, tol = 1e-8) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return { ok: false, sameShape: false, maxDiff: null };
  let maxDiff = 0;
  let ok = true;
  a.forEach((x, i) => {
    const d = Math.abs(x - b[i]);
    if (!(d <= tol * Math.max(1, Math.abs(x), Math.abs(b[i])))) ok = false;
    if (d > maxDiff || Number.isNaN(d)) maxDiff = d;
  });
  return { ok, sameShape: true, maxDiff };
}

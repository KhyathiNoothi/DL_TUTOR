import React, { useEffect, useRef } from 'react';
import { fmt } from '../utils/format';

export default function Matrix({
  title,
  data,
  highlightRow,
  highlightCol,
  highlightPatch,
  colorScheme = 'indigo',
  compact = false,
  subtitle,
  padding = 0,
  onCellClick,
  precision = 4,
  maxHeight = 'max-h-72',
}) {
  const scrollRef = useRef(null);
  const hiRef = useRef(null);

  const isValid = data && Array.isArray(data) && data.length > 0;
  const matrix = isValid ? (Array.isArray(data[0]) ? data : [data]) : [];
  const numRows = matrix.length;
  const numCols = isValid ? Math.max(...matrix.map((r) => (Array.isArray(r) ? r.length : 0)), 1) : 1;

  // If the highlighted cell is outside the visible part of the scroll region, scroll *only that region*
  // (never the page) so the selected cell is always visible.
  useEffect(() => {
    const box = scrollRef.current;
    const cell = hiRef.current;
    if (!box || !cell) return;
    const b = box.getBoundingClientRect();
    const c = cell.getBoundingClientRect();
    if (c.left < b.left) box.scrollLeft -= b.left - c.left + 8;
    else if (c.right > b.right) box.scrollLeft += c.right - b.right + 8;
    if (c.top < b.top) box.scrollTop -= b.top - c.top + 8;
    else if (c.bottom > b.bottom) box.scrollTop += c.bottom - b.bottom + 8;
  }, [highlightRow, highlightCol, highlightPatch?.startRow, highlightPatch?.startCol]);

  if (!isValid) {
    return (
      <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 text-center text-xs text-slate-500 font-mono">
        No Matrix Data
      </div>
    );
  }

  const formatCell = (val) => (typeof val === 'number' ? fmt(val, precision) : String(val));

  // Column width is derived from the longest formatted value (monospace => ch is exact),
  // so a number can never be clipped or spill into its neighbour. Wider matrices scroll.
  const longest = matrix.reduce(
    (m, row) => (Array.isArray(row) ? row.reduce((mm, v) => Math.max(mm, formatCell(v).length), m) : m),
    1
  );
  const colMin = `calc(${Math.max(longest, 2)}ch + 1.25rem)`;

  const isPaddedCell = (r, c) =>
    padding > 0 && (r < padding || r >= numRows - padding || c < padding || c >= numCols - padding);

  const getCellBg = (val, isPadded) => {
    if (isPadded) return 'bg-slate-950/80 text-slate-500 border-slate-800/80 border-dashed';
    const num = Number(val);
    if (isNaN(num)) return 'bg-slate-800 text-slate-300 border-slate-700';
    if (colorScheme === 'emerald') return num > 0 ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60' : 'bg-slate-900 text-slate-400 border-slate-800';
    if (colorScheme === 'amber') return num > 0 ? 'bg-amber-950/80 text-amber-300 border-amber-800/60' : 'bg-slate-900 text-slate-400 border-slate-800';
    if (colorScheme === 'rose') {
      if (num < 0) return 'bg-rose-950/80 text-rose-300 border-rose-800/60';
      if (num > 0) return 'bg-indigo-950/80 text-indigo-300 border-indigo-800/60';
      return 'bg-slate-900 text-slate-400 border-slate-800';
    }
    if (colorScheme === 'cyan') return num > 0 ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800/60' : 'bg-slate-900 text-slate-400 border-slate-800';
    if (num > 0) return 'bg-indigo-950/70 text-indigo-200 border-indigo-800/50';
    if (num < 0) return 'bg-rose-950/70 text-rose-300 border-rose-800/50';
    return 'bg-slate-900 text-slate-400 border-slate-800';
  };

  const isHighlighted = (r, c) => {
    if (highlightRow === r && highlightCol === c) return true;
    if (highlightPatch) {
      const { startRow, endRow, startCol, endCol } = highlightPatch;
      return r >= startRow && r <= endRow && c >= startCol && c <= endCol;
    }
    return false;
  };

  const firstHi = (() => {
    for (let r = 0; r < numRows; r++)
      for (let c = 0; c < (matrix[r]?.length || 0); c++) if (isHighlighted(r, c)) return `${r}-${c}`;
    return null;
  })();

  return (
    <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-3 space-y-2 min-w-0 max-w-full">
      {(title || subtitle) && (
        <div className="flex flex-wrap items-baseline justify-between gap-x-2">
          {title && <span className="text-xs font-semibold text-slate-300 font-mono break-words">{title}</span>}
          {subtitle && <span className="text-[10px] text-slate-500 font-mono break-words">{subtitle}</span>}
        </div>
      )}

      {/* Own scroll region: a big matrix scrolls here instead of widening the page. */}
      <div ref={scrollRef} className={`scroll-box ${maxHeight} p-1`}>
        <div
          className="grid gap-1.5"
          style={{ gridTemplateColumns: `repeat(${numCols}, minmax(${colMin}, 1fr))`, width: 'max-content', minWidth: '100%' }}
        >
          {matrix.map((row, rIdx) =>
            (Array.isArray(row) ? row : [row]).map((val, cIdx) => {
              const highlighted = isHighlighted(rIdx, cIdx);
              const padded = isPaddedCell(rIdx, cIdx);
              return (
                <div
                  key={`${rIdx}-${cIdx}`}
                  ref={`${rIdx}-${cIdx}` === firstHi ? hiRef : null}
                  onClick={() => onCellClick && onCellClick(rIdx, cIdx)}
                  title={typeof val === 'number' ? `[${rIdx}][${cIdx}] = ${val}` : undefined}
                  className={`relative flex flex-col items-center justify-center rounded-lg border font-mono whitespace-nowrap transition-colors ${
                    onCellClick ? 'cursor-pointer hover:border-amber-400/70' : ''
                  } ${compact ? 'h-8 px-1 text-xs' : 'h-10 px-2 text-xs font-bold'} ${getCellBg(val, padded)} ${
                    highlighted ? 'ring-2 ring-amber-400 z-10 bg-amber-500/20 text-amber-200 border-amber-400' : ''
                  }`}
                >
                  <span>{formatCell(val)}</span>
                  {padded && <span className="text-[8px] text-slate-600 leading-none">pad</span>}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

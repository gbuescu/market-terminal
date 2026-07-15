export function fmtPrice(x: number | undefined): string {
  if (x === undefined || Number.isNaN(x)) return '—';
  const abs = Math.abs(x);
  const decimals = abs >= 1000 ? 2 : abs >= 10 ? 2 : abs >= 1 ? 3 : 4;
  return x.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function fmtChange(x: number | undefined): string {
  if (x === undefined || Number.isNaN(x)) return '—';
  return `${x >= 0 ? '+' : ''}${fmtPrice(x)}`;
}

export function fmtPct(x: number | undefined): string {
  if (x === undefined || Number.isNaN(x)) return '—';
  return `${x >= 0 ? '+' : ''}${x.toFixed(2)}%`;
}

/** Large money amounts: 2.41T, 890.2B, 45.1M. */
export function fmtLarge(x: number | null | undefined): string {
  if (x === null || x === undefined || Number.isNaN(x)) return '—';
  const sign = x < 0 ? '-' : '';
  const abs = Math.abs(x);
  if (abs >= 1e12) return `${sign}${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(1)}M`;
  return `${sign}${abs.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

/** Ratio-ish metric with fixed decimals, '—' for missing. */
export function fmtNum(x: number | undefined, decimals = 2): string {
  if (x === undefined || Number.isNaN(x)) return '—';
  return x.toFixed(decimals);
}

export function fmtVolume(x: number | undefined): string {
  if (x === undefined) return '—';
  if (x >= 1e9) return `${(x / 1e9).toFixed(2)}B`;
  if (x >= 1e6) return `${(x / 1e6).toFixed(2)}M`;
  if (x >= 1e3) return `${(x / 1e3).toFixed(1)}K`;
  return String(x);
}

export function fmtTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleTimeString([], { hour12: false });
}

export function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.toLocaleDateString([], { month: 'short', day: '2-digit' })} ${d.toLocaleTimeString(
    [],
    { hour: '2-digit', minute: '2-digit', hour12: false },
  )}`;
}

/** CSS class for up/down coloring. */
export function signClass(x: number | undefined): string {
  if (x === undefined || x === 0) return '';
  return x > 0 ? 'pos' : 'neg';
}

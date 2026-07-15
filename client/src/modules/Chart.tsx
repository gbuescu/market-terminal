import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Candle, Range, Series } from '../../../shared/types';
import { RANGES } from '../../../shared/types';
import { getEnvelope } from '../api/client';
import { useEnvelope } from '../api/useData';
import { DataBadge } from '../components/DataBadge';
import { ModuleFrame, StateView } from '../components/ModuleFrame';
import { fmtPct, fmtPrice, fmtVolume } from '../lib/format';
import { normalizePct, sma } from '../lib/indicators';
import type { Tab } from '../state/workspace';

const H = 340;
const VOL_H = 56;
const PAD = { top: 12, right: 70, bottom: 26, left: 8 };
/** Primary is amber; comparison series cycle through the rest. */
const SERIES_COLORS = ['#f0a500', '#4aa8ff', '#2ecc71', '#e879f9', '#f97316'];
const SYMBOL_RE = /^[A-Z0-9.\-:^=/]{1,15}$/;

interface Plotted {
  symbol: string;
  candles: Candle[];
}

interface Options {
  sma50: boolean;
  sma200: boolean;
  volume: boolean;
  pct: boolean;
}

function fmtDate(iso: string, range: Range): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return range === '1D' || range === '5D'
    ? d.toLocaleString([], {
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    : d.toLocaleDateString([], { year: 'numeric', month: 'short', day: '2-digit' });
}

function ChartCanvas({
  primary,
  compares,
  range,
  options,
  onRemoveCompare,
}: {
  primary: Plotted;
  compares: Plotted[];
  range: Range;
  options: Options;
  onRemoveCompare: (symbol: string) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);
  const [hover, setHover] = useState<number | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      if (wrapRef.current) setWidth(Math.max(360, wrapRef.current.clientWidth));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const series = useMemo(() => [primary, ...compares], [primary, compares]);
  const isPct = options.pct || compares.length > 0;
  const primaryHasVolume = primary.candles.some((c) => c.v != null);
  const volArea = options.volume && !isPct && primaryHasVolume;

  const plotLeft = PAD.left;
  const plotRight = width - PAD.right;
  const plotW = plotRight - plotLeft;
  const priceTop = PAD.top;
  const priceBottom = volArea ? H - PAD.bottom - VOL_H : H - PAD.bottom;
  const priceH = priceBottom - priceTop;
  const volTop = H - PAD.bottom - VOL_H + 8;
  const volBottom = H - PAD.bottom;

  const nPrimary = primary.candles.length;
  const primaryCloses = primary.candles.map((c) => c.c);

  // y-domain: price uses primary highs/lows; pct uses all series' pct spread.
  const pctSeries = useMemo(
    () => series.map((s) => normalizePct(s.candles.map((c) => c.c))),
    [series],
  );
  const { min, max } = useMemo(() => {
    if (isPct) {
      let lo = Number.POSITIVE_INFINITY;
      let hi = Number.NEGATIVE_INFINITY;
      for (const arr of pctSeries) {
        for (const v of arr) {
          if (v < lo) lo = v;
          if (v > hi) hi = v;
        }
      }
      return { min: lo, max: hi };
    }
    let lo = Number.POSITIVE_INFINITY;
    let hi = Number.NEGATIVE_INFINITY;
    for (const c of primary.candles) {
      if (c.l < lo) lo = c.l;
      if (c.h > hi) hi = c.h;
    }
    return { min: lo, max: hi };
  }, [isPct, pctSeries, primary]);

  const span = max - min || Math.abs(max) * 0.01 || 1;
  const x = (i: number, n: number) => plotLeft + (i / Math.max(1, n - 1)) * plotW;
  const y = (v: number) => priceTop + (1 - (v - min) / span) * priceH;

  const linePath = (vals: (number | null)[], n: number): string => {
    let d = '';
    let started = false;
    vals.forEach((v, i) => {
      if (v == null) {
        started = false;
        return;
      }
      d += `${started ? 'L' : 'M'}${x(i, n).toFixed(1)},${y(v).toFixed(1)} `;
      started = true;
    });
    return d.trim();
  };

  const gridLevels = [0, 0.25, 0.5, 0.75, 1].map((f) => min + f * span);
  const sma50 = options.sma50 && !isPct ? sma(primaryCloses, 50) : null;
  const sma200 = options.sma200 && !isPct ? sma(primaryCloses, 200) : null;

  const volMax = volArea ? Math.max(...primary.candles.map((c) => c.v ?? 0)) : 0;
  const barW = Math.max(1, (plotW / Math.max(1, nPrimary)) * 0.66);

  // Hover: map cursor x to a primary index; other series sample the same fraction.
  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * width;
    const f = (mx - plotLeft) / plotW;
    const idx = Math.round(f * (nPrimary - 1));
    setHover(Math.min(Math.max(idx, 0), nPrimary - 1));
  };
  const sampleIdx = (n: number) =>
    hover == null ? -1 : Math.min(n - 1, Math.round((hover / Math.max(1, nPrimary - 1)) * (n - 1)));

  const yAxisLabel = (v: number) => (isPct ? `${v >= 0 ? '+' : ''}${v.toFixed(1)}%` : fmtPrice(v));
  const hoverX = hover != null ? x(hover, nPrimary) : 0;
  const tooltipLeft = Math.min(Math.max(hoverX + 12, 8), width - 190);

  const primaryLast = primaryCloses[nPrimary - 1];
  const primaryFirst = primaryCloses[0];

  return (
    <div ref={wrapRef} className="chart-wrap">
      {(compares.length > 0 || options.sma50 || options.sma200) && (
        <div className="chart-legend">
          {series.map((s, i) => {
            const arr = pctSeries[i];
            const lastPct = arr[arr.length - 1];
            return (
              <span key={s.symbol} className="legend-item">
                <span className="legend-swatch" style={{ background: SERIES_COLORS[i % 5] }} />
                <span className="accent">{s.symbol}</span>
                {isPct && (
                  <span className={lastPct >= 0 ? 'pos' : 'neg'}>
                    {lastPct >= 0 ? '+' : ''}
                    {lastPct.toFixed(1)}%
                  </span>
                )}
                {i > 0 && (
                  <button
                    type="button"
                    className="legend-x"
                    aria-label={`Remove ${s.symbol}`}
                    onClick={() => onRemoveCompare(s.symbol)}
                  >
                    ×
                  </button>
                )}
              </span>
            );
          })}
          {sma50 && (
            <span className="legend-item">
              <span className="legend-swatch legend-dash" style={{ background: '#8aa0c0' }} /> SMA50
            </span>
          )}
          {sma200 && (
            <span className="legend-item">
              <span className="legend-swatch legend-dash" style={{ background: '#c08a8a' }} />{' '}
              SMA200
            </span>
          )}
        </div>
      )}

      <div className="chart-svg-wrap">
        <svg
          width={width}
          height={H}
          role="img"
          aria-label={`${primary.symbol} chart`}
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        >
          {gridLevels.map((v) => (
            <g key={v}>
              <line x1={plotLeft} x2={plotRight} y1={y(v)} y2={y(v)} className="chart-grid" />
              <text x={plotRight + 6} y={y(v) + 3.5} className="chart-label">
                {yAxisLabel(v)}
              </text>
            </g>
          ))}
          {isPct && min < 0 && max > 0 && (
            <line x1={plotLeft} x2={plotRight} y1={y(0)} y2={y(0)} className="chart-zero" />
          )}

          {/* Volume bars (single-symbol price mode) */}
          {volArea &&
            primary.candles.map((c, i) => {
              const v = c.v ?? 0;
              const h = volMax > 0 ? (v / volMax) * (volBottom - volTop) : 0;
              return (
                <rect
                  key={c.t}
                  x={x(i, nPrimary) - barW / 2}
                  y={volBottom - h}
                  width={barW}
                  height={h}
                  className="chart-volbar"
                />
              );
            })}

          {/* SMA overlays */}
          {sma50 && (
            <path
              d={linePath(sma50, nPrimary)}
              className="chart-ma"
              style={{ stroke: '#8aa0c0' }}
            />
          )}
          {sma200 && (
            <path
              d={linePath(sma200, nPrimary)}
              className="chart-ma"
              style={{ stroke: '#c08a8a' }}
            />
          )}

          {/* Price / pct lines */}
          {series.map((s, i) => {
            const vals = isPct ? pctSeries[i] : s.candles.map((c) => c.c);
            return (
              <path
                key={s.symbol}
                d={linePath(vals, s.candles.length)}
                className="chart-series"
                style={{ stroke: SERIES_COLORS[i % 5] }}
              />
            );
          })}

          {/* Crosshair */}
          {hover != null && (
            <g>
              <line
                x1={hoverX}
                x2={hoverX}
                y1={priceTop}
                y2={priceBottom}
                className="chart-cross"
              />
              {series.map((s, i) => {
                const si = sampleIdx(s.candles.length);
                if (si < 0) return null;
                const v = isPct ? pctSeries[i][si] : s.candles[si].c;
                return (
                  <circle
                    key={s.symbol}
                    cx={x(si, s.candles.length)}
                    cy={y(v)}
                    r={3}
                    style={{ fill: SERIES_COLORS[i % 5] }}
                  />
                );
              })}
            </g>
          )}
        </svg>

        {hover != null && primary.candles[hover] && (
          <div className="chart-tooltip" style={{ left: tooltipLeft }}>
            <div className="tt-date">{fmtDate(primary.candles[hover].t, range)}</div>
            {isPct ? (
              series.map((s, i) => {
                const si = sampleIdx(s.candles.length);
                const p = si >= 0 ? pctSeries[i][si] : null;
                return (
                  <div key={s.symbol} className="tt-row">
                    <span className="legend-swatch" style={{ background: SERIES_COLORS[i % 5] }} />
                    <span>{s.symbol}</span>
                    <span className={`num ${p != null && p >= 0 ? 'pos' : 'neg'}`}>
                      {p != null ? `${p >= 0 ? '+' : ''}${p.toFixed(2)}%` : '—'}
                    </span>
                  </div>
                );
              })
            ) : (
              <>
                <div className="tt-row">
                  <span className="dim">O</span>
                  <span className="num">{fmtPrice(primary.candles[hover].o)}</span>
                  <span className="dim">H</span>
                  <span className="num">{fmtPrice(primary.candles[hover].h)}</span>
                </div>
                <div className="tt-row">
                  <span className="dim">L</span>
                  <span className="num">{fmtPrice(primary.candles[hover].l)}</span>
                  <span className="dim">C</span>
                  <span className="num accent">{fmtPrice(primary.candles[hover].c)}</span>
                </div>
                {primary.candles[hover].v != null && (
                  <div className="tt-row">
                    <span className="dim">Vol</span>
                    <span className="num">{fmtVolume(primary.candles[hover].v)}</span>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="chart-caption">
        <span className="accent">{primary.symbol}</span>
        {!isPct && (
          <span>
            last <span className="num">{fmtPrice(primaryLast)}</span>
          </span>
        )}
        <span className={primaryLast - primaryFirst >= 0 ? 'pos' : 'neg'}>
          {fmtPct(((primaryLast - primaryFirst) / primaryFirst) * 100)} over {range}
        </span>
        <span className="dim">
          {nPrimary} bars · {primary.candles.length > 0 ? range : ''}
          {compares.length > 0 ? ` · vs ${compares.map((c) => c.symbol).join(', ')}` : ''}
        </span>
      </div>
    </div>
  );
}

export function Chart({ tab }: { tab: Tab }) {
  const symbol = tab.symbol ?? null;
  const [range, setRange] = useState<Range>('6M');
  const [opts, setOpts] = useState<Options>({
    sma50: false,
    sma200: false,
    volume: false,
    pct: false,
  });
  const [compareSyms, setCompareSyms] = useState<string[]>([]);
  const [compares, setCompares] = useState<Plotted[]>([]);
  const [addValue, setAddValue] = useState('');

  const { state, refresh } = useEnvelope<Series>(
    symbol ? `/api/series?symbol=${encodeURIComponent(symbol)}&range=${range}` : null,
  );

  // Fetch comparison series whenever the set of symbols or the range changes.
  useEffect(() => {
    if (compareSyms.length === 0) {
      setCompares([]);
      return;
    }
    let cancelled = false;
    Promise.all(
      compareSyms.map((s) =>
        getEnvelope<Series>(`/api/series?symbol=${encodeURIComponent(s)}&range=${range}`)
          .then((e) => ({ symbol: e.data.symbol, candles: e.data.candles }) as Plotted)
          .catch(() => null),
      ),
    ).then((res) => {
      if (!cancelled) setCompares(res.filter((r): r is Plotted => r !== null));
    });
    return () => {
      cancelled = true;
    };
  }, [compareSyms, range]);

  if (!symbol) {
    return (
      <ModuleFrame tab={tab}>
        <StateView
          kind="empty"
          title="No security selected"
          detail="Run the chart command with a symbol."
          hint='Example: type "AAPL GP" in the command bar.'
        />
      </ModuleFrame>
    );
  }

  const toggle = (k: keyof Options) => setOpts((o) => ({ ...o, [k]: !o[k] }));
  const inCompareMode = compareSyms.length > 0;

  const addCompare = () => {
    const s = addValue.trim().toUpperCase();
    setAddValue('');
    if (!SYMBOL_RE.test(s) || s === symbol || compareSyms.includes(s) || compareSyms.length >= 4) {
      return;
    }
    setCompareSyms((prev) => [...prev, s]);
  };

  return (
    <ModuleFrame
      tab={tab}
      toolbar={
        <>
          {state.status === 'ready' && <DataBadge env={state.env} />}
          <span className="chart-ranges">
            {RANGES.map((r) => (
              <button
                type="button"
                key={r}
                className={`range-btn${r === range ? ' range-btn-active' : ''}`}
                onClick={() => setRange(r)}
              >
                {r}
              </button>
            ))}
          </span>
          <span className="chart-toggles">
            <button
              type="button"
              className={`range-btn${opts.sma50 ? ' range-btn-active' : ''}`}
              disabled={inCompareMode}
              title="50-period simple moving average"
              onClick={() => toggle('sma50')}
            >
              SMA50
            </button>
            <button
              type="button"
              className={`range-btn${opts.sma200 ? ' range-btn-active' : ''}`}
              disabled={inCompareMode}
              title="200-period simple moving average"
              onClick={() => toggle('sma200')}
            >
              SMA200
            </button>
            <button
              type="button"
              className={`range-btn${opts.volume ? ' range-btn-active' : ''}`}
              disabled={inCompareMode}
              title="Volume subpanel"
              onClick={() => toggle('volume')}
            >
              VOL
            </button>
            <button
              type="button"
              className={`range-btn${opts.pct || inCompareMode ? ' range-btn-active' : ''}`}
              disabled={inCompareMode}
              title="Show percent change instead of price"
              onClick={() => toggle('pct')}
            >
              %
            </button>
          </span>
          <button type="button" className="btn" onClick={refresh}>
            REFRESH
          </button>
        </>
      }
    >
      <form
        className="inline-form chart-compare-form"
        onSubmit={(e) => {
          e.preventDefault();
          addCompare();
        }}
      >
        <input
          className="text-input text-input-narrow"
          placeholder="+ compare symbol"
          value={addValue}
          maxLength={15}
          aria-label="Add comparison symbol"
          onChange={(e) => setAddValue(e.target.value)}
        />
        <button type="submit" className="btn" disabled={compareSyms.length >= 4}>
          COMPARE
        </button>
        <span className="dim small">
          Overlay up to 4 symbols as normalized % lines. Hover the chart for a readout.
        </span>
      </form>

      {state.status === 'loading' && (
        <StateView kind="loading" title={`Loading ${symbol} ${range} series…`} />
      )}
      {state.status === 'error' && (
        <StateView
          kind="error"
          title={`Series unavailable for ${symbol}`}
          detail={state.message}
          hint="Verify the symbol, or force the demo provider in SET."
        />
      )}
      {state.status === 'ready' && state.env.data.candles.length > 0 && (
        <ChartCanvas
          primary={{ symbol: state.env.data.symbol, candles: state.env.data.candles }}
          compares={compares}
          range={range}
          options={opts}
          onRemoveCompare={(s) => setCompareSyms((prev) => prev.filter((x) => x !== s))}
        />
      )}
    </ModuleFrame>
  );
}

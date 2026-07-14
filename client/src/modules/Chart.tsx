import { useLayoutEffect, useRef, useState } from 'react';
import type { Range, Series } from '../../../shared/types';
import { RANGES } from '../../../shared/types';
import { useEnvelope } from '../api/useData';
import { DataBadge } from '../components/DataBadge';
import { ModuleFrame, StateView } from '../components/ModuleFrame';
import { fmtPct, fmtPrice, signClass } from '../lib/format';
import type { Tab } from '../state/workspace';

const H = 320;
const PAD = { top: 12, right: 64, bottom: 22, left: 8 };

function LineChart({ series }: { series: Series }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);

  useLayoutEffect(() => {
    const measure = () => {
      if (wrapRef.current) setWidth(Math.max(320, wrapRef.current.clientWidth));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const closes = series.candles.map((c) => c.c);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const span = max - min || max * 0.01 || 1;
  const x = (i: number) =>
    PAD.left + (i / Math.max(1, closes.length - 1)) * (width - PAD.left - PAD.right);
  const y = (v: number) => PAD.top + (1 - (v - min) / span) * (H - PAD.top - PAD.bottom);

  const path = closes
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`)
    .join(' ');
  const first = closes[0];
  const last = closes[closes.length - 1];
  const up = last >= first;
  const gridLevels = [0, 0.25, 0.5, 0.75, 1].map((f) => min + f * span);
  const firstDate = new Date(series.candles[0].t);
  const lastDate = new Date(series.candles[series.candles.length - 1].t);
  const dateLabel = (d: Date) =>
    series.range === '1D' || series.range === '5D'
      ? d.toLocaleString([], {
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      : d.toLocaleDateString([], { year: 'numeric', month: 'short', day: '2-digit' });

  return (
    <div ref={wrapRef} className="chart-wrap">
      <svg width={width} height={H} role="img" aria-label={`${series.symbol} price chart`}>
        {gridLevels.map((v) => (
          <g key={v}>
            <line x1={PAD.left} x2={width - PAD.right} y1={y(v)} y2={y(v)} className="chart-grid" />
            <text x={width - PAD.right + 6} y={y(v) + 3.5} className="chart-label">
              {fmtPrice(v)}
            </text>
          </g>
        ))}
        <path d={path} className={`chart-line ${up ? 'chart-up' : 'chart-down'}`} />
        <circle
          cx={x(closes.length - 1)}
          cy={y(last)}
          r={2.5}
          className={up ? 'chart-up' : 'chart-down'}
        />
        <text x={PAD.left} y={H - 6} className="chart-label">
          {dateLabel(firstDate)}
        </text>
        <text x={width - PAD.right} y={H - 6} className="chart-label" textAnchor="end">
          {dateLabel(lastDate)}
        </text>
      </svg>
      <div className="chart-caption">
        <span className="accent">{series.symbol}</span>
        <span>
          last <span className="num">{fmtPrice(last)}</span>
        </span>
        <span className={signClass(last - first)}>
          {fmtPct(((last - first) / first) * 100)} over {series.range}
        </span>
        <span className="dim">
          {series.candles.length} bars · {series.interval}
          {series.currency ? ` · ${series.currency}` : ''}
        </span>
      </div>
    </div>
  );
}

export function Chart({ tab }: { tab: Tab }) {
  const symbol = tab.symbol ?? null;
  const [range, setRange] = useState<Range>('6M');
  const { state, refresh } = useEnvelope<Series>(
    symbol ? `/api/series?symbol=${encodeURIComponent(symbol)}&range=${range}` : null,
  );

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
          <button type="button" className="btn" onClick={refresh}>
            REFRESH
          </button>
        </>
      }
    >
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
        <LineChart series={state.env.data} />
      )}
    </ModuleFrame>
  );
}

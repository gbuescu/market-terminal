import type { EcoEvent } from '../../../shared/types';
import { useEnvelope } from '../api/useData';
import { DataBadge } from '../components/DataBadge';
import { ModuleFrame, StateView } from '../components/ModuleFrame';
import type { Tab } from '../state/workspace';

function dayKey(iso: string): string {
  return new Date(iso).toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: '2-digit',
  });
}

function impDots(importance: 1 | 2 | 3): string {
  return '●'.repeat(importance).padEnd(3, '○');
}

export function Calendar({ tab }: { tab: Tab }) {
  const { state, refresh } = useEnvelope<EcoEvent[]>('/api/calendar', 3_600_000);

  return (
    <ModuleFrame
      tab={tab}
      toolbar={
        <>
          {state.status === 'ready' && <DataBadge env={state.env} />}
          <button type="button" className="btn" onClick={refresh}>
            REFRESH
          </button>
        </>
      }
    >
      {state.status === 'loading' && <StateView kind="loading" title="Loading calendar…" />}
      {state.status === 'error' && (
        <StateView kind="error" title="Calendar unavailable" detail={state.message} />
      )}
      {state.status === 'ready' && (
        <table className="grid-table eco-table">
          <thead>
            <tr>
              <th>Day</th>
              <th>Time</th>
              <th>Region</th>
              <th>Event</th>
              <th>Imp</th>
              <th>Forecast</th>
              <th>Previous</th>
            </tr>
          </thead>
          <tbody>
            {state.env.data.map((e, i, arr) => {
              const day = dayKey(e.time);
              const firstOfDay = i === 0 || dayKey(arr[i - 1].time) !== day;
              return (
                <tr key={e.id}>
                  <td className={firstOfDay ? 'accent' : 'dim'}>{firstOfDay ? day : ''}</td>
                  <td className="num">
                    {new Date(e.time).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    })}
                  </td>
                  <td>{e.region}</td>
                  <td>{e.event}</td>
                  <td
                    className={e.importance === 3 ? 'neg' : e.importance === 2 ? 'accent' : 'dim'}
                  >
                    {impDots(e.importance)}
                  </td>
                  <td className="num">{e.forecast ?? '—'}</td>
                  <td className="num dim">{e.previous ?? '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </ModuleFrame>
  );
}

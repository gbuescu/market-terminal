import { ModuleFrame, StateView, useSimulatedLoad } from '../components/ModuleFrame';
import type { Tab } from '../state/workspace';

const REGIONS = ['AMERICAS', 'EUROPE', 'ASIA-PACIFIC', 'FX', 'RATES', 'COMMODITIES'];

export function Monitor({ tab }: { tab: Tab }) {
  const loading = useSimulatedLoad();
  return (
    <ModuleFrame tab={tab}>
      {loading ? (
        <StateView kind="loading" title="Querying providers…" />
      ) : (
        <div className="monitor-grid">
          {REGIONS.map((region) => (
            <div key={region} className="panel monitor-panel">
              <div className="panel-title">{region}</div>
              <StateView
                kind="empty"
                title="No data provider configured"
                detail="Live indices, futures and rates land here in Phase 2."
                hint="Open SET to configure providers."
              />
            </div>
          ))}
        </div>
      )}
    </ModuleFrame>
  );
}

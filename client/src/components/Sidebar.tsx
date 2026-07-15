import { parse } from '../commands/parser';
import { type CommandDef, MODULE_COMMAND } from '../commands/registry';
import { useWorkspace } from '../state/workspace';

const SECTIONS: { label: string; items: CommandDef[] }[] = [
  {
    label: 'MARKETS',
    items: [
      MODULE_COMMAND.monitor,
      MODULE_COMMAND.fx,
      MODULE_COMMAND.rates,
      MODULE_COMMAND.commodities,
      MODULE_COMMAND.news,
      MODULE_COMMAND.calendar,
    ],
  },
  {
    label: 'SECURITIES',
    items: [
      MODULE_COMMAND.quote,
      MODULE_COMMAND.chart,
      MODULE_COMMAND.fundamentals,
      MODULE_COMMAND.statements,
    ],
  },
  {
    label: 'ANALYTICS',
    items: [MODULE_COMMAND.screener, MODULE_COMMAND.peers],
  },
  {
    label: 'WORKSPACE',
    items: [MODULE_COMMAND.watchlist, MODULE_COMMAND.alerts, MODULE_COMMAND.notes],
  },
  {
    label: 'SYSTEM',
    items: [MODULE_COMMAND.settings, MODULE_COMMAND.help],
  },
];

export function Sidebar() {
  const ws = useWorkspace();
  const activeModule = ws.activeTab?.moduleId;

  return (
    <nav className="sidebar" aria-label="Modules">
      {SECTIONS.map((section) => (
        <div key={section.label} className="side-section">
          <div className="side-label">{section.label}</div>
          {section.items.map((def) => (
            <button
              type="button"
              key={def.mnemonic}
              className={`side-item${activeModule === def.moduleId ? ' side-item-active' : ''}`}
              title={def.description}
              onClick={() => {
                const inv = parse(def.mnemonic);
                if (inv) ws.execute(inv);
              }}
            >
              <span className="side-mnemonic">{def.mnemonic}</span>
              <span className="side-name">{def.name}</span>
            </button>
          ))}
        </div>
      ))}
    </nav>
  );
}

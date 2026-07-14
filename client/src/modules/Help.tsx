import { COMMANDS } from '../commands/registry';
import { ModuleFrame } from '../components/ModuleFrame';
import type { Tab } from '../state/workspace';

const SHORTCUTS: [string, string][] = [
  ['/ or Ctrl+K', 'Focus the command bar (or just start typing)'],
  ['Enter', 'Run the selected command'],
  ['Tab', 'Complete the highlighted suggestion'],
  ['↑ / ↓', 'Move through suggestions'],
  ['Esc', 'Close suggestions / leave the command bar'],
  ['Alt+1 … Alt+9', 'Jump to open tab 1–9'],
  ['Alt+PageDown / Alt+PageUp', 'Next / previous tab'],
  ['Alt+W', 'Close the active tab'],
];

export function Help({ tab }: { tab: Tab }) {
  return (
    <ModuleFrame tab={tab}>
      <div className="help-grid">
        <div className="panel">
          <div className="panel-title">COMMANDS</div>
          <table className="grid-table">
            <thead>
              <tr>
                <th>Mnemonic</th>
                <th>Aliases</th>
                <th>Function</th>
                <th>Example</th>
              </tr>
            </thead>
            <tbody>
              {COMMANDS.map((c) => (
                <tr key={c.mnemonic}>
                  <td className="accent">{c.mnemonic}</td>
                  <td className="dim">{c.aliases.join(' ')}</td>
                  <td>
                    {c.name}
                    <span className="dim"> — {c.description}</span>
                  </td>
                  <td className="accent">{c.examples[0]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="dim small">
            Commands read Bloomberg-style: <span className="accent">SYMBOL FUNCTION</span> (e.g.{' '}
            <span className="accent">AAPL GP</span>). Plain English works too — typing{' '}
            <span className="accent">economic calendar</span> finds ECO.
          </p>
        </div>

        <div className="panel">
          <div className="panel-title">KEYBOARD</div>
          <table className="grid-table">
            <tbody>
              {SHORTCUTS.map(([keys, what]) => (
                <tr key={keys}>
                  <td className="accent">{keys}</td>
                  <td>{what}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="dim small">
            This terminal is read-only by design: research, monitoring, alerts and learning. It
            never places, routes or simulates orders.
          </p>
        </div>
      </div>
    </ModuleFrame>
  );
}

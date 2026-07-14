import type { ReactNode } from 'react';
import { MODULE_COMMAND } from '../commands/registry';
import type { Tab } from '../state/workspace';

/** Standard chrome around every module: title row + body. */
export function ModuleFrame({
  tab,
  toolbar,
  children,
}: {
  tab: Tab;
  toolbar?: ReactNode;
  children: ReactNode;
}) {
  const def = MODULE_COMMAND[tab.moduleId];
  return (
    <section className="module">
      <header className="module-head">
        <span className="module-mnemonic">{def.mnemonic}</span>
        <span className="module-name">{def.name}</span>
        {tab.symbol && <span className="module-symbol">{tab.symbol}</span>}
        <span className="spacer" />
        {toolbar}
      </header>
      <div className="module-body">{children}</div>
    </section>
  );
}

export type StateKind = 'loading' | 'empty' | 'error' | 'info';

/** Shared empty/loading/error/info presentation used by every module. */
export function StateView({
  kind,
  title,
  detail,
  hint,
  action,
}: {
  kind: StateKind;
  title: string;
  detail?: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className={`state state-${kind}`}>
      {kind === 'loading' && <div className="state-spinner" aria-hidden="true" />}
      <div className="state-title">{title}</div>
      {detail && <div className="state-detail">{detail}</div>}
      {hint && <div className="state-hint">{hint}</div>}
      {action}
    </div>
  );
}

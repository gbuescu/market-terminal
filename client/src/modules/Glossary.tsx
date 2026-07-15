import { useMemo, useState } from 'react';
import { parse } from '../commands/parser';
import { ModuleFrame, StateView } from '../components/ModuleFrame';
import { GLOSSARY, GLOSSARY_CATEGORIES } from '../config/glossary';
import { type Tab, useWorkspace } from '../state/workspace';

export function Glossary({ tab }: { tab: Tab }) {
  const ws = useWorkspace();
  // "BETA GLOS" opens the glossary pre-filtered to that word.
  const [query, setQuery] = useState(tab.symbol ?? '');
  const [category, setCategory] = useState<string | null>(null);

  const terms = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GLOSSARY.filter((t) => {
      if (category && t.category !== category) return false;
      if (!q) return true;
      return (
        t.term.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    });
  }, [query, category]);

  const tryIt = (command: string) => {
    const inv = parse(command);
    if (inv) ws.execute(inv);
  };

  return (
    <ModuleFrame
      tab={tab}
      toolbar={
        <span className="dim small">
          {terms.length}/{GLOSSARY.length} terms
        </span>
      }
    >
      <div className="inline-form">
        <input
          className="text-input text-input-full"
          placeholder="search terms and definitions…"
          value={query}
          aria-label="Search glossary"
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="glos-cats">
        <button
          type="button"
          className={`range-btn${category === null ? ' range-btn-active' : ''}`}
          onClick={() => setCategory(null)}
        >
          ALL
        </button>
        {GLOSSARY_CATEGORIES.map((c) => (
          <button
            type="button"
            key={c}
            className={`range-btn${category === c ? ' range-btn-active' : ''}`}
            onClick={() => setCategory(category === c ? null : c)}
          >
            {c}
          </button>
        ))}
      </div>

      {terms.length === 0 ? (
        <StateView
          kind="empty"
          title="No matching terms"
          detail="Try a shorter query or clear the category filter."
        />
      ) : (
        <dl className="glos-list">
          {terms.map((t) => (
            <div key={t.term} className="glos-item">
              <dt>
                <span className="accent">{t.term}</span>
                <span className="glos-cat dim">{t.category}</span>
              </dt>
              <dd>
                {t.definition}
                {t.seeInApp && (
                  <>
                    {' '}
                    <button
                      type="button"
                      className="link-btn glos-see"
                      title={`Run ${t.seeInApp}`}
                      onClick={() => tryIt(t.seeInApp as string)}
                    >
                      see it: {t.seeInApp} →
                    </button>
                  </>
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </ModuleFrame>
  );
}

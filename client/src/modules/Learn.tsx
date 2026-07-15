import { useMemo, useState } from 'react';
import { type Invocation, parse } from '../commands/parser';
import { ModuleFrame } from '../components/ModuleFrame';
import { useStudent } from '../state/student';
import { type Tab, useWorkspace } from '../state/workspace';

interface TourStep {
  title: string;
  body: string;
  /** command to execute for "TRY IT" */
  tryCommand?: string;
}

const TOUR: TourStep[] = [
  {
    title: 'The command bar drives everything',
    body: 'Press / (or just start typing anywhere) to focus the command bar. Run a function by typing its mnemonic and hitting Enter.',
    tryCommand: 'MON',
  },
  {
    title: 'SYMBOL then FUNCTION',
    body: 'Bloomberg-style: type a symbol, then what you want to see. "AAPL Q" = Apple quote. "TSLA GP" = Tesla chart.',
    tryCommand: 'AAPL Q',
  },
  {
    title: 'Charts with ranges',
    body: 'GP opens a price chart. Use the range buttons (1D … MAX) to zoom the history.',
    tryCommand: 'AAPL GP',
  },
  {
    title: 'Plain English works too',
    body: 'No need to memorize everything: typing "economic calendar" or "news" finds the right function; typing "apple" finds the AAPL symbol.',
    tryCommand: 'ECO',
  },
  {
    title: 'Tabs and shortcuts',
    body: 'Every function opens as a tab. Alt+1…9 jumps to a tab, Alt+PageUp/Down cycles, Alt+W closes. Re-running a command re-activates its tab.',
  },
  {
    title: 'Watchlists and alerts',
    body: 'W manages symbol lists with live quotes. ALRT sets price alerts — they notify only; this terminal never places orders.',
    tryCommand: 'W',
  },
  {
    title: 'Dig into a company',
    body: 'FA shows fundamentals (valuation, margins, leverage), FS the financial statements, RV compares peers side-by-side, SCR screens the large-cap universe.',
    tryCommand: 'AAPL FA',
  },
  {
    title: 'Trust, but verify the data',
    body: 'Every data panel shows its source and freshness badges: DEMO (synthetic), DELAYED, CACHED, STALE. SET controls providers and API keys.',
    tryCommand: 'SET',
  },
  {
    title: 'Learn the language',
    body: 'GLOS is a finance glossary with cross-links into the terminal. Turn on student mode below to get an explainer strip on every page.',
    tryCommand: 'GLOS',
  },
];

/** Trainer question bank: task prompt + acceptance check via the parser. */
interface Question {
  prompt: string;
  accept: (inv: Invocation) => boolean;
  answer: string;
}

const QUOTE_SYMBOLS = ['AAPL', 'MSFT', 'TSLA', 'NVDA', 'AMZN'];

function buildQuestions(): Question[] {
  const sym = () => QUOTE_SYMBOLS[Math.floor(Math.random() * QUOTE_SYMBOLS.length)];
  const s1 = sym();
  const s2 = sym();
  const s3 = sym();
  const s4 = sym();
  return [
    {
      prompt: `Pull up a quote for ${s1}`,
      accept: (inv) => inv.def.moduleId === 'quote' && inv.symbol === s1,
      answer: `${s1} Q`,
    },
    {
      prompt: `Open a price chart for ${s2}`,
      accept: (inv) => inv.def.moduleId === 'chart' && inv.symbol === s2,
      answer: `${s2} GP`,
    },
    {
      prompt: 'Open the global markets monitor',
      accept: (inv) => inv.def.moduleId === 'monitor',
      answer: 'MON',
    },
    {
      prompt: `Show news for ${s3}`,
      accept: (inv) => inv.def.moduleId === 'news' && inv.symbol === s3,
      answer: `${s3} N`,
    },
    {
      prompt: 'Open the economic calendar',
      accept: (inv) => inv.def.moduleId === 'calendar',
      answer: 'ECO',
    },
    {
      prompt: 'Open your watchlists',
      accept: (inv) => inv.def.moduleId === 'watchlist',
      answer: 'W',
    },
    {
      prompt: `Open fundamentals for ${s4}`,
      accept: (inv) => inv.def.moduleId === 'fundamentals' && inv.symbol === s4,
      answer: `${s4} FA`,
    },
    {
      prompt: 'Open the equity screener',
      accept: (inv) => inv.def.moduleId === 'screener',
      answer: 'SCR',
    },
    {
      prompt: 'Open the FX dashboard',
      accept: (inv) => inv.def.moduleId === 'fx',
      answer: 'FX',
    },
    {
      prompt: 'Open the rates (treasury yields) dashboard',
      accept: (inv) => inv.def.moduleId === 'rates',
      answer: 'RATES',
    },
  ];
}

function Trainer() {
  const { bestStreak, saveBestStreak } = useStudent();
  const [questions, setQuestions] = useState(buildQuestions);
  const [qIndex, setQIndex] = useState(() => Math.floor(Math.random() * 10));
  const [answer, setAnswer] = useState('');
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const question = questions[qIndex % questions.length];

  const next = () => {
    setQuestions(buildQuestions());
    setQIndex((i) => (i + 1 + Math.floor(Math.random() * 3)) % questions.length);
    setAnswer('');
  };

  const check = (e: React.FormEvent) => {
    e.preventDefault();
    const inv = parse(answer);
    if (inv && question.accept(inv)) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      saveBestStreak(newStreak);
      setFeedback({ ok: true, text: `correct — ${inv.canonical}` });
    } else {
      setStreak(0);
      setFeedback({ ok: false, text: `expected: ${question.answer}` });
    }
    next();
  };

  return (
    <div className="panel">
      <div className="panel-title">MNEMONIC TRAINER</div>
      <p className="dim small">
        Type the command that performs the task (aliases count — the real parser grades you).
        Nothing is executed.
      </p>
      <div className="trainer-task">{question.prompt}</div>
      <form className="inline-form" onSubmit={check}>
        <input
          className="text-input cmd-input trainer-input"
          value={answer}
          placeholder="type the command…"
          spellCheck={false}
          autoComplete="off"
          aria-label="Trainer answer"
          onChange={(e) => setAnswer(e.target.value)}
        />
        <button type="submit" className="btn">
          CHECK
        </button>
      </form>
      {feedback && (
        <p className={`small ${feedback.ok ? 'pos' : 'neg'}`}>
          {feedback.ok ? '✓ ' : '✗ '}
          {feedback.text}
        </p>
      )}
      <p className="dim small">
        streak <span className="accent">{streak}</span> · best{' '}
        <span className="accent">{Math.max(bestStreak, streak)}</span>
      </p>
    </div>
  );
}

export function Learn({ tab }: { tab: Tab }) {
  const ws = useWorkspace();
  const { studentMode, toggleStudentMode, tourProgress, setTourProgress, dismissOnboarding } =
    useStudent();
  const [openStep, setOpenStep] = useState(() => Math.min(tourProgress, TOUR.length - 1));

  const done = useMemo(() => tourProgress >= TOUR.length, [tourProgress]);

  const tryIt = (command: string) => {
    const inv = parse(command);
    if (inv) ws.execute(inv);
  };

  const completeStep = (index: number) => {
    setTourProgress(index + 1);
    if (index + 1 >= TOUR.length) dismissOnboarding();
    else setOpenStep(index + 1);
  };

  return (
    <ModuleFrame
      tab={tab}
      toolbar={
        <button type="button" className="btn" onClick={toggleStudentMode}>
          STUDENT MODE: {studentMode ? 'ON' : 'OFF'}
        </button>
      }
    >
      <div className="learn-grid">
        <div className="panel">
          <div className="panel-title">
            GETTING STARTED {done ? '· COMPLETE ✓' : `· ${tourProgress}/${TOUR.length}`}
          </div>
          <ol className="tour-list">
            {TOUR.map((step, i) => {
              const isDone = i < tourProgress;
              const isOpen = i === openStep;
              return (
                <li key={step.title} className={`tour-step${isDone ? ' tour-done' : ''}`}>
                  <button
                    type="button"
                    className="tour-head"
                    onClick={() => setOpenStep(isOpen ? -1 : i)}
                  >
                    <span className={isDone ? 'pos' : 'dim'}>{isDone ? '✓' : `${i + 1}.`}</span>{' '}
                    {step.title}
                  </button>
                  {isOpen && (
                    <div className="tour-body">
                      <p>{step.body}</p>
                      <div className="inline-form">
                        {step.tryCommand && (
                          <button
                            type="button"
                            className="btn"
                            onClick={() => tryIt(step.tryCommand as string)}
                          >
                            TRY IT: {step.tryCommand}
                          </button>
                        )}
                        {!isDone && (
                          <button type="button" className="btn" onClick={() => completeStep(i)}>
                            MARK DONE
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
          <p className="dim small">
            Student mode adds a plain-English explainer to every page — recommended while learning.
            Progress is saved locally.
          </p>
        </div>
        <Trainer />
      </div>
    </ModuleFrame>
  );
}

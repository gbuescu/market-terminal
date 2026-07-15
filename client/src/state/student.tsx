/**
 * Learning state shared across the app: student mode (explainer strips),
 * onboarding flag, tour progress and trainer best-streak. Persisted in the
 * server settings table (learn.* keys) so it survives restarts.
 */
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { SettingsPayload } from '../../../shared/types';
import { getJson, putJson } from '../api/client';

interface StudentApi {
  studentMode: boolean;
  toggleStudentMode: () => void;
  onboarded: boolean;
  dismissOnboarding: () => void;
  tourProgress: number;
  setTourProgress: (step: number) => void;
  bestStreak: number;
  saveBestStreak: (streak: number) => void;
}

const StudentContext = createContext<StudentApi | null>(null);

function save(key: string, value: string): void {
  putJson('/api/settings', { [key]: value }).catch(() => {
    /* best-effort; UI state already updated */
  });
}

export function StudentProvider({ children }: { children: ReactNode }) {
  const [studentMode, setStudentMode] = useState(false);
  const [onboarded, setOnboarded] = useState(true); // assume yes until loaded
  const [tourProgress, setTourProgressState] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  useEffect(() => {
    getJson<SettingsPayload>('/api/settings')
      .then(({ settings }) => {
        setStudentMode(settings['learn.studentmode'] === '1');
        setOnboarded(settings['learn.onboarded'] === '1');
        setTourProgressState(Number(settings['learn.progress'] ?? 0) || 0);
        setBestStreak(Number(settings['learn.streak'] ?? 0) || 0);
      })
      .catch(() => {
        /* API down: defaults stand; banner stays hidden */
      });
  }, []);

  const toggleStudentMode = useCallback(() => {
    setStudentMode((cur) => {
      save('learn.studentmode', cur ? '' : '1');
      return !cur;
    });
  }, []);

  const dismissOnboarding = useCallback(() => {
    setOnboarded(true);
    save('learn.onboarded', '1');
  }, []);

  const setTourProgress = useCallback((step: number) => {
    setTourProgressState((cur) => {
      const next = Math.max(cur, step);
      if (next !== cur) save('learn.progress', String(next));
      return next;
    });
  }, []);

  const saveBestStreak = useCallback((streak: number) => {
    setBestStreak((cur) => {
      if (streak > cur) {
        save('learn.streak', String(streak));
        return streak;
      }
      return cur;
    });
  }, []);

  const api = useMemo<StudentApi>(
    () => ({
      studentMode,
      toggleStudentMode,
      onboarded,
      dismissOnboarding,
      tourProgress,
      setTourProgress,
      bestStreak,
      saveBestStreak,
    }),
    [
      studentMode,
      toggleStudentMode,
      onboarded,
      dismissOnboarding,
      tourProgress,
      setTourProgress,
      bestStreak,
      saveBestStreak,
    ],
  );

  return <StudentContext.Provider value={api}>{children}</StudentContext.Provider>;
}

export function useStudent(): StudentApi {
  const ctx = useContext(StudentContext);
  if (!ctx) throw new Error('useStudent must be used inside StudentProvider');
  return ctx;
}

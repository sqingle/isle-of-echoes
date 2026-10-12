"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { RapidId, RapidResult, SubtestId, SubtestResult, Tier } from "@/lib/game";

export interface Settings {
  tier: Tier;
  itemsPerRealm: number;
  showKey: boolean;
  voice: boolean;
  traveler: string;
}

interface Session {
  settings: Settings;
  configured: boolean;
  subtests: Partial<Record<SubtestId, SubtestResult>>;
  rapid: Partial<Record<RapidId, RapidResult>>;
  configure: (s: Settings) => void;
  patchSettings: (s: Partial<Settings>) => void;
  saveSubtest: (r: SubtestResult) => void;
  saveRapid: (r: RapidResult) => void;
  reset: () => void;
}

const DEFAULTS: Settings = { tier: 2, itemsPerRealm: 6, showKey: true, voice: true, traveler: "" };

const Ctx = createContext<Session | null>(null);

/**
 * Everything lives in memory only: no storage, no network. Closing the tab ends the journey,
 * which keeps a child’s responses off the device.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [configured, setConfigured] = useState(false);
  const [subtests, setSubtests] = useState<Session["subtests"]>({});
  const [rapid, setRapid] = useState<Session["rapid"]>({});

  const configure = useCallback((s: Settings) => {
    setSettings(s);
    setConfigured(true);
  }, []);
  const patchSettings = useCallback((s: Partial<Settings>) => setSettings((p) => ({ ...p, ...s })), []);
  const saveSubtest = useCallback((r: SubtestResult) => setSubtests((p) => ({ ...p, [r.id]: r })), []);
  const saveRapid = useCallback((r: RapidResult) => setRapid((p) => ({ ...p, [r.id]: r })), []);
  const reset = useCallback(() => {
    setSubtests({});
    setRapid({});
    setConfigured(false);
    setSettings(DEFAULTS);
  }, []);

  const value = useMemo(
    () => ({ settings, configured, subtests, rapid, configure, patchSettings, saveSubtest, saveRapid, reset }),
    [settings, configured, subtests, rapid, configure, patchSettings, saveSubtest, saveRapid, reset],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession(): Session {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSession must be used inside SessionProvider");
  return v;
}

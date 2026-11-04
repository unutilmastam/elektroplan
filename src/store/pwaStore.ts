import { create } from 'zustand';
import { detectPlatform, type InstallPlatform } from '@/domain/platform';
import { getMeta, outboxCounts, setMeta } from '@/infra/idb/projectRepo';

/** Chrome/Edge install prompt (not in lib.dom yet). */
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const META_IOS_HINT = 'iosInstallHintShown';
/** mirror of the meta flag (also lets e2e tests start with the hint already seen) */
export const LS_IOS_HINT = 'elektroplan:iosInstallHintShown';
const lsHint = () => {
  try {
    return localStorage.getItem(LS_IOS_HINT) === '1';
  } catch {
    return false;
  }
};

interface PwaState {
  online: boolean;
  platform: InstallPlatform;
  /** opened from the Home Screen / as an installed app */
  standalone: boolean;
  /** a new app version is downloaded and waits for "Yangilash" */
  waiting: ServiceWorker | null;
  installEvent: BeforeInstallPromptEvent | null;
  /** null until read from IndexedDB */
  iosHintDismissed: boolean | null;
  /** outbox rows per project = changes not on the server yet */
  unsent: Record<string, number>;
  init: () => void;
  setOnline: (v: boolean) => void;
  setWaiting: (w: ServiceWorker | null) => void;
  setInstallEvent: (e: BeforeInstallPromptEvent | null) => void;
  setStandalone: (v: boolean) => void;
  install: () => Promise<boolean>;
  dismissIosHint: () => Promise<void>;
  refreshUnsent: () => Promise<void>;
}

export const usePwaStore = create<PwaState>()((set, get) => ({
  online: true,
  platform: 'desktop',
  standalone: false,
  waiting: null,
  installEvent: null,
  iosHintDismissed: null,
  unsent: {},
  init: () => {
    const nav = navigator as Navigator & { standalone?: boolean };
    set({
      online: nav.onLine,
      platform: detectPlatform(nav.userAgent, nav.maxTouchPoints ?? 0),
      standalone: nav.standalone === true || matchMedia('(display-mode: standalone)').matches,
    });
    if (lsHint()) set({ iosHintDismissed: true });
    else
      void getMeta(META_IOS_HINT, (v) => (v === true ? true : null))
        .then((v) => set({ iosHintDismissed: v === true }))
        .catch(() => set({ iosHintDismissed: false }));
    void get().refreshUnsent();
  },
  setOnline: (online) => set({ online }),
  setWaiting: (waiting) => set({ waiting }),
  setInstallEvent: (installEvent) => set({ installEvent }),
  setStandalone: (standalone) => set({ standalone }),
  install: async () => {
    const e = get().installEvent;
    if (!e) return false;
    await e.prompt();
    const { outcome } = await e.userChoice;
    set({ installEvent: null });
    return outcome === 'accepted';
  },
  dismissIosHint: async () => {
    set({ iosHintDismissed: true });
    try {
      localStorage.setItem(LS_IOS_HINT, '1');
    } catch {
      // IndexedDB copy below
    }
    try {
      await setMeta(META_IOS_HINT, true);
    } catch {
      // hidden for this session at least
    }
  },
  refreshUnsent: async () => {
    try {
      set({ unsent: await outboxCounts() });
    } catch {
      // keep the last known counts
    }
  },
}));

import { create } from 'zustand';
import { DEFAULT_DEVICE_SETTINGS, DeviceSettingsSchema, type DeviceSettings } from '@/domain/schemas';
import { getMeta, setMeta } from '@/infra/idb/projectRepo';

const KEY = 'deviceSettings';

interface SettingsState extends DeviceSettings {
  loaded: boolean;
  load: () => Promise<void>;
  setPenOnly: (v: boolean) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  ...DEFAULT_DEVICE_SETTINGS,
  loaded: false,
  load: async () => {
    try {
      const s = await getMeta(KEY, (v) => {
        const r = DeviceSettingsSchema.safeParse(v);
        return r.success ? r.data : null;
      });
      set({ ...(s ?? DEFAULT_DEVICE_SETTINGS), loaded: true });
    } catch {
      set({ loaded: true });
    }
  },
  setPenOnly: async (penOnly) => {
    set({ penOnly });
    try {
      await setMeta(KEY, { penOnly: get().penOnly } satisfies DeviceSettings);
    } catch {
      // preference stays for this session
    }
  },
}));

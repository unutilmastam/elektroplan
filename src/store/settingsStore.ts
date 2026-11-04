import { create } from 'zustand';
import { DEFAULT_DEVICE_SETTINGS, DeviceSettingsSchema, type DeviceSettings } from '@/domain/schemas';
import { getMeta, setMeta } from '@/infra/idb/projectRepo';

const KEY = 'deviceSettings';

interface SettingsState extends DeviceSettings {
  loaded: boolean;
  load: () => Promise<void>;
  update: (patch: Partial<DeviceSettings>) => Promise<void>;
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
  update: async (patch) => {
    set(patch);
    const { penOnly, autoStraighten, showDimensions } = get();
    try {
      await setMeta(KEY, { penOnly, autoStraighten, showDimensions } satisfies DeviceSettings);
    } catch {
      // preference stays for this session
    }
  },
  setPenOnly: (penOnly) => get().update({ penOnly }),
}));

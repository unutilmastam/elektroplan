import { create } from 'zustand';
import { DEFAULT_DEVICE_SETTINGS, DeviceSettingsSchema, type DeviceSettings } from '@/domain/schemas';
import { getMeta, setMeta } from '@/infra/idb/projectRepo';

const KEY = 'deviceSettings';
/** settings changed in this session (they win over the saved copy if it loads late) */
const touched = new Set<keyof DeviceSettings>();

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
      // a switch flipped while the saved copy was still loading wins over the saved value
      const now = get();
      const kept = Object.fromEntries([...touched].map((k) => [k, now[k]]));
      set({ ...(s ?? DEFAULT_DEVICE_SETTINGS), ...kept, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },
  update: async (patch) => {
    for (const k of Object.keys(patch) as Array<keyof DeviceSettings>) touched.add(k);
    set(patch);
    // do not overwrite the other saved settings with defaults before they were read
    if (!get().loaded) await get().load();
    const { penOnly, autoStraighten, showDimensions } = get();
    try {
      await setMeta(KEY, { penOnly, autoStraighten, showDimensions } satisfies DeviceSettings);
    } catch {
      // preference stays for this session
    }
  },
  setPenOnly: (penOnly) => get().update({ penOnly }),
}));

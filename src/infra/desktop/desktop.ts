/**
 * PHASE 17 — the Windows app (Tauri). The same static export, built with NEXT_PUBLIC_DESKTOP=1:
 * files come from the installed app (offline by nature, no service worker) and the API is called
 * cross-origin at NEXT_PUBLIC_API_BASE with a session token instead of the httpOnly cookie.
 */
export const IS_DESKTOP = process.env.NEXT_PUBLIC_DESKTOP === '1';
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api';

const KEY = 'elektroplan:token';
const TOKEN = /^[a-f0-9]{64}$/;

export function desktopToken(): string | null {
  if (!IS_DESKTOP) return null;
  try {
    const t = localStorage.getItem(KEY);
    return t && TOKEN.test(t) ? t : null;
  } catch {
    return null;
  }
}

export function setDesktopToken(token: string | null | undefined): void {
  if (!IS_DESKTOP) return;
  try {
    if (token && TOKEN.test(token)) localStorage.setItem(KEY, token);
    else localStorage.removeItem(KEY);
  } catch {
    // storage blocked: the user simply signs in again next time
  }
}

/** Headers the desktop app adds to every API call (none on the web). */
export function desktopHeaders(): Record<string, string> {
  if (!IS_DESKTOP) return {};
  const t = desktopToken();
  return { 'X-Elektroplan-Client': 'desktop', ...(t ? { 'X-Elektroplan-Auth': t } : {}) };
}

/**
 * Windows app: a link that would open a new window (Telegram support…) navigates instead, so the
 * native side (src-tauri/src/main.rs, on_navigation) hands it to the user's browser. Returns cleanup.
 */
export function routeExternalLinks(doc: Document = document): () => void {
  if (!IS_DESKTOP) return () => undefined;
  const onClick = (e: MouseEvent) => {
    const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
    if (!a || a.target !== '_blank' || a.origin === doc.location.origin) return;
    e.preventDefault();
    doc.location.href = a.href;
  };
  doc.addEventListener('click', onClick);
  return () => doc.removeEventListener('click', onClick);
}

type TauriInternals = { invoke: (cmd: string, args?: Record<string, unknown>) => Promise<unknown> };

/** Calls a command of src-tauri/src/main.rs (null on the web or when it fails). */
async function invoke(cmd: string, args?: Record<string, unknown>): Promise<unknown> {
  if (!IS_DESKTOP) return null;
  const t = (window as unknown as { __TAURI_INTERNALS__?: TauriInternals }).__TAURI_INTERNALS__;
  if (!t) return null;
  try {
    return await t.invoke(cmd, args);
  } catch {
    return null;
  }
}

/** PHASE 19: interface size of the Windows app (WebView zoom), remembered by the app itself. */
export const UI_SCALES = [0.7, 0.8, 0.9, 1] as const;

export async function getUiScale(): Promise<number | null> {
  const v = await invoke('get_ui_scale');
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

export async function setUiScale(scale: number): Promise<number | null> {
  const v = await invoke('set_ui_scale', { scale });
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

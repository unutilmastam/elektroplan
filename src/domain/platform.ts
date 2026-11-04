/** Device family for install instructions (DEVICES.md §1). Pure: takes UA + touch points. */
export type InstallPlatform = 'ios' | 'android' | 'desktop';

export function detectPlatform(userAgent: string, maxTouchPoints: number): InstallPlatform {
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'ios';
  // iPadOS Safari reports a Mac user agent; a touch screen gives it away
  if (/Macintosh/i.test(userAgent) && maxTouchPoints > 1) return 'ios';
  if (/Android/i.test(userAgent)) return 'android';
  return 'desktop';
}

/**
 * iOS one-time "Bosh ekranga qo‘shing" hint: only in the browser (not when already opened from the Home Screen)
 * and only until the user closes it once.
 */
export function shouldShowIosHint(
  platform: InstallPlatform,
  standalone: boolean,
  dismissed: boolean,
): boolean {
  return platform === 'ios' && !standalone && !dismissed;
}

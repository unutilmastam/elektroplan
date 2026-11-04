export type SaveFileResult = 'shared' | 'downloaded' | 'cancelled';

/**
 * Hands a file to the user: touch devices (iPhone/iPad/Android) get the share sheet (Fayllar, Telegram…),
 * otherwise a normal download. Works offline (the file is made on the device).
 */
export async function saveFile(blob: Blob, name: string, title: string): Promise<SaveFileResult> {
  const file = typeof File !== 'undefined' ? new File([blob], name, { type: blob.type }) : null;
  const touch = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
  if (touch && file && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return 'shared';
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled';
      // e.g. user activation expired while preparing — fall back to a download
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return 'downloaded';
}

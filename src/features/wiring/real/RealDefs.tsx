/**
 * PHASE 22 — shared SVG paint for the realistic wiring views: copper, plastic, glass, screws, glow.
 * Render once inside each <svg>; ids are prefixed `r-`.
 */
export function RealDefs() {
  return (
    <defs>
      {/* bare copper of a stripped conductor */}
      <linearGradient id="r-copper" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f7c08a" />
        <stop offset="0.45" stopColor="#d9823b" />
        <stop offset="1" stopColor="#8f4a17" />
      </linearGradient>
      {/* light grey ABS of a surface junction box */}
      <linearGradient id="r-box-wall" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#eef1f4" />
        <stop offset="1" stopColor="#b7bec8" />
      </linearGradient>
      <radialGradient id="r-box-floor" cx="0.5" cy="0.45" r="0.75">
        <stop offset="0" stopColor="#d9dde3" />
        <stop offset="1" stopColor="#aab2bd" />
      </radialGradient>
      {/* transparent polycarbonate of a lever clamp */}
      <linearGradient id="r-wago-body" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#dfe5ea" stopOpacity="0.92" />
        <stop offset="0.5" stopColor="#f6f8fa" stopOpacity="0.78" />
        <stop offset="1" stopColor="#c5ccd4" stopOpacity="0.92" />
      </linearGradient>
      <linearGradient id="r-wago-lever" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffad4d" />
        <stop offset="0.55" stopColor="#f07a12" />
        <stop offset="1" stopColor="#b35400" />
      </linearGradient>
      {/* white switch / device plastic */}
      <linearGradient id="r-white" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="1" stopColor="#dfe3e8" />
      </linearGradient>
      <linearGradient id="r-white-key" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fbfcfd" />
        <stop offset="1" stopColor="#e4e8ed" />
      </linearGradient>
      <linearGradient id="r-white-key-down" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#d8dde3" />
        <stop offset="1" stopColor="#ffffff" />
      </linearGradient>
      {/* screw heads */}
      <radialGradient id="r-screw" cx="0.35" cy="0.35" r="0.8">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="0.5" stopColor="#c3c9d1" />
        <stop offset="1" stopColor="#7d8794" />
      </radialGradient>
      {/* rubber grommet of a cable entry */}
      <radialGradient id="r-rubber" cx="0.5" cy="0.5" r="0.6">
        <stop offset="0" stopColor="#4b5563" />
        <stop offset="1" stopColor="#1f2937" />
      </radialGradient>
      {/* bulb glass: off / lit */}
      <radialGradient id="r-glass" cx="0.4" cy="0.35" r="0.75">
        <stop offset="0" stopColor="#f8fafc" stopOpacity="0.95" />
        <stop offset="1" stopColor="#9aa5b1" stopOpacity="0.9" />
      </radialGradient>
      <radialGradient id="r-glass-lit" cx="0.5" cy="0.45" r="0.7">
        <stop offset="0" stopColor="#fffbe6" />
        <stop offset="0.55" stopColor="#ffe27a" />
        <stop offset="1" stopColor="#ffb02e" />
      </radialGradient>
      <radialGradient id="r-light" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#ffe9a3" stopOpacity="0.85" />
        <stop offset="0.4" stopColor="#ffd25a" stopOpacity="0.35" />
        <stop offset="1" stopColor="#ffd25a" stopOpacity="0" />
      </radialGradient>
      <filter id="r-shadow" x="-20%" y="-20%" width="140%" height="150%">
        <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000" floodOpacity="0.45" />
      </filter>
      <filter id="r-soft" x="-10%" y="-10%" width="120%" height="130%">
        <feDropShadow dx="0" dy="1.5" stdDeviation="1.2" floodColor="#000" floodOpacity="0.4" />
      </filter>
      <filter id="r-spark" x="-200%" y="-200%" width="500%" height="500%">
        <feGaussianBlur stdDeviation="2.2" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}

/** Insulation colours as they look on real cable (slightly muted, with a highlight tone). */
export const INSULATION: Record<string, { base: string; dark: string; light: string }> = {
  L: { base: '#8a4b22', dark: '#4f2810', light: '#b97a4b' }, // brown
  N: { base: '#1f5fd1', dark: '#0f357d', light: '#5f93ec' }, // blue
  PE: { base: '#e5c21a', dark: '#8f7a06', light: '#f7e27a' }, // yellow (green stripes drawn on top)
  S1: { base: '#1d1f23', dark: '#000000', light: '#5b616b' }, // black
  S2: { base: '#8a9099', dark: '#4b5058', light: '#c3c8cf' }, // grey
  S3: { base: '#eceff2', dark: '#a3aab3', light: '#ffffff' }, // white
  L2: { base: '#1d1f23', dark: '#000000', light: '#5b616b' },
  L3: { base: '#8a9099', dark: '#4b5058', light: '#c3c8cf' },
};

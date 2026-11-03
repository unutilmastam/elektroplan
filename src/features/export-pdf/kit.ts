import { LineCapStyle, rgb, type PDFFont, type PDFPage, type RGB } from 'pdf-lib';

/** Shared drawing helpers. Everything is given in TOP-DOWN page coordinates (y grows down, like SVG). */

export const A4 = { w: 595.28, h: 841.89 };
export const A4L = { w: 841.89, h: 595.28 };
export const MARGIN = 36;

/** Light print palette (the app is dark; paper is white). */
export const INK = {
  text: hex('#111827'),
  muted: hex('#6b7280'),
  line: hex('#d1d5db'),
  wall: hex('#2b3240'),
  window: hex('#7c8698'),
  room: hex('#f3f5f9'),
  primary: hex('#1f6fff'),
  face: hex('#eceff3'),
  white: rgb(1, 1, 1),
};

export function hex(h: string): RGB {
  const n = parseInt(h.replace('#', '').slice(0, 6), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

export interface Fonts {
  regular: PDFFont;
  semibold: PDFFont;
  bold: PDFFont;
}

export class Canvas {
  constructor(
    readonly page: PDFPage,
    readonly fonts: Fonts,
  ) {}

  get w() {
    return this.page.getWidth();
  }
  get h() {
    return this.page.getHeight();
  }

  text(
    t: string,
    x: number,
    y: number,
    o: {
      size?: number;
      font?: PDFFont;
      color?: RGB;
      align?: 'left' | 'center' | 'right';
      maxWidth?: number;
    } = {},
  ) {
    const size = o.size ?? 10;
    const font = o.font ?? this.fonts.regular;
    const s = o.maxWidth ? fit(t, font, size, o.maxWidth) : t;
    const w = font.widthOfTextAtSize(s, size);
    const dx = o.align === 'center' ? -w / 2 : o.align === 'right' ? -w : 0;
    // y is the text TOP; pdf-lib wants the baseline
    this.page.drawText(s, { x: x + dx, y: this.h - y - size * 0.8, size, font, color: o.color ?? INK.text });
    return w;
  }

  line(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    o: { width?: number; color?: RGB; dash?: number[]; cap?: 'butt' | 'square' | 'round' } = {},
  ) {
    this.page.drawLine({
      start: { x: x1, y: this.h - y1 },
      end: { x: x2, y: this.h - y2 },
      thickness: o.width ?? 1,
      color: o.color ?? INK.line,
      dashArray: o.dash,
      lineCap:
        o.cap === 'square'
          ? LineCapStyle.Projecting
          : o.cap === 'round'
            ? LineCapStyle.Round
            : LineCapStyle.Butt,
    });
  }

  rect(x: number, y: number, w: number, h: number, o: { fill?: RGB; stroke?: RGB; width?: number } = {}) {
    this.page.drawRectangle({
      x,
      y: this.h - y - h,
      width: w,
      height: h,
      color: o.fill,
      borderColor: o.stroke,
      borderWidth: o.stroke ? (o.width ?? 1) : 0,
    });
  }

  circle(x: number, y: number, r: number, o: { fill?: RGB; stroke?: RGB; width?: number } = {}) {
    this.page.drawCircle({
      x,
      y: this.h - y,
      size: r,
      color: o.fill,
      borderColor: o.stroke,
      borderWidth: o.stroke ? (o.width ?? 1) : 0,
    });
  }

  /** SVG path in top-down page coordinates, or in a local box at (x, y) scaled by `scale`. */
  path(
    d: string,
    o: {
      x?: number;
      y?: number;
      scale?: number;
      fill?: RGB;
      stroke?: RGB;
      width?: number;
      round?: boolean;
    } = {},
  ) {
    this.page.drawSvgPath(d, {
      x: o.x ?? 0,
      y: this.h - (o.y ?? 0),
      scale: o.scale ?? 1,
      color: o.fill,
      borderColor: o.stroke,
      borderWidth: o.stroke ? (o.width ?? 1) : 0,
      borderLineCap: o.round ? LineCapStyle.Round : undefined,
    });
  }
}

/** Truncate with "…" to fit a width. */
export function fit(t: string, font: PDFFont, size: number, max: number): string {
  if (font.widthOfTextAtSize(t, size) <= max) return t;
  let s = t;
  while (s.length > 1 && font.widthOfTextAtSize(`${s}…`, size) > max) s = s.slice(0, -1);
  return `${s}…`;
}

/** Word wrap into lines that fit `max`. */
export function wrap(t: string, font: PDFFont, size: number, max: number): string[] {
  const out: string[] = [];
  let line = '';
  for (const word of t.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= max || !line) line = next;
    else {
      out.push(line);
      line = word;
    }
  }
  if (line) out.push(line);
  return out;
}

/** Rounded rectangle path (top-down). */
export function roundRect(x: number, y: number, w: number, h: number, r: number): string {
  return `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
}

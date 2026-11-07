import type { Surface } from '@/domain/room3d';
import type { SymbolId } from '@/domain/types';
import { SYMBOLS } from '@/features/symbols/catalog';

/**
 * PHASE 23 — textures drawn on a canvas (no image files): plaster, laminate, door, sky, glass and the real
 * faces of sockets, switches, the AC unit and lamps. Surfaces repeat every `TILE` cm.
 */
export const TILE: Partial<Record<Surface, number>> = { wall: 120, reveal: 120, ceiling: 150, floor: 120 };

const mk = (w: number, h: number) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!] as const;
};

function noise(
  g: CanvasRenderingContext2D,
  w: number,
  h: number,
  base: [number, number, number],
  amp: number,
  seed = 7,
) {
  const img = g.createImageData(w, h);
  let s = seed;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < w * h; i++) {
    const n = (rnd() - 0.5) * amp;
    img.data[i * 4] = base[0] + n;
    img.data[i * 4 + 1] = base[1] + n;
    img.data[i * 4 + 2] = base[2] + n;
    img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
}

export function surfaceTexture(s: Surface): HTMLCanvasElement {
  const [c, g] = mk(256, 256);
  switch (s) {
    case 'wall':
    case 'reveal':
      noise(g, 256, 256, [238, 234, 226], 9, s === 'wall' ? 11 : 5);
      break;
    case 'ceiling':
      noise(g, 256, 256, [246, 246, 244], 5, 3);
      break;
    case 'skirting': {
      // white MDF skirting: a lighter top edge and a soft shadow line
      noise(g, 256, 256, [236, 236, 232], 4, 5);
      g.fillStyle = 'rgba(255,255,255,0.7)';
      g.fillRect(0, 0, 256, 34);
      g.fillStyle = 'rgba(0,0,0,0.10)';
      g.fillRect(0, 34, 256, 10);
      break;
    }
    case 'cap':
      noise(g, 256, 256, [92, 97, 106], 8, 9);
      break;
    case 'floor': {
      // light oak laminate, 20 cm planks with staggered joints
      noise(g, 256, 256, [196, 160, 112], 10, 13);
      for (let r = 0; r < 6; r++) {
        const y = (r * 256) / 6;
        g.fillStyle = `rgba(120,80,40,${0.05 + (r % 3) * 0.04})`;
        g.fillRect(0, y, 256, 256 / 6);
        g.strokeStyle = 'rgba(70,45,20,0.55)';
        g.lineWidth = 1.2;
        g.beginPath();
        g.moveTo(0, y);
        g.lineTo(256, y);
        const j = ((r * 97) % 256) + 0.5;
        g.moveTo(j, y);
        g.lineTo(j, y + 256 / 6);
        g.stroke();
        for (let k = 0; k < 9; k++) {
          g.strokeStyle = 'rgba(110,70,30,0.12)';
          g.beginPath();
          const yy = y + 4 + ((k * 37 + r * 13) % (256 / 6 - 6));
          g.moveTo(0, yy);
          g.bezierCurveTo(80, yy + 2, 170, yy - 2, 256, yy + 1);
          g.stroke();
        }
      }
      break;
    }
    case 'door': {
      const grd = g.createLinearGradient(0, 0, 256, 0);
      grd.addColorStop(0, '#8a5a32');
      grd.addColorStop(0.5, '#a06a3c');
      grd.addColorStop(1, '#84552f');
      g.fillStyle = grd;
      g.fillRect(0, 0, 256, 256);
      for (let k = 0; k < 40; k++) {
        g.strokeStyle = `rgba(60,30,10,${0.08 + (k % 4) * 0.03})`;
        g.beginPath();
        const x = (k * 6.7) % 256;
        g.moveTo(x, 0);
        g.bezierCurveTo(x + 4, 80, x - 4, 170, x + 2, 256);
        g.stroke();
      }
      g.strokeStyle = 'rgba(40,20,5,0.5)';
      g.lineWidth = 3;
      g.strokeRect(26, 18, 204, 100);
      g.strokeRect(26, 138, 204, 100);
      // handle
      g.fillStyle = '#d7dbe0';
      g.fillRect(206, 128, 32, 8);
      g.beginPath();
      g.arc(214, 132, 8, 0, Math.PI * 2);
      g.fill();
      break;
    }
    case 'frame':
    case 'sill': {
      noise(g, 256, 256, [242, 243, 245], 4, 2);
      break;
    }
    case 'glass': {
      const grd = g.createLinearGradient(0, 0, 256, 256);
      grd.addColorStop(0, 'rgba(200,225,255,0.18)');
      grd.addColorStop(0.45, 'rgba(255,255,255,0.32)');
      grd.addColorStop(0.55, 'rgba(200,225,255,0.14)');
      grd.addColorStop(1, 'rgba(180,210,250,0.22)');
      g.fillStyle = grd;
      g.fillRect(0, 0, 256, 256);
      break;
    }
    case 'sky': {
      const grd = g.createLinearGradient(0, 0, 0, 256);
      grd.addColorStop(0, '#5aa0e8');
      grd.addColorStop(0.7, '#b9dcfb');
      grd.addColorStop(1, '#e9f4ff');
      g.fillStyle = grd;
      g.fillRect(0, 0, 256, 256);
      g.fillStyle = 'rgba(255,255,255,0.85)';
      for (const [x, y, r] of [
        [60, 70, 22],
        [86, 62, 28],
        [112, 72, 20],
        [180, 110, 18],
        [200, 102, 24],
      ] as const) {
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.fill();
      }
      // a few distant buildings
      g.fillStyle = 'rgba(120,140,160,0.55)';
      g.fillRect(0, 200, 60, 56);
      g.fillRect(70, 180, 40, 76);
      g.fillRect(170, 190, 86, 66);
      break;
    }
  }
  return c;
}

const PX = 16; // texture pixels per cm

function plate(g: CanvasRenderingContext2D, w: number, h: number) {
  const grd = g.createLinearGradient(0, 0, 0, h);
  grd.addColorStop(0, '#ffffff');
  grd.addColorStop(1, '#dde2e8');
  g.fillStyle = grd;
  g.beginPath();
  g.roundRect(2, 2, w - 4, h - 4, 16);
  g.fill();
  g.strokeStyle = '#aab2bd';
  g.lineWidth = 3;
  g.stroke();
}

function outlet(g: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  g.fillStyle = '#eef1f4';
  g.beginPath();
  g.arc(cx, cy, r, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = '#b9c0c9';
  g.lineWidth = 3;
  g.stroke();
  g.fillStyle = '#dfe3e8';
  g.beginPath();
  g.arc(cx, cy, r * 0.78, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#1f2937';
  for (const dx of [-0.34, 0.34]) {
    g.beginPath();
    g.arc(cx + dx * r, cy, r * 0.11, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = '#b7bec7';
  g.fillRect(cx - r * 0.12, cy - r * 0.92, r * 0.24, r * 0.16);
  g.fillRect(cx - r * 0.12, cy + r * 0.76, r * 0.24, r * 0.16);
}

/** The visible face of a wall / ceiling fixture, at its real size. */
export function fixtureTexture(
  symbolId: SymbolId,
  color: string,
  wCm: number,
  hCm: number,
): HTMLCanvasElement {
  const w = Math.max(32, Math.round(wCm * PX));
  const h = Math.max(32, Math.round(hCm * PX));
  const [c, g] = mk(Math.min(w, 1280), Math.min(h, 1024));
  const W = c.width;
  const Hh = c.height;
  switch (symbolId) {
    case 'socket-single':
    case 'socket-double':
    case 'socket-triple': {
      plate(g, W, Hh);
      const n = symbolId === 'socket-single' ? 1 : symbolId === 'socket-double' ? 2 : 3;
      for (let i = 0; i < n; i++) outlet(g, (W / n) * (i + 0.5), Hh / 2, Hh * 0.36);
      break;
    }
    case 'socket-quad':
      plate(g, W, Hh);
      for (const [x, y] of [
        [0.25, 0.25],
        [0.75, 0.25],
        [0.25, 0.75],
        [0.75, 0.75],
      ] as const)
        outlet(g, W * x, Hh * y, Hh * 0.19);
      break;
    case 'switch-single':
    case 'switch-double': {
      plate(g, W, Hh);
      const n = symbolId === 'switch-single' ? 1 : 2;
      const kw = (W - 40) / n;
      for (let i = 0; i < n; i++) {
        const grd = g.createLinearGradient(0, 20, 0, Hh - 20);
        grd.addColorStop(0, '#fbfcfd');
        grd.addColorStop(1, '#e1e6eb');
        g.fillStyle = grd;
        g.beginPath();
        g.roundRect(20 + i * kw + 3, 20, kw - 6, Hh - 40, 10);
        g.fill();
        g.strokeStyle = '#b9c0c9';
        g.lineWidth = 2;
        g.stroke();
        g.fillStyle = 'rgba(0,0,0,0.05)';
        g.fillRect(24 + i * kw, Hh / 2, kw - 14, Hh / 2 - 24);
      }
      break;
    }
    case 'internet':
    case 'tv': {
      plate(g, W, Hh);
      g.fillStyle = '#e2e6eb';
      g.beginPath();
      g.roundRect(W * 0.2, Hh * 0.2, W * 0.6, Hh * 0.6, 10);
      g.fill();
      g.fillStyle = '#1f2937';
      if (symbolId === 'internet') g.fillRect(W * 0.38, Hh * 0.38, W * 0.24, Hh * 0.22);
      else {
        g.beginPath();
        g.arc(W / 2, Hh / 2, Hh * 0.13, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#d1d5db';
        g.beginPath();
        g.arc(W / 2, Hh / 2, Hh * 0.04, 0, Math.PI * 2);
        g.fill();
      }
      break;
    }
    case 'ac': {
      const grd = g.createLinearGradient(0, 0, 0, Hh);
      grd.addColorStop(0, '#ffffff');
      grd.addColorStop(0.75, '#e8ecf0');
      grd.addColorStop(1, '#c9d0d8');
      g.fillStyle = grd;
      g.beginPath();
      g.roundRect(2, 2, W - 4, Hh - 4, 40);
      g.fill();
      g.strokeStyle = '#aab2bd';
      g.lineWidth = 3;
      g.stroke();
      g.fillStyle = '#9aa3ae';
      for (let i = 0; i < 6; i++) g.fillRect(40, Hh * 0.72 + i * 9, W - 80, 3);
      g.fillStyle = '#0f172a';
      g.fillRect(W - 150, Hh * 0.3, 90, 46);
      g.fillStyle = '#38bdf8';
      g.font = 'bold 34px sans-serif';
      g.fillText('22°', W - 142, Hh * 0.3 + 36);
      break;
    }
    case 'ceiling-light':
    case 'led': {
      const grd = g.createRadialGradient(W / 2, Hh / 2, 0, W / 2, Hh / 2, Math.max(W, Hh) / 2);
      grd.addColorStop(0, '#fffdf2');
      grd.addColorStop(0.65, '#ffe9a6');
      grd.addColorStop(1, 'rgba(255,214,120,0.0)');
      g.fillStyle = grd;
      g.fillRect(0, 0, W, Hh);
      if (symbolId === 'ceiling-light') {
        g.strokeStyle = 'rgba(200,170,90,0.6)';
        g.lineWidth = 6;
        g.beginPath();
        g.arc(W / 2, Hh / 2, Math.min(W, Hh) * 0.36, 0, Math.PI * 2);
        g.stroke();
      }
      break;
    }
    default: {
      // any other symbol: its badge, like on the plan
      g.fillStyle = color;
      g.beginPath();
      g.roundRect(2, 2, W - 4, Hh - 4, 18);
      g.fill();
      const s = Math.min(W, Hh) / 24;
      g.save();
      g.translate((W - 24 * s) / 2, (Hh - 24 * s) / 2);
      g.scale(s, s);
      g.strokeStyle = '#fff';
      g.fillStyle = '#fff';
      g.lineWidth = 1.8;
      for (const part of SYMBOLS[symbolId].glyph) {
        const p = new Path2D(part.d);
        if (part.mode === 'fill') g.fill(p);
        else g.stroke(p);
      }
      g.restore();
    }
  }
  return c;
}

/** Soft coloured glow around a small fixture so it is easy to find on a big wall. */
export function haloTexture(color: string): HTMLCanvasElement {
  const [c, g] = mk(128, 128);
  const grd = g.createRadialGradient(64, 64, 18, 64, 64, 64);
  grd.addColorStop(0, color);
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.globalAlpha = 0.55;
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  return c;
}

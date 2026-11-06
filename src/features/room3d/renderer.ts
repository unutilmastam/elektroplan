import type { Fixture, Quad, Room3D, Surface } from '@/domain/room3d';
import { cross, dot, sub, type M4, type Vec3 } from './mat4';
import { TILE, fixtureTexture, haloTexture, surfaceTexture } from './textures';

/**
 * PHASE 23 — a small WebGL renderer for one room (no library). Textured, lit by a ceiling light with soft
 * corner shading; sky, glass and lamps glow on their own. Inner faces only: from outside (top view) the
 * near walls disappear like a doll's house.
 */

const VS = `
attribute vec3 aPos; attribute vec3 aNrm; attribute vec2 aUv;
uniform mat4 uMvp; varying vec3 vPos; varying vec3 vNrm; varying vec2 vUv;
void main(){ vPos=aPos; vNrm=aNrm; vUv=aUv; gl_Position=uMvp*vec4(aPos,1.0); }`;
const FS = `
precision mediump float;
varying vec3 vPos; varying vec3 vNrm; varying vec2 vUv;
uniform sampler2D uTex; uniform vec3 uLight; uniform float uH; uniform float uEmissive; uniform float uAlpha;
void main(){
  vec4 t=texture2D(uTex,vUv);
  if(uEmissive>0.5){ gl_FragColor=vec4(t.rgb,t.a*uAlpha); return; }
  vec3 L=uLight-vPos; float d=length(L); L/=d;
  float diff=max(dot(normalize(vNrm),L),0.0)*(1.0/(1.0+d*d*0.0000022));
  float ao=1.0-0.20*(1.0-smoothstep(0.0,38.0,vPos.y))-0.10*(1.0-smoothstep(0.0,30.0,uH-vPos.y));
  float l=(0.50+0.62*diff)*ao;
  gl_FragColor=vec4(t.rgb*l,t.a*uAlpha);
}`;

interface Batch {
  surface: Surface | 'fixture' | 'halo';
  buf: WebGLBuffer;
  count: number;
  tex: WebGLTexture;
  emissive: boolean;
  alpha: number;
  blend: boolean;
}

const EMISSIVE: Surface[] = ['sky'];

export class Room3DRenderer {
  private gl: WebGLRenderingContext;
  private prog: WebGLProgram;
  private batches: Batch[] = [];
  private texCache = new Map<string, WebGLTexture>();
  private room: Room3D | null = null;

  static create(canvas: HTMLCanvasElement): Room3DRenderer | null {
    const gl = canvas.getContext('webgl', { antialias: true, alpha: false, preserveDrawingBuffer: true });
    return gl ? new Room3DRenderer(gl) : null;
  }

  private constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const p = gl.createProgram()!;
    gl.attachShader(p, sh(gl.VERTEX_SHADER, VS));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(p);
    this.prog = p;
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
  }

  private texture(key: string, make: () => HTMLCanvasElement, repeat: boolean): WebGLTexture {
    const hit = this.texCache.get(key);
    if (hit) return hit;
    const gl = this.gl;
    const t = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, make());
    if (repeat) {
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    this.texCache.set(key, t);
    return t;
  }

  /** Builds the vertex buffers for a room (call again when the project changes). */
  setRoom(room: Room3D) {
    const gl = this.gl;
    for (const b of this.batches) gl.deleteBuffer(b.buf);
    this.batches = [];
    this.room = room;
    const groups = new Map<Surface, number[]>();
    const push = (s: Surface, v: number[]) => {
      const arr = groups.get(s) ?? [];
      arr.push(...v);
      groups.set(s, arr);
    };
    // triangles with the right winding for their normal (front = facing the viewer inside)
    const tri = (
      out: number[],
      a: Vec3,
      b: Vec3,
      c: Vec3,
      n: Vec3,
      ua: number[],
      ub: number[],
      uc: number[],
    ) => {
      const g = cross(sub(b, a), sub(c, a));
      if (dot(g, n) >= 0) out.push(...a, ...n, ...ua, ...b, ...n, ...ub, ...c, ...n, ...uc);
      else out.push(...a, ...n, ...ua, ...c, ...n, ...uc, ...b, ...n, ...ub);
    };
    const quad = (q: Quad) => {
      const tile = TILE[q.surface];
      const [su, sv] = tile ? [q.size[0] / tile, q.size[1] / tile] : [1, 1];
      const uv = [
        [0, sv],
        [su, sv],
        [su, 0],
        [0, 0],
      ];
      const v: number[] = [];
      tri(v, q.p[0], q.p[1], q.p[2], q.n, uv[0]!, uv[1]!, uv[2]!);
      tri(v, q.p[0], q.p[2], q.p[3], q.n, uv[0]!, uv[2]!, uv[3]!);
      push(q.surface, v);
    };
    room.quads.forEach(quad);
    // floor and ceiling
    const f: number[] = [];
    const c: number[] = [];
    const H = room.height;
    const T = TILE.floor!;
    for (const [i, j, k] of room.triangles) {
      const [a, b, d] = [room.floor[i]!, room.floor[j]!, room.floor[k]!];
      const P = (p: { x: number; y: number }, h: number): Vec3 => [p.x, h, p.y];
      const U = (p: { x: number; y: number }) => [p.x / T, p.y / T];
      tri(f, P(a, 0), P(b, 0), P(d, 0), [0, 1, 0], U(a), U(b), U(d));
      tri(c, P(a, H), P(b, H), P(d, H), [0, -1, 0], U(a), U(b), U(d));
    }
    push('floor', f);
    push('ceiling', c);

    for (const [s, v] of groups) {
      const buf = gl.createBuffer()!;
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.STATIC_DRAW);
      const blend = s === 'glass';
      this.batches.push({
        surface: s,
        buf,
        count: v.length / 8,
        tex: this.texture(`s:${s}`, () => surfaceTexture(s), !!TILE[s]),
        emissive: EMISSIVE.includes(s),
        alpha: 1,
        blend,
      });
    }
    for (const fx of room.fixtures) this.addFixture(fx);
    // transparent last
    this.batches.sort((a, b) => Number(a.blend) - Number(b.blend));
  }

  private faceQuad(fx: Fixture, w: number, h: number, back: number): WebGLBuffer {
    const gl = this.gl;
    const up: Vec3 = fx.n[1] !== 0 ? [0, 0, fx.n[1] < 0 ? 1 : -1] : [0, 1, 0];
    const u = fx.u;
    const n = fx.n;
    const c: Vec3 = [fx.c[0] - n[0] * back, fx.c[1] - n[1] * back, fx.c[2] - n[2] * back];
    const P = (a: number, b: number): Vec3 => [
      c[0] + u[0] * a + up[0] * b,
      c[1] + u[1] * a + up[1] * b,
      c[2] + u[2] * a + up[2] * b,
    ];
    const v: number[] = [];
    const tri = (a: Vec3, b: Vec3, d: Vec3, ua: number[], ub: number[], ud: number[]) => {
      const g = cross(sub(b, a), sub(d, a));
      if (dot(g, n) >= 0) v.push(...a, ...n, ...ua, ...b, ...n, ...ub, ...d, ...n, ...ud);
      else v.push(...a, ...n, ...ua, ...d, ...n, ...ud, ...b, ...n, ...ub);
    };
    const hw = w / 2;
    const hh = h / 2;
    tri(P(-hw, -hh), P(hw, -hh), P(hw, hh), [0, 1], [1, 1], [1, 0]);
    tri(P(-hw, -hh), P(hw, hh), P(-hw, hh), [0, 1], [1, 0], [0, 0]);
    const buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.STATIC_DRAW);
    return buf;
  }

  private addFixture(fx: Fixture) {
    const lamp = fx.symbolId === 'ceiling-light' || fx.symbolId === 'led';
    if (!lamp) {
      const r = Math.max(fx.w, fx.h) + 22;
      this.batches.push({
        surface: 'halo',
        buf: this.faceQuad(fx, r, r, 0.3),
        count: 6,
        tex: this.texture(`h:${fx.color}`, () => haloTexture(fx.color), false),
        emissive: true,
        alpha: 1,
        blend: true,
      });
    }
    this.batches.push({
      surface: 'fixture',
      buf: this.faceQuad(fx, fx.w, fx.h, 0),
      count: 6,
      tex: this.texture(
        `f:${fx.symbolId}:${fx.color}`,
        () => fixtureTexture(fx.symbolId, fx.color, fx.w, fx.h),
        false,
      ),
      emissive: lamp,
      alpha: 1,
      blend: true, // rounded plates and glowing lamps have soft, transparent edges
    });
  }

  /** `sky` = draw the view outside the windows (inside view; from above it would float in the air). */
  render(mvp: M4, width: number, height: number, sky = true, marks = true) {
    const gl = this.gl;
    const room = this.room;
    gl.viewport(0, 0, width, height);
    gl.clearColor(0.11, 0.12, 0.14, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if (!room) return;
    gl.useProgram(this.prog);
    const loc = (n: string) => gl.getAttribLocation(this.prog, n);
    const uni = (n: string) => gl.getUniformLocation(this.prog, n);
    gl.uniformMatrix4fv(uni('uMvp'), false, mvp);
    gl.uniform3f(uni('uLight'), room.center[0], room.height - 25, room.center[2]);
    gl.uniform1f(uni('uH'), room.height);
    const aPos = loc('aPos');
    const aNrm = loc('aNrm');
    const aUv = loc('aUv');
    for (const b of this.batches) {
      if (!sky && b.surface === 'sky') continue;
      if (!marks && b.surface === 'halo') continue;
      if (b.blend) {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.depthMask(false);
      } else {
        gl.disable(gl.BLEND);
        gl.depthMask(true);
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, b.buf);
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 32, 0);
      gl.enableVertexAttribArray(aNrm);
      gl.vertexAttribPointer(aNrm, 3, gl.FLOAT, false, 32, 12);
      gl.enableVertexAttribArray(aUv);
      gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 32, 24);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, b.tex);
      gl.uniform1i(uni('uTex'), 0);
      gl.uniform1f(uni('uEmissive'), b.emissive ? 1 : 0);
      gl.uniform1f(uni('uAlpha'), b.alpha);
      gl.drawArrays(gl.TRIANGLES, 0, b.count);
    }
    gl.depthMask(true);
  }

  dispose() {
    const gl = this.gl;
    for (const b of this.batches) gl.deleteBuffer(b.buf);
    for (const t of this.texCache.values()) gl.deleteTexture(t);
    this.batches = [];
    this.texCache.clear();
  }
}

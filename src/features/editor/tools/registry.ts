import type { Tool } from './types';

/** The tool currently receiving input (set by useCanvasInput) — lets the keyboard and on-screen buttons talk to it. */
let active: Tool | null = null;

export const setActiveTool = (t: Tool | null) => {
  active = t;
};
export const getActiveTool = () => active;

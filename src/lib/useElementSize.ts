'use client';

import { useEffect, useRef, useState } from 'react';

/** Tracks an element's content size with ResizeObserver (Split View / Stage Manager / rotation safe). */
export function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      setSize((s) =>
        s.width === Math.round(r.width) && s.height === Math.round(r.height)
          ? s
          : { width: Math.round(r.width), height: Math.round(r.height) },
      );
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

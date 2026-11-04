import type { MetadataRoute } from 'next';
import { uz } from '@/i18n/uz';

export const dynamic = 'force-static';

/** Web app manifest: installable on iPad/iPhone (Home Screen), Android and Windows (Edge/Chrome). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: uz.app.name,
    short_name: uz.app.name,
    description: uz.app.description,
    lang: 'uz',
    dir: 'ltr',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    display_override: ['window-controls-overlay', 'standalone'],
    orientation: 'any',
    background_color: '#05080f',
    theme_color: '#05080f',
    categories: ['productivity', 'utilities', 'business'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
  };
}

# ELEKTROPLAN — Progress

| Phase | Nomi | Holat |
|---|---|---|
| 0 | Arxitektura va hujjatlar | ✅ Tayyor |
| 1 | Poydevor + dashboard dizayni | ✅ Tayyor (tasdiq kutilmoqda) |
| 2 | Loyiha boshqaruvi | — |
| 3 | Chizma dvigateli | — |
| 4 | Xonalar va devorlar | — |
| 5 | SVG belgilar | — |
| 6 | Nuqtalarni joylashtirish | — |
| 7 | Devor ko‘rinishi | — |
| 8 | Avtosaqlash (IndexedDB) | — |
| 9 | Montaj rejimi | — |
| 10 | PDF eksport | — |
| 11 | PWA / offline (internetsiz ishlash) | — |
| 12 | PHP + MySQL sync + Auth | — |
| 13 | Testlar va optimizatsiya | — |

## Phase 1 — 2026-11-03

**Bajarildi**
- Next.js 15 (App Router, `output: 'export'`, `trailingSlash: true`) + TS strict (`noUncheckedIndexedAccess`) + Tailwind 4 + shadcn/ui uslubidagi `Button`/`Tooltip` + ESLint + Prettier + Vitest + Playwright (6 qurilma profili), pnpm.
- GitHub Actions: `ci.yml` (typecheck, lint, test, build, `php -l`, e2e — iPad/iPhone uchun WebKit) va `deploy.yml` (build → `deploy/` → `api/config.php` secrets’dan → FTPS). Secrets qo‘shilganda ishlaydi.
- `public/.htaccess` (HTTPS, `/api` ga tegmaydi, trailing slash, 404, kesh sarlavhalari), `server/.htaccess` + `server/index.php` (503 stub, Phase 12 gacha).
- `viewport-fit=cover`, safe-area (`env(safe-area-inset-*)`), `100dvh`, sahifa scroll’i yo‘q.
- ARCHITECTURE §3 papka tuzilmasi (keyingi bosqich modullari `index.ts` bilan).
- Dizayn tokenlari (`src/styles/globals.css`), Inter (next/font, build vaqtida o‘z serverga joylanadi — offline uchun), `GlassPanel`, `Button` variantlari, `ProgressRing`, `NumberField`, `ColorSwatches`, `Hint`/`NextPhase` tooltip.
- `src/i18n/uz.ts` — barcha matnlar shu yerda.
- AppShell: Sidebar (logo, 6 nav, Jami loyihalar, Pro karta, foydalanuvchi), Header, Symbol bar (+ “Boshqa” menyusi), chap toolbar, Konva `Stage` + grid, “Tanlangan nuqta”, Xonalar ro‘yxati, Devor ko‘rinishi (SVG), Loyiha holati.
- 11 ta SVG belgi bitta manbadan (`features/symbols/catalog.ts`): DOM’da `SymbolIcon`, Konva’da `PointGlyph` — bir xil glif ma’lumoti.
- Demo uy rejasi (`?demo=1`, faqat dev; yoki build’da `NEXT_PUBLIC_ENABLE_DEMO=1`): 6 xona, umumiy devorlar, eshik/derazalar, 30 nuqta, 70% progress. Production’da demo chunk yuklanmaydi.
- Responsive: <600 bottom nav + bottom sheet (Nuqta/Xonalar/Devor/Holat); 600–1023 72px rail + nuqta paneli slide-over + pastki qator tablar; 1024–1279 rail + siqilgan referens maket; ≥1280 to‘liq referens maket.
- Ishlaydigan amallar: nav marshrutlari, belgi tanlash (aktiv belgi), “Boshqa” menyusi, zoom +/−, “Ekranga sig‘dirish”, xona tanlash → devor ko‘rinishi shu xonaning eng ko‘p nuqtali devoriga o‘tadi, “Montaj rejimi” → `/install/?id=`.
- Keyingi bosqich tugmalari `disabled` + “Keyingi bosqichda”: Saqlash, Eksport PDF, ✎, Ramka/Siljitish/Undo/Redo, O‘chirish, Nusxa, ko‘z (xonaga fokus), Yangilash, Loyiha tayyor; nuqta maydonlari faqat o‘qish uchun (tahrir Phase 6).
- Domen (sof funksiyalar + testlar): `geometry.ts`, `walls.ts` (devorlarni xonalardan chiqarish, umumiy devor, yo‘nalish, teshiklar), `progress.ts`, `selectors.ts`, `project.ts`, `types.ts`.

**Test qilindi**
- `pnpm typecheck`, `pnpm lint`, `pnpm test` (22 unit test), `pnpm build` (statik `out/`, `.htaccess` bilan), `php -l server/*.php` — o‘tdi.
- `pnpm test:e2e` — 7 ssenariy × 6 profil = 42/42 o‘tdi (sahifalar ochiladi, nav, Montaj rejimi havolasi, disabled tugmalar, belgi tanlash, gorizontal scroll yo‘q, production’da demo yo‘q).
- Skrinshotlar (`docs/screenshots/phase-1/`): referens 1536×1024, iPad 1180×820, iPad Pro 1366×1024, iPad portret 820×1180, iPhone 390×664, Android 412×915, Windows 1920×1080, telefon bottom sheet, planshet slide-over. Barcha o‘lchamlarda gorizontal scroll yo‘q.
- Referens bilan solishtirib tuzatilgan farqlar: logo ko‘rinmasligi, devor birikmalari, eshik ochilish tomoni, kirish eshigi kesilishi, rozetka belgilarining devor bo‘yicha burilishi, o‘ng panel yozuvlari qisqarishi, iPad landshaftda toolbar/panel sig‘masligi, devor ko‘rinishida o‘lcham yozuvlari ustma-ust tushishi, telefonda sarlavha torligi.

**Ma’lum cheklovlar**
- Lokal muhitda faqat Chromium bor: iPad/iPhone profillari Chromium’da (Apple viewport/touch/UA bilan) tekshirildi. CI’da `E2E_WEBKIT=1` bilan WebKit’da ishga tushadi.
- Referensdan ataylab farqlar (ma’lumotga asoslangani uchun): devor ko‘rinishi “Zal – G‘arb devori” (TV shu devorda), xonalar nuqta soni va 21/9/30 hisoblari demo ma’lumotdan; sidebar ikonkalari lucide (referensdagi 3D ikonkalar emas); disabled tugmalar biroz xiraroq.
- Konva canvas’da hali pan/zoom gestlari, tanlash va chizish yo‘q (Phase 3). Nuqtani rejada tanlash yo‘q — demo tanlovi oldindan o‘rnatilgan.
- `Opening` (eshik/deraza) turi vaqtinchalik qo‘shildi — MySQL sxemasiga Phase 4 da kiritiladi.
- Android “Orqaga” tugmasi bottom sheet’ni yopishi — keyingi bosqichlarda.
- ARCHITECTURE §5 dagi ro‘yxatdan tashqari faqat tooling yordamchilari qo‘shildi: `@tailwindcss/postcss`/`postcss` (Tailwind 4 uchun), `@eslint/eslintrc` + `eslint-config-next`, `@vitejs/plugin-react` + `jsdom` + `@testing-library/dom` (Vitest uchun), `@radix-ui/react-slot` + `@radix-ui/react-tooltip` (shadcn/ui). `react-konva` 19.2 ga qotirilgan (Next 15 ichki React 19.2 bilan mos).

## Phase 0 — 2026-11-03
- Texnik topshiriq (`docs/SPEC.md`), dizayn referensi, arxitektura, ma’lumot modeli, MySQL sxemasi, qurilmalar, deploy, dizayn tizimi va bosqichlar rejasi tayyorlandi.
- Kod hali yo‘q — PHASE 1 dan boshlanadi.
- Hosting qarori: hostmaster.uz cPanel → Next.js static export + PHP 8 + MySQL, deploy GitHub Actions → FTP.
- Offline talab: barcha saqlangan loyihalar internetsiz ochiladi (ARCHITECTURE §4.6).
- Qurilmalar: iPad asosiy, keyin iPhone, Android, Windows (`docs/DEVICES.md`).

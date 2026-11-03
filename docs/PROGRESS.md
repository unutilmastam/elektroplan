# ELEKTROPLAN — Progress

| Phase | Nomi | Holat |
|---|---|---|
| 0 | Arxitektura va hujjatlar | ✅ Tayyor |
| 1 | Poydevor + dashboard dizayni | ✅ Tayyor |
| 2 | Loyiha boshqaruvi | ✅ Tayyor |
| 3 | Chizma dvigateli | ✅ Tayyor (tasdiq kutilmoqda) |
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

## Phase 3 — 2026-11-03

**Bajarildi**
- `domain/geometry.ts`: ekran ↔ dunyo koordinatalari, pan, ikki barmoqli pinch (barmoq ostidagi nuqta joyida qoladi), g‘ildirak turi (sichqoncha → kursorga zoom, trackpad pinch → zoom, trackpad scroll → pan), grid va 0/45/90° burchakka yopishtirish, kesmaga proyeksiya/masofa, ko‘pburchak ichidami, to‘rtburchak.
- `domain/history.ts`: immer patch’lari bilan undo/redo, bitta sudrash = bitta qadam (coalesce), 200 qadam chegarasi, yangi amal redo’ni tozalaydi.
- `domain/selection.ts`: hit-test (nuqta → devor → xona), ramka bilan tanlash, Shift/Ctrl, panel fokusi. `domain/editing.ts`: o‘chirish (xona → nuqtalari va faqat o‘ziga tegishli devorlar; umumiy devor qo‘shniga qoladi; devor → undagi nuqtalar), siljitish (devordagi nuqta devor bo‘ylab sirpanadi, shift saqlanadi; xonalar faqat yopiq guruh bo‘lsa butunlay siljiydi, grid’ga yopishadi).
- Asboblar (pointer holat mashinalari): Tanlash (V), Ramka tanlash (M), Siljitish (H). Bo‘sh joyni sudrash = pan. Tanlov barmoq ko‘tarilganda yoki sudrash boshlanganda hal qilinadi — ikkinchi barmoq (pinch) yoki uzoq bosish tanlovni buzmaydi.
- `GestureRouter`: ikki barmoq pinch/pan, o‘rta tugma va Space+drag pan, kaftni rad etish (Pencil bosilganda barmoq e’tiborsiz), uzoq bosish 500 ms → kontekst menyu (Xususiyatlar / Nusxa — Phase 6 / O‘chirish), o‘ng tugma → shu menyu. Harakatlar `requestAnimationFrame` bilan guruhlanadi (120 Hz iPad).
- Klaviatura: ⌘/Ctrl+Z, ⇧⌘Z / Ctrl+Shift+Z / Ctrl+Y, ⌫/Delete, Esc, ⌘/Ctrl+A, V/M/H, +/−, 0 (ekranga sig‘dirish).
- Canvas: reja qatlami memo (pan paytida qayta chizilmaydi), tanlash/ramka overlay qatlami; o‘lcham o‘zgarsa (aylantirish, Split View) ko‘rinish markazi saqlanadi.
- Toolbar’dagi barcha tugmalar endi ishlaydi; nuqta panelidagi “O‘chirish” ishlaydi. Devor bosilsa — “Devor ko‘rinishi” shu devorni ko‘rsatadi.
- Sozlamalar sahifasi: “Faqat Pencil bilan chizish” (qurilmada IndexedDB `meta.deviceSettings` da saqlanadi): yoqilsa bitta barmoq faqat tanlaydi va suradi, obyektni siljitmaydi.
- Reja ichidagi o‘zgarishlar 400 ms dan keyin IndexedDB’ga yoziladi, ilova fonga o‘tganda/yopilganda darhol (`pagehide`/`visibilitychange`). Loyiha darajasidagi amallardan oldin ham kutilayotgan yozuv yakunlanadi.

**Test qilindi**
- `pnpm typecheck`, `pnpm lint`, `pnpm test` — 93 test (geometriya, tarix, tanlash/tahrir, asboblar, gest router — fake timer bilan uzoq bosish, kaft, pinch).
- `pnpm test:e2e` — 20 ssenariy × 6 profil: 115 o‘tdi, 5 ataylab o‘tkazildi (telefonda ✎ yo‘q; <1024 da nuqta paneli yashirin — o‘sha o‘chirish kontekst menyu testida). Test loyihasi IndexedDB’ga yozib ochiladi (zod o‘qish yo‘li ham tekshiriladi): tanlash, devor bo‘ylab sudrash, undo/redo, yangilashdan keyin saqlanish, ramka + Delete + Ctrl+Z/Ctrl+Shift+Z, o‘ng tugma menyusi, zoom tugmalari/fit/pan, CDP orqali ikki barmoqli pinch, Pencil sozlamasi saqlanishi.
- Qo‘lda (Playwright skrinshot, `docs/screenshots/phase-3/`): iPad landshaft — sichqoncha, ramka, g‘ildirak, o‘ng tugma; sensor — pinch, uzoq bosish; iPhone/iPad portret — menyu → Xususiyatlar (telefonda pastki panel, planshetda slide-over).
- Phase 1–2 qayta tekshirildi (shu e2e to‘plamida): sahifalar, nav, loyiha CRUD, demo.
- Topilib tuzatilgan: canvas o‘lchami effektidagi cheksiz qayta-render; barmoq ko‘tarilganda sun’iy click menyuni yopib qo‘yishi; pinch boshida birinchi barmoq tanlovni o‘zgartirishi.

**Ma’lum cheklovlar**
- Haqiqiy iPad/Apple Pencil’da 60 fps va kaft rad etishni bu muhitda o‘lchab bo‘lmadi (Chromium emulyatsiyasi). Iltimos, iPad’da tekshirib ko‘ring.
- Pencil hover oldindan ko‘rsatish — Phase 4 (devor/burchakka yopishish bilan birga).
- Bitta xonani umumiy devorlardan ajratib siljitish, devorni siljitish/bo‘lish — Phase 4. Nuqtani boshqa devorga ko‘chirish — Phase 6.
- Undo tarixi faqat xotirada (sahifa yangilansa tozalanadi).
- Nusxa (kontekst menyu, panel) — Phase 6.

## Phase 2 — 2026-11-03

**Bajarildi**
- `domain/ids.ts` (UUID v7 — vaqt bo‘yicha saralanadi, oflayn yaratiladi), `domain/schemas.ts` (zod: Project/Room/Wall/Point/Opening/Settings + loyiha formasi; xatolar kod sifatida, matni `uz.validation` da), `domain/commands.ts` (yaratish, tahrirlash, soft delete, chuqur nusxa — barcha ID’lar yangilanadi, progress nolga tushadi), `domain/projectList.ts` (qidiruv, saralash, xulosa, so‘nggi loyihalar, takrorlanmas nom).
- IndexedDB repo (`infra/idb`): `elektroplan` v1 bazasi (`projects`, `outbox`, `meta`), o‘qishda har bir yozuv zod bilan tekshiriladi — buzilgan yozuv o‘tkazib yuboriladi, ilova yiqilmaydi. `navigator.storage.persist()` birinchi saqlashda so‘raladi.
- `projectStore` (Zustand + immer): init (IndexedDB’dan), create / updateInfo / duplicate / remove / open; avval IndexedDB’ga yoziladi, keyin ekranda ko‘rinadi (yangilansa yo‘qolmaydi). Yozish xatosi bo‘lsa — o‘zbekcha ogohlantirish banneri, ma’lumot xotirada qoladi.
- Loyihalar sahifasi: ro‘yxat (kartalar: nom, buyurtmachi, manzil, xona/nuqta soni, yangilangan vaqt, progress), qidiruv (nom/buyurtmachi/manzil, katta-kichik harf va ‘ ʻ ' farqsiz), saralash (oxirgi o‘zgargan, yaratilgan, nomi, foiz), Ochish / Tahrirlash / Nusxa olish / O‘chirish (tasdiq oynasi bilan), bo‘sh holat.
- Forma dialogi (yaratish/tahrirlash): validatsiya xatolari o‘zbekcha; telefonda pastdan chiqadi; input shrifti 16px (iOS zoom qilmaydi).
- Header: ✎ endi ishlaydi (tahrirlash), papka tugmasi → “So‘nggi loyihalar” menyusi (5 ta) + Barcha loyihalar + Yangi loyiha. Loyiha tanlanmaganda “Loyiha tanlanmagan” + yaratish tugmalari.
- Bosh sahifa oxirgi ochilgan (yoki eng so‘nggi) loyihani ochadi; `/editor/?id=` — shu loyiha, yo‘q bo‘lsa “Loyiha topilmadi”. Sidebar “Jami loyihalar” — real son.
- Demo (`?demo=1`, dev) o‘zgarmadi va saqlanmaydi.
- Yangi bog‘liqlik: `@radix-ui/react-dialog` (shadcn/ui Dialog uchun, ARCHITECTURE §5 dagi “generated @radix-ui/*”).

**Test qilindi**
- `pnpm typecheck`, `pnpm lint`, `pnpm test` — 48 test (sxemalar, buyruqlar, ID, ro‘yxat, store + IndexedDB integratsiyasi `fake-indexeddb` bilan: “sahifani yangilash”dan keyin ham saqlanishi, buzilgan yozuv, yozish xatosi).
- `pnpm test:e2e` — 13 ssenariy × 6 profil: 76 o‘tdi, 2 ataylab o‘tkazildi (telefonda ✎ yashirin, u yerda tahrir kartadan). Yaratish → yangilash → saqlangan; tahrir/nusxa/o‘chirish (bekor qilish bilan) → yangilashdan keyin ham to‘g‘ri; qidiruv/saralash; o‘zbekcha validatsiya xatosi; mavjud bo‘lmagan ID.
- Phase 1 tekshirildi: demo reja 1536×1024 da avvalgidek; nav, belgilar, zoom ishlaydi.
- Skrinshotlar: `docs/screenshots/phase-2/` (iPad landshaft/portret, iPhone, Windows). Gorizontal scroll yo‘q.
- Topilib tuzatilgan: brauzerlarda `uz` alifbo tartibi har xil ishlashi (endi hamma qurilmada bir xil A–Z tartib), telefonda qidiruv maydoni siqilishi, loyiha yo‘qda header’da “— | —”.

**Ma’lum cheklovlar**
- Loyiha ichidagi o‘zgarishlarni avtosaqlash (debounce, outbox, beforeunload) — Phase 8. Hozir faqat loyiha darajasidagi amallar (yaratish, tahrir, nusxa, o‘chirish) saqlanadi; “Saqlash” tugmasi hali disabled.
- O‘chirilgan loyihalar IndexedDB’da `deletedAt` bilan qoladi (keyingi sinxronizatsiya uchun); “Savat”dan tiklash yo‘q.
- Ochish/tahrir boshqa tab’da qilinsa, ikkinchi tab o‘zgarishni faqat yangilangandan keyin ko‘radi.

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

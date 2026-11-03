# ELEKTROPLAN — Bosqichlar (13 phase)

Har bosqich oxirida: **test → xatolarni tuzatish → oldingi funksiyalarni tekshirish → `docs/PROGRESS.md` yangilash → hisobot → tasdiq kutish.**
Har bosqich alohida git branch: `phase-N`, tasdiqdan keyin `main` ga merge.

Har bosqichni Claude Code’da boshlash uchun tayyor prompt ham berilgan (▶).

---

## PHASE 1 — Loyiha poydevori + to‘liq dashboard dizayni

**Vazifalar**
- Next.js (App Router) + TS strict + Tailwind + shadcn/ui + ESLint/Prettier + Vitest + Playwright, pnpm.
- `docs/ARCHITECTURE.md` dagi papka tuzilmasini yaratish (bo‘sh modullar `index.ts` bilan).
- Dizayn tokenlari (`globals.css`), Inter shrift, `GlassPanel`, tugmalar, `ProgressRing`, `NumberField`, `ColorSwatches`.
- `i18n/uz.ts` — barcha matnlar.
- AppShell: Sidebar (logo, 6 ta nav, Jami loyihalar, Pro karta, foydalanuvchi), Header, Symbol bar, chap toolbar, markazda Konva `Stage` + grid (hali chizish yo‘q), o‘ng “Tanlangan nuqta” paneli, pastki qator (Xonalar ro‘yxati, Devor ko‘rinishi, Loyiha holati).
- Barcha 11 ta SVG belgining **ko‘rinishi** (`SymbolIcon`) — dizaynni moslash uchun.
- Demo ma’lumot faqat dev rejimda (`?demo=1`), referensdagi kabi uy rejasi bilan — dizaynni solishtirish uchun.
- Responsive skelet: desktop / tablet / mobil (bottom nav, bottom sheet).
- Nav bo‘yicha sahifa marshrutlari ishlaydi. Keyingi bosqich funksiyalari tugmalari `disabled` + “Keyingi bosqichda”.

**Qabul mezonlari**
- Desktop 1536×1024 skrinshot referensga vizual jihatdan juda yaqin.
- 390px (iPhone) va 1024px (iPad) da layout buzilmaydi, gorizontal scroll yo‘q.
- `pnpm typecheck lint test` o‘tadi; Playwright: sahifalar ochiladi, nav ishlaydi.

▶ `CLAUDE.md va docs/ ni o‘qi. PHASE 1 ni bajar: loyiha poydevori va referensga mos dashboard dizayni. Tugagach desktop, iPad va iPhone o‘lchamlarida skrinshot olib referens bilan solishtir, PROGRESS.md ni yangila va to‘xta.`

---

## PHASE 2 — Loyiha yaratish va boshqarish

**Vazifalar**
- `domain/types.ts`, `domain/schemas.ts` (zod), `domain/ids.ts`.
- `projectStore` (Zustand + immer), loyiha CRUD: yaratish (nom, buyurtmachi, manzil), tahrirlash (header’dagi ✎), nusxa olish, o‘chirish (tasdiq bilan).
- Loyihalar sahifasi: ro‘yxat, qidiruv, saralash, progress ko‘rsatkichi.
- Dashboard: Jami loyihalar soni, so‘nggi loyihalar — real ma’lumotdan.
- Vaqtinchalik saqlash: IndexedDB repo’ning minimal versiyasi (to‘liq autosave Phase 8 da).

**Qabul:** sahifa yangilansa loyihalar yo‘qolmaydi; validatsiya xatolari o‘zbekcha ko‘rsatiladi; unit testlar: schemas, project commands.

▶ `PHASE 2 ni bajar (docs/PHASES.md). Avval domain tiplar va zod sxemalar, keyin store va UI.`

---

## PHASE 3 — Chizma dvigateli (drawing engine)

**Vazifalar**
- `editorStore`: viewport, aktiv asbob, selection.
- Pan (bo‘sh joyni sudrash / ikki barmoq), zoom (g‘ildirak → kursorga, pinch), “ekranga sig‘dirish”.
- Pointer Events asosida asbob arxitekturasi (state machine) — sichqoncha, sensor, stilus.
- Select, marquee (ko‘p tanlash), Shift/Ctrl bilan qo‘shib tanlash, Delete, Esc.
- Undo/Redo: immer patches, drag birlashtiriladi, 200 qadam, Ctrl+Z / Ctrl+Shift+Z.
- Grid + snapping (grid, burchak 0/45/90).
- `domain/geometry.ts` + to‘liq unit testlar.

**Qabul:** iPad’da barmoq bilan pan/zoom silliq (60 fps), undo/redo har qanday amalni qaytaradi.

▶ `PHASE 3 ni bajar. geometry.ts va history ni avval testlar bilan yoz.`

---

## PHASE 4 — Xonalar va devorlar

**Vazifalar**
- Asboblar: to‘rtburchak xona, kvadrat xona, erkin (polygon) xona, alohida devor.
- Xona yaratilganda devorlar avtomatik; qo‘shni xonalar umumiy devorni bo‘lishadi (`domain/walls.ts`).
- Devorni siljitish (bog‘liq xonalar ham o‘zgaradi), devorni o‘chirish, devorni bo‘lish.
- Xona: nomlash (ikki marta bosish yoki panel), rang, nusxa, o‘chirish, label joyi.
- Eshik/deraza — faqat vizual devor bo‘shlig‘i (ixtiyoriy, CAD emas).
- “Xonalar ro‘yxati” paneli real ma’lumotdan; ko‘z ikonkasi — xonaga fokus.

**Qabul:** referensdagi 6 xonali rejani 3 daqiqada chizish mumkin; o‘lcham hech qayerda so‘ralmaydi.

▶ `PHASE 4 ni bajar. walls.ts (umumiy devor, siljitish, bo‘lish) testlar bilan.`

---

## PHASE 5 — SVG elektr belgilar kutubxonasi

**Vazifalar**
- `features/symbols/catalog.ts`: 11 ta belgi (id, nom, kategoriya, SVG, rang, balandlik, editableProps).
- `SymbolIcon` (React/SVG) va `PointGlyph` (Konva) — bitta SVG manbadan.
- Symbol bar: belgi tanlash = “joylashtirish” asbobi; “Boshqa” — qolgan belgilar ro‘yxati.
- Rang/o‘lcham bo‘yicha belgilar galereyasi sahifasi (Sozlamalar ichida) — testlash uchun.

**Qabul:** belgilar 50%–400% zoomda aniq; emoji yo‘q.

▶ `PHASE 5 ni bajar. Barcha belgilar bitta manbadan SVG bo‘lsin.`

---

## PHASE 6 — Elektr nuqtalarni joylashtirish va tahrirlash

**Vazifalar**
- Belgini devorga qo‘yish: eng yaqin devorga snap, `wallId + t + side`; shift bilan erkin.
- Shift/lyustra/LED — xona ichiga (ceiling).
- Drag bilan devor bo‘ylab siljitish, boshqa devorga ko‘chirish.
- O‘ng panel: belgi turi, Pol’dan balandlik, Chap burchakdan, X/Y, Izoh, Rang, holat; O‘chirish, Nusxa.
- Standart balandliklar sozlamalardan (rozetka 30, viklyuchatel 90 sm).
- `domain/points.ts` testlar bilan.

**Qabul:** devor siljiganda nuqtalar devor bilan birga yuradi; har bir xususiyat tahrirlanadi va undo bo‘ladi.

▶ `PHASE 6 ni bajar.`

---

## PHASE 7 — Devor ko‘rinishi (Wall elevation)

**Vazifalar**
- Devor tanlanganda pastki panelda gorizontal ko‘rinish: “Zal – Shimol devori”, nuqtalar soni.
- Pol chizig‘i, balandlik o‘lchagichi, masofa o‘lchov chiziqlari (sm), balandlik yozuvi.
- Nuqtani tanlash = rejada ham tanlanadi (va aksincha).
- Drag: gorizontal → masofa, vertikal → balandlik; panel bilan sinxron.
- Mobil/planshetda to‘liq ekran devor ko‘rinishi.

**Qabul:** referensdagi “Devor ko‘rinishi” kabi ko‘rinadi; ikki ko‘rinish har doim sinxron.

▶ `PHASE 7 ni bajar. Bu asosiy funksiya — sinxronlikni e2e test bilan tekshir.`

---

## PHASE 8 — Avtosaqlash va lokal saqlash

**Vazifalar**
- `infra/idb`: projects, outbox, meta; versiyali migratsiya; o‘qishda zod validatsiya.
- Har o‘zgarishda 500 ms debounce bilan saqlash; `beforeunload`/`visibilitychange` da darhol.
- Header: “Saqlanmoqda… / Saqlandi” holati; “Saqlash” tugmasi darhol flush.
- Outbox’ga patch’lar yoziladi (Phase 12 uchun tayyor).
- Buzilgan ma’lumotdan tiklanish (oxirgi to‘g‘ri snapshot).

**Qabul:** brauzerni istalgan paytda yopib-ochganda hech narsa yo‘qolmaydi (integration test: fake-indexeddb).

▶ `PHASE 8 ni bajar.`

---

## PHASE 9 — Montaj rejimi

**Vazifalar**
- `/projects/[id]/install`: soddalashtirilgan reja (faqat ko‘rish + nuqtani bosish), xonalar navigatsiyasi, devor ko‘rinishi.
- Nuqta holati: Kutilmoqda → Jarayonda → Bajarildi (katta tugmalar, bir qo‘l bilan ishlash).
- Holat ranglari rejada; filtr: faqat bajarilmaganlar.
- `domain/progress.ts`: jami, bajarilgan, qolgan, foiz — “Loyiha holati” kartasi.
- Har o‘zgarish `InstallationTask` yozuvi sifatida (kim, qachon) lokal saqlanadi.

**Qabul:** telefonda qo‘lqop bilan ham bosish qulay; progress hech qachon yo‘qolmaydi.

▶ `PHASE 9 ni bajar. Avval telefon (390px) dizayni.`

---

## PHASE 10 — PDF eksport

**Vazifalar**
- pdf-lib + Inter shrift (o‘zbek harflari: o‘, g‘, sh, ch).
- Sahifalar: muqova (loyiha, buyurtmachi, manzil, sana, progress), reja (oq fonda), nuqtalar jadvali (xona bo‘yicha), devor ko‘rinishlari, shartli belgilar.
- iPad/iPhone Safari’da yuklab olish va ulashish ishlashi.

**Qabul:** 50+ nuqtali loyiha PDF’i 5 soniyadan tez, A4, chop etishga yaroqli.

▶ `PHASE 10 ni bajar.`

---

## PHASE 11 — PWA va offline

**Vazifalar**
- Serwist: manifest, ikonkalar, service worker, app shell kesh, shriftlar kesh.
- iOS “Bosh ekranga qo‘shish” uchun meta teglar va splash.
- Oflayn indikator; yangi versiya chiqqanda “Yangilash” xabari.

**Qabul:** Lighthouse PWA tekshiruvi o‘tadi; samolyot rejimida loyiha ochiladi va tahrirlanadi.

▶ `PHASE 11 ni bajar.`

---

## PHASE 12 — PostgreSQL sinxronizatsiya va autentifikatsiya

**Vazifalar**
- Prisma migratsiya (`prisma/schema.prisma`), seed (system symbols).
- Auth.js: email (magic link) yoki Google; lokal loyihalarni akkauntga biriktirish.
- `/api/sync`: revision asosida push/pull; `domain/merge.ts` konflikt qoidalari (holat hech qachon orqaga qaytmaydi); `ProjectHistory` yozuvi.
- Fon sinxronizatsiyasi: online bo‘lganda, har 10 s, tab faollashganda; exponential backoff.
- Header’da sinxron holati.
- Deploy: Vercel + Neon/Supabase.

**Qabul:** ikki qurilmada bir loyihani oflayn tahrirlab, keyin ulanganda ma’lumot yo‘qolmaydi (integration test).

▶ `PHASE 12 ni bajar. Avval merge.ts ni barcha konflikt holatlari uchun testlar bilan yoz.`

---

## PHASE 13 — To‘liq testlar va optimizatsiya

**Vazifalar**
- E2E ssenariy: loyiha → xonalar → nuqtalar → devor ko‘rinishi → montaj → PDF → oflayn → sinxron.
- Unit coverage `domain/` ≥ 90%.
- Performance: 500 nuqtali loyihada 60 fps; bundle tahlili; Konva layer caching.
- A11y: klaviatura, fokus, kontrast.
- Hujjatlar yakuniy yangilanadi.

▶ `PHASE 13 ni bajar va yakuniy hisobot ber.`

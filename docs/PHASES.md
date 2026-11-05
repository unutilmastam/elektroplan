# ELEKTROPLAN — Bosqichlar (13 phase)

Har bosqich oxirida: **test → xatolarni tuzatish → oldingi funksiyalarni tekshirish → `docs/PROGRESS.md` yangilash → hisobot → tasdiq kutish.**
Har bosqich alohida git branch: `phase-N`, tasdiqdan keyin `main` ga merge.

Har bosqichni Claude Code’da boshlash uchun tayyor prompt ham berilgan (▶).

---

## PHASE 1 — Loyiha poydevori + to‘liq dashboard dizayni

**Vazifalar**
- Next.js (App Router, `output: 'export'`, `trailingSlash: true`) + TS strict + Tailwind + shadcn/ui + ESLint/Prettier + Vitest + Playwright (6 qurilma profili, `docs/DEVICES.md`), pnpm.
- GitHub Actions: `ci.yml` (typecheck, lint, test, build) va `deploy.yml` (FTP → hostmaster.uz, `docs/DEPLOY.md`) — har push’dan keyin natijani iPad’da ko‘rish mumkin bo‘lsin.
- `public/.htaccess` (HTTPS, cache, statik sahifalar), `viewport-fit=cover`, safe-area.
- `docs/ARCHITECTURE.md` dagi papka tuzilmasini yaratish (bo‘sh modullar `index.ts` bilan).
- Dizayn tokenlari (`globals.css`), Inter shrift, `GlassPanel`, tugmalar, `ProgressRing`, `NumberField`, `ColorSwatches`.
- `i18n/uz.ts` — barcha matnlar.
- AppShell: Sidebar (logo, 6 ta nav, Jami loyihalar, Pro karta, foydalanuvchi), Header, Symbol bar, chap toolbar, markazda Konva `Stage` + grid (hali chizish yo‘q), o‘ng “Tanlangan nuqta” paneli, pastki qator (Xonalar ro‘yxati, Devor ko‘rinishi, Loyiha holati).
- Barcha 11 ta SVG belgining **ko‘rinishi** (`SymbolIcon`) — dizaynni moslash uchun.
- Demo ma’lumot faqat dev rejimda (`?demo=1`), referensdagi kabi uy rejasi bilan — dizaynni solishtirish uchun.
- Responsive skelet `docs/DEVICES.md` dagi 4 ta breakpoint bo‘yicha: iPad landshaft (asosiy), iPad portret, telefon (bottom nav, bottom sheet), Windows desktop.
- Nav bo‘yicha sahifa marshrutlari ishlaydi. Keyingi bosqich funksiyalari tugmalari `disabled` + “Keyingi bosqichda”.

**Qabul mezonlari**
- iPad landshaft 1180×820 va 1366×1024 skrinshotlari referensga vizual jihatdan juda yaqin.
- iPad portret 820×1180, iPhone 390×844, Android 412×915, Windows 1920×1080 da layout buzilmaydi, gorizontal scroll yo‘q.
- `pnpm build` statik `out/` beradi; deploy workflow sintaksisi to‘g‘ri (secrets qo‘shilganda ishlaydi).
- `pnpm typecheck lint test` o‘tadi; Playwright: sahifalar ochiladi, nav ishlaydi.

▶ `CLAUDE.md va docs/ ni o‘qi. PHASE 1 ni bajar: loyiha poydevori va referensga mos dashboard dizayni. Tugagach iPad landshaft/portret, iPhone, Android va Windows o‘lchamlarida skrinshot olib referens bilan solishtir, PROGRESS.md ni yangila va to‘xta.`

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
- Pan (bo‘sh joyni sudrash / ikki barmoq / Space+drag), zoom (g‘ildirak → kursorga, trackpad pinch, barmoq pinch), “ekranga sig‘dirish”.
- Apple Pencil: `pointerType='pen'` bilan chizish, kaft rad etish, “Faqat Pencil bilan chizish” sozlamasi; uzoq bosish = kontekst menyu.
- Pointer Events asosida asbob arxitekturasi (state machine) — sichqoncha, sensor, stilus.
- Select, marquee (ko‘p tanlash), Shift/Ctrl bilan qo‘shib tanlash, Delete, Esc.
- Undo/Redo: immer patches, drag birlashtiriladi, 200 qadam, Ctrl+Z / Ctrl+Shift+Z.
- Grid + snapping (grid, burchak 0/45/90).
- `domain/geometry.ts` + to‘liq unit testlar.

**Qabul:** iPad’da barmoq va Pencil bilan pan/zoom/chizish silliq (60 fps); Windows’da sichqoncha va klaviatura bilan ham; undo/redo har qanday amalni qaytaradi.

▶ `PHASE 3 ni bajar. geometry.ts va history ni avval testlar bilan yoz.`

---

## PHASE 4 — Xonalar va devorlar

**Vazifalar**
- Asboblar: to‘rtburchak xona, kvadrat xona, erkin (polygon) xona, alohida devor.
- Xona yaratilganda devorlar avtomatik; qo‘shni xonalar umumiy devorni bo‘lishadi (`domain/walls.ts`).
- Devorni siljitish (bog‘liq xonalar ham o‘zgaradi), devorni o‘chirish, devorni bo‘lish.
- Xona: nomlash (ikki marta bosish yoki panel), rang, nusxa, o‘chirish, label joyi.
- Eshik/deraza — faqat vizual devor bo‘shlig‘i (ixtiyoriy, CAD emas).
- **Qo‘lda chizish → avtomatik tekislash (egasining talabi, 2026-11-03):** iPhone/iPad’da barmoq yoki Pencil bilan xona shaklini qiyshiq chizsa ham, ilova uni toza ko‘pburchakka aylantiradi (`domain/sketch.ts`, sof funksiya + testlar):
  1. Chiziq nuqtalarini silliqlash va soddalashtirish (Ramer–Douglas–Peucker) → burchaklarni topish.
  2. Yo‘nalishlarni 0/45/90° ga tortish, deyarli parallel tomonlarni tenglashtirish; 4 burchakli shakl → aniq to‘rtburchak (tomonlari deyarli teng bo‘lsa → kvadrat).
  3. Boshi va oxiri yaqin bo‘lsa — shaklni yopish.
  4. Burchaklarni grid’ga va mavjud devor/burchaklarga yopishtirish, qo‘shni xona bilan umumiy devor hosil qilish.
  5. Ochiq chiziq → alohida devor(lar).
  - Natija darhol tekislangan ko‘rinishda chiqadi; bitta “Bekor qilish” (undo) qo‘lda chizilgan asl shaklga qaytaradi; sozlamada tekislashni o‘chirish mumkin.
- “Xonalar ro‘yxati” paneli real ma’lumotdan; ko‘z ikonkasi — xonaga fokus.

**Qabul:** referensdagi 6 xonali rejani 3 daqiqada chizish mumkin; o‘lcham hech qayerda so‘ralmaydi; iPhone’da barmoq bilan qiyshiq chizilgan to‘rtburchak/L-shakl/erkin xona toza shaklga aylanadi (unit testlar + e2e: sintetik “titroq” chiziq → kutilgan ko‘pburchak).

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
- `navigator.storage.persist()` so‘rovi.
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

## PHASE 11 — PWA va offline (internetsiz ishlash)

**Vazifalar**
- Serwist: manifest, ikonkalar (maskable, apple-touch), service worker, app shell + shrift kesh.
- Saqlangan loyihalarni **internetsiz ochish**: Loyihalar ro‘yxati, Chizma, Montaj rejimi va PDF eksport faqat IndexedDB’dan ishlaydi.
- “Zaxira nusxa”: bitta yoki barcha loyihalarni `.elektroplan.json` qilib eksport/import (iOS Fayllar, Telegram orqali).
- iOS uchun “Bosh ekranga qo‘shing” bir martalik eslatmasi (Safari ma’lumotni o‘chirmasligi uchun); Android `beforeinstallprompt`; Windows Edge/Chrome o‘rnatish.
- Oflayn indikator, “serverga yuborilmagan o‘zgarishlar” belgisi; yangi versiya chiqqanda “Yangilash” xabari.

**Qabul:** iPad, iPhone, Android va Windows’da samolyot rejimida ilova ochiladi, barcha saqlangan loyihalar ko‘rinadi, ochiladi, tahrirlanadi va PDF chiqadi. Lighthouse PWA tekshiruvi o‘tadi.

▶ `PHASE 11 ni bajar. Samolyot rejimi ssenariysini Playwright’da (offline context) barcha qurilma profillarida tekshir.`

---

## PHASE 12 — Server (PHP + MySQL), sinxronizatsiya va autentifikatsiya

**Vazifalar**
- `server/`: router, PDO, JSON xatolar, validatsiya; `migrate.php` + `001_init.sql`; system belgilar seed.
- Auth: telefon raqam/email + parol (bcrypt), httpOnly cookie sessiya, rate limit; lokal loyihalarni akkauntga biriktirish.
- `/api/sync`: revision asosida push/pull, bitta tranzaksiyada; `domain/merge.ts` konflikt qoidalari (montaj holati hech qachon orqaga qaytmaydi); `project_history` yozuvi.
- Login’dan keyin serverdagi **barcha** loyihalar IndexedDB’ga yuklanadi (boshqa qurilmada yaratilganlari ham offline ochiladi).
- Fon sinxronizatsiyasi: online bo‘lganda, har 10 s, tab faollashganda; exponential backoff.
- CI: `php -l`, deploy workflow `config.php` ni secrets’dan yozadi.

**Qabul:** iPad va telefonda bir loyihani oflayn tahrirlab, keyin ulanganda ma’lumot yo‘qolmaydi (integration test); hostmaster.uz’da ishlaydi.

▶ `PHASE 12 ni bajar. Avval merge.ts ni barcha konflikt holatlari uchun testlar bilan yoz, keyin PHP API.`

---

## PHASE 13 — To‘liq testlar va optimizatsiya

**Vazifalar**
- E2E ssenariy barcha qurilma profillarida: loyiha → xonalar → nuqtalar → devor ko‘rinishi → montaj → PDF → oflayn → sinxron.
- Haqiqiy qurilmalarda qo‘lda tekshiruv ro‘yxati: iPad (Pencil bilan), iPhone, Android, Windows.
- Unit coverage `domain/` ≥ 90%.
- Performance: 500 nuqtali loyihada 60 fps; bundle tahlili; Konva layer caching.
- A11y: klaviatura, fokus, kontrast.
- Hujjatlar yakuniy yangilanadi.

▶ `PHASE 13 ni bajar va yakuniy hisobot ber.`

---

## PHASE 14 — Admin panel va Pro versiya (egasi qo‘shgan, 2026-11-04)

> SPEC’dagi “umumiy admin panel qilinmasin” qoidasini egasi o‘zgartirdi: ustalar ro‘yxati, parol tiklash va Pro boshqaruvi kerak.

**Vazifalar**
- Admin: `ADMIN_LOGIN` (GitHub secret) dagi telefon/email bilan kirgan akkaunt. `/admin/`: ustalar ro‘yxati (ism, login, ro‘yxatdan o‘tgan, oxirgi kirish, loyiha/nuqta soni, montaj foizi), qidiruv.
- Pro: 99 000 so‘m/oy. Bepul — 1 ta loyiha (hammasi bilan). Pro’ni admin qo‘lda yoqadi: +1/+3/+12 oy, o‘chirish. Cheklov ilovada ham, serverda ham. Eski loyihalar saqlanadi.
- Parol tiklash: admin vaqtinchalik parol oladi, ustaning barcha sessiyalari yopiladi, usta keyingi kirishda yangi parol o‘rnatadi. O‘z parolini o‘zgartirish. Har amal `admin_actions` jurnalida.
- `/pro/` sahifasi: narx, imkoniyatlar, tarif holati, sotib olish tartibi, admin kontaktlari (`SUPPORT_PHONE`, `SUPPORT_TELEGRAM` — GitHub variables).

**Qabul:** server testlari (ruxsatlar, cheklov 402, Pro muddatlari, parol tiklash); e2e 6 profilda: bepul cheklov, admin → Pro → usta ko‘p loyiha yaratadi, parol tiklash → majburiy yangi parol.

---

## PHASE 15 — Barcha qurilmalarga moslashuv (rejada)

iPhone (kichik/katta), Samsung/Android, iPad (portret/landshaft, Split View), kompyuter: har ekran tekshiriladi, tugmalar, panellar, matnlar, klaviatura/xavfsiz hududlar tuzatiladi.

## PHASE 16 — Rus tili (rejada)

Barcha yozuvlar ruschaga, Sozlamalarda til tanlash (O‘zbekcha / Русский), telefon tiliga qarab avtomatik, PDF ham tanlangan tilda.

## PHASE 17 — Windows dasturi (egasi qo‘shgan, 2026-11-04)

Kompyuter uchun alohida o‘rnatiladigan dastur (Tauri v2, `src-tauri/`): o‘sha statik eksport ilova ichida, internetsiz ochiladi va ishlaydi, akkaunt bilan eplan.itcode.uz ga sinxronlanadi.

**Qabul mezonlari**
- GitHub Actions (`windows-latest`) `ElektroPlan-Setup.exe` (NSIS, foydalanuvchi uchun, admin huquqisiz) yig‘adi; `main` da GitHub Release va saytdagi `/download/` ga joylaydi.
- Dastur serversiz ham ochiladi, loyihalar saqlanadi; internet bo‘lsa kirish va sinxronlash ishlaydi.
- Server: Windows ilovasi uchun CORS (`tauri.localhost`) va `X-Elektroplan-Auth` token sessiyasi; veb cookie sessiyasi o‘zgarmaydi, token vebga hech qachon berilmaydi.
- Tashqi havolalar (Telegram) brauzerda ochiladi; dasturda “ilovani o‘rnatish” va service worker yo‘q.

## PHASE 18 — Devor o‘lchamlari (egasi qo‘shgan, 2026-11-04)

O‘lcham hech qachon majburiy emas. 1 reja birligi = 1 sm (devor 16 sm, to‘r 20 sm).

**Qabul mezonlari**
- Xona yoki devor chizilayotganda (barmoq, qalam, sichqoncha) uzunlik/eni-bo‘yi jonli ko‘rinadi; qo‘yib yuborilgan o‘lchamda qoladi.
- Devor panelida “Uzunligi (ixtiyoriy)”: “3,2”, “320”, “320 sm”, “3.2 m” qabul qilinadi; xona to‘g‘ri burchakli qoladi, qo‘shni xona birga cho‘ziladi; bitta “Bekor qilish” qaytaradi.
- Rejada devor uzunliklari (Sozlamalar → “Devor o‘lchamlari”, qurilma sozlamasi, standart: yoqilgan); qisqa devorda yozuv yashiriladi.

## PHASE 19 — Ixcham interfeys, rejani kattalashtirish (egasi qo‘shgan, 2026-11-05)

**Qabul mezonlari**
- Windows dasturi: “Interfeys o‘lchami” 70 / 80 / 90 / 100 % (WebView masshtabi, standart 80 %), dastur eslab qoladi.
- “Rejani yoyish” tugmasi: reja butun ish maydonini egallaydi, qayta bosish yoki Esc — qaytadi.
- ≥1024 px: pastki panellar (xonalar, devor ko‘rinishi, holat) tutqich bilan yig‘iladi/ochiladi, tortib balandligi o‘zgaradi; holat eslab qolinadi.
- Telefon (<600 px): tugma, chip, menyu, maydonlar ixchamroq (barmoq uchun ≥36 px, kiritish matni 16 px saqlanadi).

## PHASE 20 — 3 va 4 talik rozetka (egasi qo‘shgan, 2026-11-05)

**Qabul mezonlari**
- Yangi belgi `socket-quad` (“To‘rt rozetka”, 2×2 doira), “Uch rozetka” bilan birga asosiy belgi panelida.
- Panelga sig‘masa chiplar yonga suriladi, “Boshqa” doim ko‘rinadi.
- Server migratsiyasi 004 yangi belgini qo‘shadi; sinxron, PDF, materiallar ishlaydi.

## Keyin — Payme/Click onlayn to‘lov (merchant shartnoma tayyor bo‘lganda)
